import { poseForMove, type CameraMove, type LoopStyle, type StudioPose } from "./studio-camera";
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
 * Phase is the per-cycle position the caller already derived (`phaseForProgress` /
 * `pingPong` apply loop vs boomerang), so loop semantics live in exactly one place
 * for both engines.
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

export type StudioClip = ProceduralClip | TheatreClip;

export function isTheatreClip(clip: StudioClip): clip is TheatreClip {
	return clip.kind === "theatre";
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

/**
 * How many whole motion cycles fill a clip of `durationSec` — the engine-agnostic
 * version of `cyclesForDuration`, working off the clip's `naturalCycleSeconds`. A
 * whole-number count guarantees the clip closes on its loop seam; `boomerang`
 * halves it because one round-trip covers twice the path. Identical math to the
 * procedural cadence so procedural clips behave exactly as before.
 */
export function clipCyclesForDuration(
	clip: StudioClip,
	durationSec: number,
	speed = 1,
	loop: LoopStyle = "loop",
): number {
	const raw = (durationSec * speed) / clip.naturalCycleSeconds;
	return Math.max(1, Math.round(loop === "boomerang" ? raw / 2 : raw));
}
