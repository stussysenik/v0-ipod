import { createMotionSampler, type MotionDoc } from "./motion/doc";
import { poseForMove, type CameraMove, type StudioPose } from "./studio-camera";
import { createStateSampler } from "./theatre/keyframe-sampler";
import { buildPresetState, type MotionPreset } from "./theatre/motion-presets";
import { CAMERA_OBJECT_KEY, CAMERA_SHEET_ID, studioValuesToPose } from "./theatre/studio-project";

/**
 * The unified CLIP abstraction.
 *
 * The studio has two motion engines: the original procedural moves (sin/cos pose
 * generators in `studio-camera.ts`) and the new Theatre.js moment cards. Rather
 * than scatter `if (theatre) … else …` through the orbit rig and the offline
 * render loop, a Clip presents ONE interface — "given a phase in [0,1) and a hero
 * pose, give me a `StudioPose`" — and the consumers stay engine-agnostic. New
 * motion (procedural or keyframed) becomes available everywhere just by appearing
 * in the catalogue.
 *
 * Phase is the per-cycle position the caller already derived — `lib/motion/transport.ts`
 * owns clip-progress → phase for both engines, so loop semantics live in exactly one
 * place and neither engine carries a copy.
 */

export interface ProceduralClip {
	kind: "procedural";
	id: string;
	label: string;
	hint: string;
	move: CameraMove;
	naturalCycleSeconds: number;
	/** Procedural moves are built to close on the hero seam. */
	loopable: true;
}

export interface TheatreClip {
	kind: "theatre";
	id: string;
	label: string;
	hint: string;
	preset: MotionPreset;
	naturalCycleSeconds: number;
	loopable: boolean;
}

/**
 * A clip that IS a document — the shape every clip becomes once §2.9 retires the
 * generators, and today the shape a user-saved motion already has.
 *
 * Added rather than swapped in: deleting the procedural branch moves the camera (measured,
 * owner-gated), while a third branch moves nothing and is what lets a saved document be
 * flown by the same picker, the same preview and the same export loop as a shipped move.
 */
export interface DocumentClip {
	kind: "document";
	id: string;
	label: string;
	hint: string;
	doc: MotionDoc;
	naturalCycleSeconds: number;
	loopable: boolean;
}

export type StudioClip = ProceduralClip | TheatreClip | DocumentClip;

export function isTheatreClip(clip: StudioClip): clip is TheatreClip {
	return clip.kind === "theatre";
}

/** Present a document as a clip the existing picker + sampler already understand. */
export function documentClip(doc: MotionDoc): DocumentClip {
	return {
		kind: "document",
		id: doc.id,
		label: doc.label,
		hint: doc.hint ?? "",
		doc,
		naturalCycleSeconds: doc.naturalCycleSeconds,
		loopable: doc.loopable,
	};
}

/**
 * Build a reusable pose sampler for a clip + hero. For Theatre clips this anchors
 * the moment card onto the hero ONCE (cycle length 1, so phase maps straight to
 * sequence position) and reuses the sampler across frames — the offline render
 * loop calls this per clip, then the returned function per frame.
 */
export function createClipPoseSampler(
	clip: StudioClip,
	hero: StudioPose,
): (phase: number) => StudioPose {
	if (clip.kind === "procedural") {
		return (phase: number) => poseForMove(clip.move, phase, hero);
	}

	if (clip.kind === "document") {
		// A document's tracks are OFFSETS from the hero, so the hero is added after the
		// interpolation rather than before it. That ordering is what makes a document
		// portable across framings — and it is why a ported card cannot be bit-identical
		// to the card it came from (`lerp(h+a, h+b) ≠ h + lerp(a,b)`), measured at 5.68e-14.
		const sampler = createMotionSampler(clip.doc);
		return (phase: number) => {
			const offsets = sampler.sampleAll(phase);
			return {
				azimuth: hero.azimuth + (offsets.azimuth ?? 0),
				elevation: hero.elevation + (offsets.elevation ?? 0),
				reach: hero.reach + (offsets.reach ?? 0),
				target: [
					hero.target[0] + (offsets.targetX ?? 0),
					hero.target[1] + (offsets.targetY ?? 0),
					hero.target[2] + (offsets.targetZ ?? 0),
				],
			};
		};
	}

	// One cycle == one second of sequence time, so phase ∈ [0,1] is the position.
	const state = buildPresetState(clip.preset, hero, 1);
	const sampler = createStateSampler(state, CAMERA_SHEET_ID);
	return (phase: number) =>
		studioValuesToPose(sampler.sampleObject(CAMERA_OBJECT_KEY, phase));
}

/** Convenience: resolve a single pose. Prefer `createClipPoseSampler` in loops. */
export function resolveClipPose(clip: StudioClip, phase: number, hero: StudioPose): StudioPose {
	return createClipPoseSampler(clip, hero)(phase);
}
