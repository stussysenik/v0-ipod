import { hashString, stableStringify } from "../export/export-fingerprint";
import { buildTrack, type KeyframeSpec } from "../theatre/build-state";
import {
	clampHandlesX,
	easingHandles,
	EASING_NAMES,
	EASINGS,
	type CubicBezierHandles,
	type Ease,
	type EasingName,
} from "../theatre/easings";
import { sampleTrack } from "../theatre/keyframe-sampler";

/**
 * THE MOTION DOCUMENT — the open half of the motion vocabulary.
 *
 * The studio's motion used to be two closed things: procedural generators with
 * baked constants (`17 * Math.sin(phase)`) and moment cards whose easings could
 * only be named. Neither could be reached from the surface, so the only way to
 * change how a move FELT was to edit TypeScript. A `MotionDoc` is the same motion
 * expressed as data: per-axis tracks, each with its own keyframes, its own
 * per-segment curve, and its own phase offset.
 *
 * THREE PROPERTIES THAT ARE LOAD-BEARING, each earned rather than chosen:
 *
 * 1. **Tracks are independent and string-keyed.** A shared keyframe grid forces
 *    every axis to turn at the same instant, which is the mechanical feel. Real
 *    motion has elevation breathing slower than azimuth. Keying by `string` rather
 *    than by a camera-property union also means lighting keyframes will not need a
 *    format change to fit here later.
 *
 * 2. **Offsets, not absolutes.** A track's values are deltas from the hero pose the
 *    designer composed, so a document describes a MOVE rather than a location and
 *    stays meaningful when applied to any framing. This is the moment-card
 *    convention, kept deliberately.
 *
 * 3. **Sampling is pure and synchronous.** `sampleMotionDoc(doc, phase)` is a total
 *    function of its inputs with no clock and no warm prism, which is what lets the
 *    live preview, the offline export loop, and the proof renderer be the same
 *    engine instead of three that agree by inspection.
 *
 * WHAT THIS MODULE DOES NOT OWN: interpolation. Segment curves are solved by
 * `UnitBezier`, which is pinned to `@theatre/core` by `lib/theatre/theatre-parity.test.ts`,
 * and reached through the shared `buildTrack` / `sampleTrack` pair. This module
 * arranges keyframes; it never computes a value itself.
 */

export type { Ease };

/** A keyframe expressed as a delta from the hero pose, positioned within the cycle. */
export interface MotionKeyframe {
	/** Normalized position within one cycle: `0` = cycle start, `1` = cycle end. */
	at: number;
	/** Offset from the hero pose, in the track's native unit (degrees or world units). */
	value: number;
	/** Curve leaving this keyframe. A name or a hand-authored tuple. */
	easing?: Ease;
	/** Step out of this keyframe instead of tweening. */
	hold?: boolean;
}

export interface MotionTrack {
	keyframes: MotionKeyframe[];
	/**
	 * Sampling offset within the cycle, `[0,1)`. The cheapest organic knob there is:
	 * shifting one axis makes it arrive apart from the others, which is the whole
	 * difference between mechanical and organic character. The loop seam survives a
	 * phase shift, because a cycle that closes at zero still closes at zero when
	 * read from a different starting point.
	 */
	phase?: number;
}

/**
 * How clip time maps onto cycle phase. `loop` replays the cycle; `boomerang` plays
 * it forward then backward, and its turnaround is an authored curve rather than the
 * hardcoded smootherstep the procedural engine used — so a turnaround feels like
 * every other curve in the product instead of like a second easing implementation.
 */
export type TimeMap = { kind: "loop" } | { kind: "boomerang"; turnaround?: Ease };

export interface MotionDoc {
	id: string;
	label: string;
	hint?: string;
	/** Track key → track. String-keyed on purpose; see (1) above. */
	tracks: Record<string, MotionTrack>;
	/** Does the motion return to its seam, so repeating it closes without a pop? */
	loopable: boolean;
	/** A satisfying length for one cycle, in seconds. A default, not a constraint. */
	naturalCycleSeconds: number;
	/**
	 * Clip positions the timeline proof renders. A value in the document rather than a
	 * constant in the export layer, so a long or unusual move can ask for more marks
	 * without the proof code learning about it.
	 */
	proofPositions?: readonly number[];
}

