import type { StudioPose } from "../studio-camera";
import type { CubicBezierHandles } from "../theatre/easings";
import { UnitBezier } from "../theatre/unit-bezier";
import { resolveEase, type Ease, type TimeMap } from "./doc";

/**
 * THE TRANSPORT — clip time in, cycle phase out, and the only place that mapping lives.
 *
 * Before this module the mapping was spread across five things that had to agree by
 * inspection: `cyclesForDuration` keyed by `CameraMove`, `clipCyclesForDuration` keyed by
 * `StudioClip` (the same expression twice), `phaseForProgress`, a smootherstep `easeInOut`
 * that shaped only the boomerang turnaround, and a `hold` bypass written out three times.
 *
 * TWO CHANGES OF KIND, not just of location:
 *
 * 1. **`repeat` is authored, not derived.** The old form collapsed three inputs into one
 *    integer through a `round()`, so the mapping was not injective and the `speed` control
 *    had dead zones — on a 6s-cycle move in a 5s clip, `speed` 0.5, 0.75 and 1 all produced
 *    `1×`. Now the user owns `repeat` and `durationSec`; `cycleSeconds` is the readout.
 *
 * 2. **`repeat: 0` is amplitude zero, not a time map.** A document's track values are
 *    OFFSETS from the hero pose, so scaling them by zero is exactly the hero pose — which
 *    is what `hold` always meant. Expressed in closed form (`repeat === 0 → hero`) it is
 *    both exact and one branch instead of three, and `LoopStyle` narrows to the two things
 *    it actually names.
 *
 * THE TURNAROUND IS AUTHORED, AND THE DEFAULT IS NOT A NO-OP. See `DEFAULT_TURNAROUND`.
 */

/**
 * The boomerang turnaround, as a curve in the same vocabulary as every keyframe.
 *
 * MEASURED, and the measurement overturned the plan. The shipped turnaround was a
 * smootherstep — a QUINTIC, `x³(6x² − 15x + 10)`. A cubic bezier easing cannot be one, and
 * the gap is not a fitting failure but a degree mismatch:
 *
 *   • best curve in the zero-end-slope family (`[a, 0, 1−a, 1]`): max phase error
 *     **8.1312e-3** at `a = 0.49840`
 *   • the value shipped here, `[0.5, 0, 0.5, 1]`: **8.6642e-3** — 5.3e-4 worse than the
 *     optimum, in exchange for a tuple a human can read and re-type
 *   • best UNCONSTRAINED cubic bezier: 2.3380e-3 at `[0.44865, −0.05335, 0.55127, 1.05334]`
 *     — 3.7× better and **rejected on mechanism**: its end slopes are −0.119, so the camera
 *     backs up through the loop seam. Overshoot is legal on a value track and wrong on a
 *     time map, which is why X is clamped and Y is not.
 *   • a tangent-matched TRACK clears the 0.25° port floor at 6 segments (6.0294e-4), but a
 *     seven-keyframe time warp is not a curve anyone can drag, which was the point.
 *
 * So the zero-end-slope family is the family — it is what makes the turnaround decelerate
 * into the reversal and out of the seam instead of snapping — and 8.6642e-3 of a cycle is
 * its floor. Against the shipped catalogue that is a TIMING shift of 0.87% of a cycle,
 * worst-case pose deviations: turntable azimuth **3.1191°**, sweep elevation **1.3675°**,
 * crane elevation **1.3356°**, crane reach **5.8340e-2**. Above the 0.25° port floor, so it
 * moves the camera under `boomerang` — `loop` and held clips are bit-identical. Recorded in
 * the change's `tasks.md` §3.4; never re-derived.
 */
export const DEFAULT_TURNAROUND: CubicBezierHandles = [0.5, 0, 0.5, 1];

/** One cycle, played forward, repeated. */
export const DEFAULT_TIME_MAP: TimeMap = { kind: "loop" };

/** One cycle across the clip — the cadence a fresh studio boots with. */
export const DEFAULT_REPEAT = 1;

/** Clip length a fresh studio boots with, in seconds. */
export const DEFAULT_DURATION_SEC = 5;

/**
 * Whether a repeat count closes on its seam.
 *
 * A whole number of cycles is what makes `pose(end) === pose(start)`, so the last frame
 * sits just shy of the first and the loop has no pop. A fractional count is permitted
 * rather than refused — a one-shot is a legitimate thing to author, and the shipped
 * `dolly-out-reveal` card already is one — so the surface reports which it is.
 */
export type SeamState = "held" | "seamless" | "open";

export function seamState(repeat: number): SeamState {
	if (!(repeat > 0)) return "held";
	return Number.isInteger(repeat) ? "seamless" : "open";
}

