import { clampHandlesX, EASINGS, type Ease, type EasingName } from "../theatre/easings";
import { CATALOGUE_DOCS } from "./catalogue";
import type { MotionKeyframe, MotionOverrides, MotionTrack, TimeMap } from "./doc";
import {
	DEFAULT_DURATION_SEC,
	DEFAULT_REPEAT,
	DEFAULT_TIME_MAP,
	repeatFromSpeed,
} from "./transport";

/**
 * THE MOTION SLICE — the authored camera motion as model data, and the one place a stored
 * motion is healed on the way in.
 *
 * It lives here rather than in `lib/ipod-state/model.ts` so the motion library owns its own
 * shape and its own migration: the model imports the slice, never the other way round, and
 * `sanitizeMotionState` is reachable from storage, the share-link codec and the shelf
 * without any of them importing the workbench model.
 *
 * HEALING IS TOTAL AND NEVER THROWS, the same discipline every storage boundary here keeps.
 * A field that is missing, the wrong type, or NaN heals to its default; unknown fields are
 * dropped rather than carried. The one thing that is CONVERTED rather than dropped is a
 * legacy `speed`, because it names a cadence that was really being flown.
 */

export interface MotionState {
	/** Catalogue id, or the id of a user-saved document. */
	docId: string;
	/** Sparse per-track edits on top of that document; absent = pristine. */
	overrides?: MotionOverrides;
	/** Whole cycles across the clip. `0` holds the hero — amplitude zero, not a time map. */
	repeat: number;
	/** Clip length in seconds. With `repeat`, this derives the cycle length readout. */
	durationSec: number;
	timeMap: TimeMap;
	/** Playhead over the whole clip, `[0,1)`. Excluded at the codec boundary. */
	playhead: number;
	/** Transport running. Excluded at the codec boundary. */
	playing: boolean;
}

/**
 * The shaping half of the slice — what a motion IS, minus where its playhead happens to sit.
 *
 * A shelf entry stores this beside its document, because the inspector edits all four in one
 * panel: saving the tracks and dropping the cadence would make Save mean half the surface.
 * `playhead` and `playing` are deliberately outside it, the same line `withoutTransport`
 * draws — where you are in a clip is a fact about this session, not about the motion.
 */
export type MotionCadence = Pick<MotionState, "repeat" | "durationSec" | "timeMap">;

export const DEFAULT_MOTION_STATE: MotionState = {
	docId: "orbit",
	repeat: DEFAULT_REPEAT,
	durationSec: DEFAULT_DURATION_SEC,
	timeMap: DEFAULT_TIME_MAP,
	playhead: 0,
	playing: false,
};

/** Clip length bounds — the export dock's slider range, enforced at the model boundary. */
export const MIN_DURATION_SEC = 2;
export const MAX_DURATION_SEC = 60;

/**
 * Repeat is bounded, not because a bigger number is meaningless but because it is
 * unrenderable: at 60s and 240 repeats a cycle is a quarter of a second, below the point
 * where a camera move reads as a move at all.
 */
export const MAX_REPEAT = 240;

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function finite(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, lo: number, hi: number): number {
	return value < lo ? lo : value > hi ? hi : value;
}

/**
 * Heal a stored easing. A name survives only if the vocabulary still contains it; a tuple
 * survives with X clamped, which is the same format boundary `resolveEase` enforces. Anything
 * else returns `undefined` so the keyframe falls back to the default curve rather than
 * handing the bezier solver a value it cannot invert.
 */
function sanitizeEase(value: unknown): Ease | undefined {
	if (typeof value === "string") {
		return value in EASINGS ? (value as EasingName) : undefined;
	}
	if (
		Array.isArray(value) &&
		value.length === 4 &&
		value.every((n) => typeof n === "number" && Number.isFinite(n))
	) {
		return clampHandlesX(value as [number, number, number, number]);
	}
	return undefined;
}

function sanitizeKeyframe(value: unknown): MotionKeyframe | null {
	const kf = asRecord(value);
	if (!kf) return null;
	const at = finite(kf.at, Number.NaN);
	const val = finite(kf.value, Number.NaN);
	if (!Number.isFinite(at) || !Number.isFinite(val)) return null;
	const keyframe: MotionKeyframe = { at: clamp(at, 0, 1), value: val };
	const easing = sanitizeEase(kf.easing);
	if (easing !== undefined) keyframe.easing = easing;
	if (kf.hold === true) keyframe.hold = true;
	return keyframe;
}

function sanitizeTrack(value: unknown): MotionTrack | null {
	const track = asRecord(value);
	if (!track || !Array.isArray(track.keyframes)) return null;
	const keyframes = track.keyframes
		.map(sanitizeKeyframe)
		.filter((kf): kf is MotionKeyframe => kf !== null)
		.sort((a, b) => a.at - b.at);
	// A track needs two keyframes to describe motion; one is a constant offset the base
	// document expresses better by not being overridden at all.
	if (keyframes.length < 2) return null;
	const track_: MotionTrack = { keyframes };
	const phase = finite(track.phase, 0);
	if (phase !== 0) track_.phase = phase;
	return track_;
}