/**
 * Where the timeline proof samples by default: the seam, the quarters, and just shy of the
 * close. Five frames is enough to show a turnaround and a seam, and cheap enough to warm
 * ambiently — comparable to what the existing scheduler already spends on neighbour warming.
 *
 * `0.999` rather than `1`: the last frame of an export sits just BEFORE the seam
 * (`i / total` never reaches 1), so proving position 1 would prove a frame no export renders.
 */
export const DEFAULT_PROOF_POSITIONS: readonly number[] = [0, 0.25, 0.5, 0.75, 0.999];

/** The positions a document's timeline proof covers, healed to the default. */
export function proofPositions(doc: Pick<MotionDoc, "proofPositions">): readonly number[] {
	const authored = doc.proofPositions;
	if (!Array.isArray(authored) || authored.length === 0) return DEFAULT_PROOF_POSITIONS;
	const clean = authored
		.filter((p) => typeof p === "number" && Number.isFinite(p) && p >= 0 && p < 1)
		.sort((a, b) => a - b);
	return clean.length > 0 ? clean : DEFAULT_PROOF_POSITIONS;
}

/**
 * A sparse edit laid over a catalogue document — the shape a look STORES when the user has
 * tuned a shipped move rather than saved a new one.
 *
 * By value would fork the truth: a later revision of Orbit could never reach a saved look
 * that copied it. By id alone would lose the tuning, which is the defect this exists to
 * close. Id plus a sparse override keeps both, and it is the same ruling
 * `update-studio-theme-authoring` settled for rigs.
 *
 * The unit of override is the TRACK, not the keyframe. A track is what an edit gesture
 * produces — drag a curve and that axis changes as a whole — and a keyframe-level diff would
 * have to answer what a re-timed keyframe means against a base that moved underneath it. An
 * absent track keeps tracking the catalogue.
 */
export interface MotionOverrides {
	tracks?: Record<string, MotionTrack>;
	naturalCycleSeconds?: number;
}

/** Lay a sparse override over a catalogue document. Absent fields keep tracking the base. */
export function resolveMotionDoc(base: MotionDoc, overrides?: MotionOverrides): MotionDoc {
	if (!overrides || (!overrides.tracks && overrides.naturalCycleSeconds === undefined)) {
		return base;
	}
	return {
		...base,
		naturalCycleSeconds: overrides.naturalCycleSeconds ?? base.naturalCycleSeconds,
		tracks: { ...base.tracks, ...overrides.tracks },
	};
}

/** The curve used when a keyframe does not name one — a breathing, non-mechanical default. */
export const DEFAULT_MOTION_EASING: EasingName = "easeInOutSine";

/**
 * Resolve any easing to solver-ready control points, clamping X into `[0,1]` and
 * leaving Y free.
 *
 * THIS IS THE FORMAT BOUNDARY. Named curves are already in range (guarded by
 * `easings.test.ts`), so the clamp exists for hand-authored tuples arriving from a
 * dragged handle or a decoded share link. Clamping here rather than inside
 * `easingHandles` keeps the Theatre modules untouched by an authoring concern.
 */
export function resolveEase(ease: Ease | undefined): CubicBezierHandles {
	return clampHandlesX(easingHandles(ease ?? DEFAULT_MOTION_EASING));
}

/**
 * Name a curve if the vocabulary already contains it, otherwise report it as custom.
 * The inspector uses this so a hand-dragged curve that lands exactly on a known one
 * is called by its name rather than by four decimals.
 */
export function easeName(ease: Ease): EasingName | null {
	if (typeof ease === "string") {
		return ease;
	}
	for (const name of EASING_NAMES) {
		const h = EASINGS[name];
		if (h[0] === ease[0] && h[1] === ease[1] && h[2] === ease[2] && h[3] === ease[3]) {
			return name;
		}
	}
	return null;
}

/** Wrap a phase into `[0,1)`, correct for negative offsets as well as overshoot. */
export function wrapPhase(phase: number): number {
	if (!Number.isFinite(phase)) {
		return 0;
	}
	const wrapped = phase % 1;
	return wrapped < 0 ? wrapped + 1 : wrapped;
}

/**
 * Convert one motion track into the Theatre track shape the shared sampler reads.
 *
 * Positions are normalized so one cycle is one unit of sequence time, which makes
 * phase and position the same number and removes a scaling step from every sample.
 */
