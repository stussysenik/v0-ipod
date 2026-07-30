import { stableStringify } from "../export/export-fingerprint";
import { EASINGS, type Ease } from "../theatre/easings";
import {
	canonicalTrack,
	easeName,
	resolveEase,
	wrapPhase,
	type MotionKeyframe,
	type MotionTrack,
} from "./doc";

/**
 * THE TRACK EDIT — what a drag on one inspector row does to one track, expressed as data.
 *
 * The stored unit of override is a whole `MotionTrack` (D7), which is the right thing to
 * persist and the wrong thing to drag: a slider needs a scalar, and a scalar recovered from
 * a stored track is the only way a control can show the value it holds after a reload. So
 * an edit is three scalars — gain, phase, curve — and this module is the pair of functions
 * that converts between them and the track the model stores.
 *
 * EVERY EDIT IS DERIVED FROM THE BASE, NEVER FROM THE PREVIOUS EDIT. `applyTrackEdit` always
 * starts at the shipped track, so dragging gain 100 → 40 → 100 returns the pristine values
 * exactly rather than approximately, and there is no accumulating float drift down a drag.
 * `readTrackEdit(base, stored)` recovers the scalars, so the round trip closes both ways.
 *
 * GAIN IS AMPLITUDE, AND AMPLITUDE ZERO IS THE HERO. A track's values are offsets from the
 * composed pose, so scaling them by zero contributes nothing — which is exactly the closed
 * form `poseAtProgress` already uses for `repeat: 0`. The per-track knob and the transport
 * knob therefore mean the same thing at their zero, rather than two things that happen to
 * look alike.
 *
 * WHY A CURVE EDIT UNIFIES THE TRACK. The catalogue's segments alternate deliberately —
 * `easeOutSine` rising, `easeInSine` falling, which is what makes a quarter-keyframe track
 * an exact sine. A dragged handle is one curve, so it lands on every segment and the
 * alternation goes with it. That is a real change of character, not a rounding: it is the
 * spec's "linear toward easeInOutSine" axis, and it is why a pristine catalogue track reads
 * `Mixed` rather than naming a curve it does not have. The port floor measured in §2 governs
 * the shipped documents, which no edit here mutates.
 */

export type TrackUnit = "deg" | "unit";

interface TrackMeta {
	label: string;
	unit: TrackUnit;
}

/**
 * The track keys the pose bridge reads (`createClipPoseSampler`), named for the surface.
 * A key with no entry is not an error — the format is string-keyed so lighting tracks can
 * arrive without a format change (D9) — it falls back to its own name and world units.
 */
export const TRACK_META: Record<string, TrackMeta> = {
	azimuth: { label: "Azimuth", unit: "deg" },
	elevation: { label: "Elevation", unit: "deg" },
	reach: { label: "Reach", unit: "unit" },
	targetX: { label: "Target X", unit: "unit" },
	targetY: { label: "Target Y", unit: "unit" },
	targetZ: { label: "Target Z", unit: "unit" },
};

/** Picker order for track rows: the three axes a camera move is authored in, then targets. */
export const TRACK_ORDER: readonly string[] = [
	"azimuth",
	"elevation",
	"reach",
	"targetX",
	"targetY",
	"targetZ",
];

/** Document order for the inspector's rows: known axes first, then anything else, sorted. */
export function orderedTrackKeys(tracks: Record<string, MotionTrack>): string[] {
	// Annotated: `Object.keys` resolves to `never[] | string[]` under this project's lib set,
	// and the `never[]` arm makes `includes` reject a string.
	const keys: string[] = Object.keys(tracks);
	const known = TRACK_ORDER.filter((key) => keys.includes(key));
	const rest = keys.filter((key) => !TRACK_ORDER.includes(key)).sort();
	return [...known, ...rest];
}