/** Heal a stored sparse override. Returns `undefined` when nothing survives — pristine. */
export function sanitizeMotionOverrides(value: unknown): MotionOverrides | undefined {
	const source = asRecord(value);
	if (!source) return undefined;
	const overrides: MotionOverrides = {};
	const tracks = asRecord(source.tracks);
	if (tracks) {
		const healed: Record<string, MotionTrack> = {};
		for (const [key, track] of Object.entries(tracks)) {
			const sane = sanitizeTrack(track);
			if (sane) healed[key] = sane;
		}
		if (Object.keys(healed).length > 0) overrides.tracks = healed;
	}
	const natural = finite(source.naturalCycleSeconds, Number.NaN);
	if (Number.isFinite(natural) && natural > 0) overrides.naturalCycleSeconds = natural;
	return overrides.tracks || overrides.naturalCycleSeconds !== undefined ? overrides : undefined;
}

/**
 * Read a time map, accepting the v1 `loop: "loop" | "boomerang" | "hold"` string as well as
 * the authored `{ kind, turnaround }` record.
 *
 * `"hold"` has no successor here on purpose: holding is `repeat: 0`, which the repeat field
 * carries, so the time map heals to `loop` and the caller reads the hold off the count.
 */
function sanitizeTimeMap(value: unknown, legacyLoop: unknown): TimeMap {
	const source = asRecord(value);
	if (!source) {
		return legacyLoop === "boomerang" ? { kind: "boomerang" } : { kind: "loop" };
	}
	if (source.kind !== "boomerang") return { kind: "loop" };
	const turnaround = sanitizeEase(source.turnaround);
	return turnaround === undefined ? { kind: "boomerang" } : { kind: "boomerang", turnaround };
}

export interface SanitizeMotionOptions {
	/**
	 * Natural cycle length of the document a legacy `speed` was recorded against, used only
	 * by the `speed → repeat` conversion.
	 *
	 * Absent means the SHIPPED CATALOGUE is consulted for the document the payload names,
	 * which is total for every payload a `speed` can appear in: `speed` predates the shelf,
	 * so a legacy record can only name one of the five moves. Supplying it explicitly is for
	 * a caller that knows a cadence the catalogue does not — a shelf document. Left to the
	 * caller, this would be the same lookup written at four boundaries, and it shipped
	 * written at none of them: every legacy `speed` silently converted to one cycle.
	 */
	naturalCycleSeconds?: number;
}

/** The cadence a shipped move was authored at, or `NaN` for anything the catalogue has not. */
function catalogueCycleSeconds(docId: string): number {
	return CATALOGUE_DOCS[docId as keyof typeof CATALOGUE_DOCS]?.naturalCycleSeconds ?? Number.NaN;
}

/**
 * Heal a stored motion slice, converting a legacy `speed` on the way in.
 *
 * The conversion is ONE-WAY and happens exactly here. `speed` scaled a derived cycle count;
 * `repeat` is the count itself. Reading the flown count out of the old three inputs is the
 * only interpretation that keeps a decoded look playing the way it was authored, and once
 * converted the field is dropped — there is no path that writes it again.
 */
export function sanitizeMotionState(
	value: unknown,
	options: SanitizeMotionOptions = {},
): MotionState {
	const source = asRecord(value);
	if (!source) return { ...DEFAULT_MOTION_STATE };

	const timeMap = sanitizeTimeMap(source.timeMap, source.loop);
	const durationSec = clamp(
		finite(source.durationSec, DEFAULT_MOTION_STATE.durationSec),
		MIN_DURATION_SEC,
		MAX_DURATION_SEC,
	);

	const docId =
		typeof source.docId === "string" && source.docId.length > 0
			? source.docId
			: typeof source.move === "string" && source.move.length > 0
				? source.move // v1 export snapshots named the document `move`.
				: DEFAULT_MOTION_STATE.docId;

	// `repeat` wins when present; a payload that predates it converts its `speed`, and a
	// v1 `loop: "hold"` is amplitude zero however fast it claimed to be going.
	const storedRepeat = source.repeat;
	const repeat =
		typeof storedRepeat === "number" && Number.isFinite(storedRepeat)
			? clamp(storedRepeat, 0, MAX_REPEAT)
			: source.loop === "hold"
				? 0
				: typeof source.speed === "number" && Number.isFinite(source.speed)
					? clamp(
							repeatFromSpeed(
								durationSec,
								source.speed,
								options.naturalCycleSeconds ?? catalogueCycleSeconds(docId),
								timeMap.kind,
							),
							0,
							MAX_REPEAT,
						)
					: DEFAULT_MOTION_STATE.repeat;

	const overrides = sanitizeMotionOverrides(source.overrides);
	const state: MotionState = {
		docId,
		repeat,
		durationSec,
		timeMap,
		playhead: clamp(finite(source.playhead, 0), 0, 1),
		playing: source.playing === true,
	};
	if (overrides) state.overrides = overrides;
	return state;
}

/**
 * The motion as it crosses a boundary that must not carry a transport position: a share
 * link, a config file, a reload.
 *
 * Deliberately separate from `sanitizeMotionState`, which HEALS and is folded through
 * `normalizeModel` on every model edit. If healing also reset the playhead, editing the
 * song title mid-playback would rewind the preview — the reset belongs to the boundary,
 * not to the fold, exactly as `isNowPlayingEditable: false` is written at each boundary.
 */
export function withoutTransport(motion: MotionState): MotionState {
	return { ...motion, playhead: 0, playing: false };
}