function toTheatreTrack(track: MotionTrack, debugName: string): ReturnType<typeof buildTrack> {
	const keyframes: KeyframeSpec[] = track.keyframes.map((kf) => ({
		position: kf.at,
		value: kf.value,
		easing: resolveEase(kf.easing),
		hold: kf.hold,
	}));
	return buildTrack({ keyframes }, debugName);
}

export interface MotionSampler {
	readonly trackKeys: string[];
	/** Offset from the hero for one track at `phase`; `0` when the track is absent. */
	sample(trackKey: string, phase: number): number;
	/** Every track's offset at `phase`. */
	sampleAll(phase: number): Record<string, number>;
}

/**
 * Build a reusable sampler for a document. Tracks are converted once and reused
 * across frames — the export loop calls this per clip and the returned reader per
 * frame, which is the same shape `createClipPoseSampler` already established.
 */
export function createMotionSampler(doc: MotionDoc): MotionSampler {
	const tracks = new Map<string, { track: ReturnType<typeof buildTrack>; phase: number }>();
	for (const [key, track] of Object.entries(doc.tracks)) {
		tracks.set(key, {
			track: toTheatreTrack(track, `${doc.id}:${key}`),
			phase: wrapPhase(track.phase ?? 0),
		});
	}
	const trackKeys = Array.from(tracks.keys());

	function sample(trackKey: string, phase: number): number {
		const entry = tracks.get(trackKey);
		if (!entry) {
			return 0;
		}
		return sampleTrack(entry.track, wrapPhase(phase + entry.phase));
	}

	return {
		trackKeys,
		sample,
		sampleAll(phase: number): Record<string, number> {
			const out: Record<string, number> = {};
			for (const key of trackKeys) {
				out[key] = sample(key, phase);
			}
			return out;
		},
	};
}

/** Convenience single read. Prefer `createMotionSampler` inside a loop. */
export function sampleMotionDoc(doc: MotionDoc, phase: number): Record<string, number> {
	return createMotionSampler(doc).sampleAll(phase);
}

/**
 * A stable identity for a document's SAMPLED BEHAVIOUR.
 *
 * Deliberately excludes `label` and `hint`: renaming a saved motion must not
 * invalidate cached proof frames, because renaming does not move the camera. It
 * includes every field that does — keyframes, curves, phase offsets, loopability.
 * Easings are resolved to tuples first, so `easeOutCubic` and its literal control
 * points hash alike, which is the same claim the format makes everywhere else.
 *
 * Built on the existing `stableStringify` + `hashString` rather than a second hash.
 * NOTE the import direction: this module reads two pure helpers out of the export
 * layer. If the export fingerprint ever needs to import back from here, extract
 * those helpers to a neutral module rather than resolving the cycle in place.
 */
export function motionDocHash(doc: MotionDoc): string {
	const canonical = stableStringify({
		loopable: doc.loopable,
		naturalCycleSeconds: doc.naturalCycleSeconds,
		tracks: Object.fromEntries(
			Object.keys(doc.tracks)
				.sort()
				.map((key) => [key, canonicalTrack(doc.tracks[key])]),
		),
	});
	return hashString(canonical);
}

/**
 * One track reduced to the fields that decide what it SAMPLES: keyframes in position
 * order, easings resolved to tuples, absent flags made explicit.
 *
 * Extracted from `motionDocHash` because the inspector needs the same comparison for a
 * different question — "is this edited track still the shipped one?" — and two canonical
 * forms would eventually disagree about whether a named curve equals its control points.
 * Resolving the easing is what makes `easeOutCubic` and its tuple compare equal; making
 * `hold` explicit is what stops an absent flag reading as a deviation.
 */
export function canonicalTrack(track: MotionTrack): {
	phase: number;
	keyframes: Array<{ at: number; value: number; easing: CubicBezierHandles; hold: boolean }>;
} {
	return {
		phase: wrapPhase(track.phase ?? 0),
		keyframes: [...track.keyframes]
			.sort((a, b) => a.at - b.at)
			.map((kf) => ({
				at: kf.at,
				value: kf.value,
				easing: resolveEase(kf.easing),
				hold: kf.hold === true,
			})),
	};
}