export function trackLabel(key: string): string {
	const meta = TRACK_META[key];
	if (meta) return meta.label;
	const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function trackUnit(key: string): TrackUnit {
	return TRACK_META[key]?.unit ?? "unit";
}

/** Degrees read to one decimal and drop it when whole; world units always read two. */
function formatValue(value: number, unit: TrackUnit): string {
	if (unit === "deg") {
		const rounded = Math.round(value * 10) / 10;
		return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}°`;
	}
	return value.toFixed(2);
}

export function trackRange(track: MotionTrack): { min: number; max: number } {
	if (track.keyframes.length === 0) return { min: 0, max: 0 };
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const kf of track.keyframes) {
		if (kf.value < min) min = kf.value;
		if (kf.value > max) max = kf.value;
	}
	return { min, max };
}

/** Peak absolute offset — the scale a gain multiplies, and what `readTrackEdit` divides. */
export function trackPeak(track: MotionTrack): number {
	let peak = 0;
	for (const kf of track.keyframes) {
		const magnitude = Math.abs(kf.value);
		if (magnitude > peak) peak = magnitude;
	}
	return peak;
}

/**
 * The value a track row carries beside its name.
 *
 * Three shapes because a track has three honest ones, and collapsing them would state a
 * falsehood about two: a sway is `±17°` (symmetric about the hero), a turn is `360°` (all
 * of it on one side), and a dolly that also sits further out is the range it covers. The
 * turntable is the case that forces this — reading its azimuth as `±180°` would name a
 * half-turn either side of the hero, which is not the move.
 */
export function trackReadout(key: string, track: MotionTrack): string {
	const unit = trackUnit(key);
	const { min, max } = trackRange(track);
	const span = max - min;
	if (span <= 0) return formatValue(max, unit);
	const epsilon = 1e-9 * Math.max(1, span);
	if (Math.abs(min + max) <= epsilon) return `±${formatValue(max, unit)}`;
	if (Math.abs(min) <= epsilon) return formatValue(max, unit);
	if (Math.abs(max) <= epsilon) return formatValue(min, unit);
	return `${formatValue(min, unit)}…${formatValue(max, unit)}`;
}

export interface TrackEdit {
	/** Multiplier on every keyframe value. `1` is the shipped track; `0` is the hero. */
	gain: number;
	/** Sampling offset within the cycle, `[0,1)`. */
	phase: number;
	/** One curve across every segment, or `null` to keep the document's authored curves. */
	curve: Ease | null;
}

export const PRISTINE_TRACK_EDIT: TrackEdit = { gain: 1, phase: 0, curve: null };

/**
 * Gain ceiling. Not a rail on the format — a track may hold any value, and the sampler
 * clamps nothing — but on the control. The travel that matters is between nothing and the
 * authored amount; a slider that reaches ten times it spends nine tenths of its length
 * where the shipped move is no longer the move.
 */
export const MAX_TRACK_GAIN = 2;

function sameHandles(a: Ease, b: Ease): boolean {
	const x = resolveEase(a);
	const y = resolveEase(b);
	return x[0] === y[0] && x[1] === y[1] && x[2] === y[2] && x[3] === y[3];
}

/**
 * The one curve every segment carries, or `null` when they differ — or when none is
 * authored, because writing the default onto keyframes that omitted it would make a
 * pristine track compare as edited. (The same shape as a stored rig's `castShadow:
 * undefined` reading as a deviation from its preset: an absent field is not a value.)
 *
 * The LAST keyframe is excluded: it closes the cycle and its outgoing curve is never read,
 * which is why the catalogue leaves it unset.
 */
export function unifiedEase(track: MotionTrack): Ease | null {
	const segments = track.keyframes.slice(0, -1);
	if (segments.length === 0) return null;
	const first = segments[0].easing;
	if (first === undefined) return null;
	return segments.every((kf) => kf.easing !== undefined && sameHandles(kf.easing, first))
		? first
		: null;
}

/** How a curve reads on a row: its name, `Custom` for an unnamed tuple, `Mixed` for a track. */
export function curveLabel(ease: Ease): string {
	return easeName(ease) ?? "Custom";
}

/** How a whole track's curve reads. `Mixed` is the pristine catalogue case; see the header. */
export function trackCurveLabel(track: MotionTrack): string {
	const unified = unifiedEase(track);
	return unified === null ? "Mixed" : curveLabel(unified);
}

/** Lay an edit over the shipped track. Always called with the BASE; see the header. */
export function applyTrackEdit(base: MotionTrack, edit: TrackEdit): MotionTrack {
	const last = base.keyframes.length - 1;
	const keyframes: MotionKeyframe[] = base.keyframes.map((kf, index) => {
		const next: MotionKeyframe = { ...kf, value: kf.value * edit.gain };
		if (edit.curve !== null && index < last) next.easing = edit.curve;
		return next;
	});
	const track: MotionTrack = { keyframes };
	const phase = wrapPhase(edit.phase);
	if (phase !== 0) track.phase = phase;
	return track;
}

/**
 * Recover the three scalars a stored track represents. A base with no amplitude (a card
 * track left flat) has no gain to recover, so it reports pristine rather than dividing by
 * zero — its row is a curve and a phase, and its slider has nothing to scale.
 */
export function readTrackEdit(base: MotionTrack, stored?: MotionTrack): TrackEdit {
	if (!stored) return PRISTINE_TRACK_EDIT;
	const basePeak = trackPeak(base);
	return {
		gain: basePeak > 0 ? trackPeak(stored) / basePeak : 1,
		phase: wrapPhase(stored.phase ?? 0),
		curve: unifiedEase(stored),
	};
}

/**
 * Is this track still the shipped one?
 *
 * The inspector asks before storing: a track that has been dragged back to where it started
 * must CLEAR its override rather than store a copy of the base, or the look stops tracking
 * later revisions of the catalogue document — the defect `update-studio-theme-authoring`
 * measured on a saved theme's rig. Compared through `canonicalTrack`, so a named curve and
 * its control points are the same track and an absent `hold` is not a deviation.
 */
export function isPristineTrack(base: MotionTrack, track: MotionTrack): boolean {
	return stableStringify(canonicalTrack(base)) === stableStringify(canonicalTrack(track));
}

/** The named curves offered as starting points, in the order the picker lists them. */
export const CURVE_VOCABULARY = Object.keys(EASINGS) as Array<keyof typeof EASINGS>;