/** Seconds per cycle — the readout, derived from the two authored numbers. `null` when held. */
export function cycleSeconds(durationSec: number, repeat: number): number | null {
	if (!(repeat > 0) || !(durationSec > 0)) return null;
	return durationSec / repeat;
}

/**
 * The transport line as one string: `3× · 2.0s · seamless`. A control shows the value it
 * holds, and the derived cycle length is the value the two authored numbers produce.
 */
export function motionReadout(repeat: number, durationSec: number): string {
	const seam = seamState(repeat);
	if (seam === "held") return "held";
	const cycle = cycleSeconds(durationSec, repeat);
	const count = Number.isInteger(repeat) ? `${repeat}×` : `${repeat.toFixed(2)}×`;
	return cycle === null ? `${count} · ${seam}` : `${count} · ${cycle.toFixed(1)}s · ${seam}`;
}

/**
 * The one-way conversion of a stored `speed` into the `repeat` it was actually flying.
 *
 * `speed` never named a cadence — it scaled one. The count that was really being flown is
 * what carries forward, so a decoded look plays back the way it was authored even though
 * the control that produced it is gone. Boomerang halved the derived count because one
 * round-trip covers twice the path; an authored `repeat` counts round-trips directly, so
 * the halving is applied here on the way in and then never again.
 */
export function repeatFromSpeed(
	durationSec: number,
	speed: number,
	naturalCycleSeconds: number,
	kind: TimeMap["kind"] = "loop",
): number {
	if (!(naturalCycleSeconds > 0)) return DEFAULT_REPEAT;
	const raw = (durationSec * speed) / naturalCycleSeconds;
	return Math.max(1, Math.round(kind === "boomerang" ? raw / 2 : raw));
}

/** Wrap into `[0,1)`, correct for negatives as well as overshoot. */
function wrap01(x: number): number {
	if (!Number.isFinite(x)) return 0;
	const f = x % 1;
	return f < 0 ? f + 1 : f;
}

/**
 * Smooth ping-pong: each unit interval of `x` maps 0 → 1 → 0, shaped by an authored curve.
 *
 * A raw triangle has a velocity sign flip at the peak AND at every integer (the seam). The
 * ease removes both, because a curve with zero slope at 0 and 1 decelerates into each corner
 * and accelerates out by the chain rule. At every integer `x` the result is exactly 0 — the
 * hero seam — so a boomerang closes like a loop.
 */
export function pingPong(x: number, solve: (t: number) => number): number {
	const f = wrap01(x);
	const tri = f < 0.5 ? f * 2 : 2 - f * 2;
	return solve(tri);
}

export interface PhaseMap {
	/** Clip progress `[0,1)` → cycle phase `[0,1)`. */
	(progress: number): number;
}

/**
 * Build the progress→phase map for an authored transport. Built once per clip and called
 * per frame, the same shape `createClipPoseSampler` and `createMotionSampler` already use —
 * the bezier solver is constructed here rather than inside the frame loop.
 */
export function createPhaseMap(repeat: number, timeMap: TimeMap): PhaseMap {
	if (!(repeat > 0)) {
		// Amplitude zero: the phase is pinned, and the caller resolves the hero directly.
		return () => 0;
	}
	if (timeMap.kind === "boomerang") {
		const [c1x, c1y, c2x, c2y] = resolveEase(turnaroundOf(timeMap));
		const bezier = new UnitBezier(c1x, c1y, c2x, c2y);
		return (progress: number) => pingPong(progress * repeat, (t) => bezier.solve(t));
	}
	return (progress: number) => wrap01(progress * repeat);
}

/** The turnaround a boomerang carries, falling back to the measured default. */
export function turnaroundOf(timeMap: TimeMap): Ease {
	return (timeMap.kind === "boomerang" ? timeMap.turnaround : undefined) ?? DEFAULT_TURNAROUND;
}

/** Convenience single read. Prefer `createPhaseMap` inside a loop. */
export function phaseForProgress(progress: number, repeat: number, timeMap: TimeMap): number {
	return createPhaseMap(repeat, timeMap)(progress);
}

/**
 * Resolve the pose for a clip progress — the single call site the preview, the offline
 * render loop and the proof renderer all share.
 *
 * `repeat === 0` short-circuits to the hero. That is not a special case bolted on: a
 * document's tracks are offsets from the hero, so zero amplitude IS the hero, and returning
 * it in closed form is exact where sampling phase 0 would not be (an orbit's reach at phase
 * 0 sits 0.15 units inside its hero, because its dolly is a raised cosine).
 */
export function poseAtProgress(
	samplePose: (phase: number) => StudioPose,
	hero: StudioPose,
	progress: number,
	repeat: number,
	timeMap: TimeMap,
	phaseMap: PhaseMap = createPhaseMap(repeat, timeMap),
): StudioPose {
	if (!(repeat > 0)) return hero;
	return samplePose(phaseMap(progress));
}
