import { wrapPhase } from "../motion/doc";
import { MAX_TRACK_GAIN, type TrackEdit } from "../motion/track-edit";
import type { CubicBezierHandles } from "../theatre/easings";
import type { Viewport } from "./arcball";
import { pointerVelocity, type PointerSample } from "./pointer-intent";

/**
 * THROW TO EDIT — the release of a drag, converted to the three scalars the model already has.
 *
 * `lib/motion/track-edit.ts` stores an edit as `{gain, phase, curve}` and derives every edit
 * from the SHIPPED BASE rather than from the previous edit. A throw produces exactly three
 * numbers: how fast the hand was going, which way it was going, and how much the path was
 * turning. The gesture and the model are the same shape, so this module is a mapping and not
 * a format: no new persisted field, no `FINGERPRINT_VERSION` bump, no keyframe editor.
 *
 * SPEED IS MEASURED IN SCREENS, NOT PIXELS. A throw across a phone and a throw across a 1080p
 * canvas mean the same thing to the hand, and pixels per millisecond would make the phone's
 * mean a third as much. Normalising by the viewport's short side is what lets one threshold
 * hold at every viewport — the same reason a wedge is a direction rather than a distance.
 *
 * DETERMINISM. Every input arrives on the samples; nothing reads a clock or a random source.
 * The stored scalars are quantised so a motion document diffs as values rather than as float
 * noise, and so an identical gesture replayed writes byte-identical bytes.
 */

/**
 * Below this release speed, in screen-widths per second, the press placed the camera and did
 * not throw it: no track is written and the pose holds. One threshold, one home — the pointer
 * reducer's `throwing` phase is kinematic and deliberately does not duplicate this number.
 */
export const AUTHORING_SPEED_SCREENS_PER_S = 0.28;

/** The release speed that reads as the shipped amplitude — `gain` 1, the catalogue's own move. */
export const REFERENCE_SPEED_SCREENS_PER_S = 1.2;

/** Net turning below this is a straight drag, and a straight drag keeps the authored curves. */
export const CURVE_DEADBAND = 0.05;

/** Four decimals: finer than any control reads, coarser than float noise. */
const QUANTUM = 1e-4;

function quantize(value: number): number {
	return Math.round(value / QUANTUM) * QUANTUM;
}

function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/** Wrap a heading difference into `(-π, π]` so a path that crosses ±π does not read as a spin. */
function wrapSigned(radians: number): number {
	const wrapped = ((radians + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
	return wrapped - Math.PI;
}

/**
 * Signed net turning of the drag path, normalised so a half-turn reads 1.
 *
 * Positive is counter-clockwise on screen. Summing heading DIFFERENCES rather than fitting a
 * circle keeps this a single pass over the trail and makes a straight drag read exactly zero,
 * which is what the deadband needs in order to mean "the hand did not ask for a curve".
 */
export function pathCurvature(trail: readonly PointerSample[]): number {
	let turning = 0;
	let previous: number | null = null;
	for (let i = 1; i < trail.length; i++) {
		const dx = trail[i].x - trail[i - 1].x;
		const dy = trail[i].y - trail[i - 1].y;
		if (dx === 0 && dy === 0) continue;
		// Screen y grows downward; negate once here so positive turning is counter-clockwise.
		const heading = Math.atan2(-dy, dx);
		if (previous !== null) turning += wrapSigned(heading - previous);
		previous = heading;
	}
	return clamp(turning / Math.PI, -1, 1);
}

/**
 * Curvature → one cubic-bezier laid across every segment.
 *
 * A one-parameter family pinned at linear: `c = 0` is `[1/3, 1/3, 2/3, 2/3]`, positive `c`
 * eases in and out of the cycle, negative `c` does the opposite. The X control points stay
 * within `[0,1]` across the whole range of `c`, which is the domain constraint
 * `clampHandlesX` enforces — so no throw can author a curve that runs backwards in time.
 *
 * `null` at the deadband, not `linear`: writing a curve onto keyframes that omitted one would
 * make a pristine track compare as edited (`unifiedEase`).
 */
export function throwCurve(curvature: number): CubicBezierHandles | null {
	if (Math.abs(curvature) < CURVE_DEADBAND) return null;
	const k = curvature / 3;
	return [
		quantize(1 / 3 + k),
		quantize(1 / 3 - k),
		quantize(2 / 3 - k),
		quantize(2 / 3 + k),
	];
}

/**
 * The release of a drag as a `TrackEdit`, or `null` when the release did not clear the
 * authoring threshold — in which case the caller writes nothing and the camera holds its pose.
 */
export function fromThrow(
	trail: readonly PointerSample[],
	viewport: Viewport,
): TrackEdit | null {
	const short = Math.min(viewport.width, viewport.height);
	if (!(short > 0)) return null;
	const velocity = pointerVelocity(trail);
	// px/ms → screens/s.
	const screensPerSecond = (velocity.speed * 1000) / short;
	if (screensPerSecond < AUTHORING_SPEED_SCREENS_PER_S) return null;
	return {
		gain: quantize(Math.min(screensPerSecond / REFERENCE_SPEED_SCREENS_PER_S, MAX_TRACK_GAIN)),
		// Release angle around the cycle: right is 0, and counter-clockwise advances the phase.
		phase: wrapPhase(quantize(wrapPhase(Math.atan2(-velocity.y, velocity.x) / (2 * Math.PI)))),
		curve: throwCurve(pathCurvature(trail)),
	};
}
