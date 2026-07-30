import type { CubicBezierHandles } from "../theatre/easings";
import type { MotionKeyframe, MotionTrack } from "./doc";

/**
 * BAKING A CURVE INTO A DOCUMENT — tangent-matched keyframe fitting.
 *
 * Some motion is defined by a formula rather than by keyframes: the catalogue's
 * second-harmonic crane arc today, and a spring solver later. Turning one into a
 * document means choosing keyframe values AND the curve between them, and the
 * second choice is where the obvious approach fails.
 *
 * THE TRAP: reaching for `easeInOutSine` on every segment. That curve has a FLAT
 * TANGENT at both ends, which is correct for motion that comes to rest at each
 * keyframe and wrong for a smooth function sampled mid-slope — it forces the
 * velocity to zero at every sample and puts a ripple where the true motion glides.
 * Measured on crane's elevation it cost 1.243° against a 0.25° floor, a 5× miss.
 * Subdividing hides the ripple but produces a thirty-keyframe track no human can
 * edit, which defeats the reason for porting at all.
 *
 * THE FIX: match the true derivative at both ends of every segment. A cubic Bézier
 * easing with control points `(1/3, m₀/3)` and `(2/3, 1 − m₁/3)` has slope exactly
 * `m₀` leaving the left keyframe and `m₁` arriving at the right one — it is the
 * cubic Hermite interpolant wearing an easing's clothes. Error drops from O(h²) to
 * O(h⁴), so a human-scale keyframe count clears the floor with room to spare.
 *
 * Slopes are NORMALISED into segment space (`f'(t) · h / Δvalue`), because an
 * easing describes progress through a segment rather than absolute velocity. The
 * Y components are deliberately left unclamped — a steep segment legitimately
 * produces handles outside `[0,1]`, which is the same overshoot freedom every
 * hand-authored curve has.
 */

/** Below this change in value a segment is flat enough that a tangent is meaningless. */
const FLAT_SEGMENT_EPSILON = 1e-9;

export interface FitOptions {
	/** Analytic derivative. Central differences are used when it is absent. */
	derivative?: (t: number) => number;
}

function centralDifference(f: (t: number) => number, t: number): number {
	const h = 1e-6;
	return (f(t + h) - f(t - h)) / (2 * h);
}

/**
 * Sample `f` over one cycle on an even grid and return a track whose segments
 * reproduce it to fourth order. `divisions` is the number of SEGMENTS, so the track
 * carries `divisions + 1` keyframes with the last closing the cycle.
 */
export function fitSampledTrack(
	f: (t: number) => number,
	divisions: number,
	options: FitOptions = {},
): MotionTrack {
	const derivative = options.derivative ?? ((t: number) => centralDifference(f, t));
	const h = 1 / divisions;

	const values: number[] = [];
	const slopes: number[] = [];
	for (let i = 0; i <= divisions; i++) {
		const t = i * h;
		values.push(f(t));
		slopes.push(derivative(t));
	}

	const keyframes: MotionKeyframe[] = [];
	for (let i = 0; i <= divisions; i++) {
		const at = i * h;
		if (i === divisions) {
			// The closing keyframe's outgoing curve is never read.
			keyframes.push({ at, value: values[i] });
			continue;
		}

		const delta = values[i + 1] - values[i];
		let easing: CubicBezierHandles;
		if (Math.abs(delta) < FLAT_SEGMENT_EPSILON) {
			easing = [1 / 3, 1 / 3, 2 / 3, 2 / 3]; // flat segment — nothing to shape
		} else {
			const m0 = (slopes[i] * h) / delta;
			const m1 = (slopes[i + 1] * h) / delta;
			easing = [1 / 3, m0 / 3, 2 / 3, 1 - m1 / 3];
		}

		keyframes.push({ at, value: values[i], easing });
	}

	return { keyframes };
}
