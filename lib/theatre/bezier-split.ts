import { clampHandlesX, easingHandles, type CubicBezierHandles, type Ease } from "./easings";

/**
 * SPLITTING AN EASE — the operation that lets a keyframe be inserted without moving a pixel.
 *
 * A keyframe segment is a unit cubic Bézier read as y-for-x: x is the fraction of the segment's
 * time, y the fraction of its value. Cutting the segment in two means finding two unit curves
 * whose concatenation is the original curve, which is de Casteljau's subdivision followed by a
 * renormalisation of each half back into its own unit box. The result is exact in exact
 * arithmetic; what floats away is only the x→t inversion, and the caller's test pins that.
 *
 * WHY THIS IS THE WHOLE CASE FOR IN-SCENE PATH AUTHORING. Placing a control point on a move is
 * only honest if placing it changes nothing. Without an exact split, "add a point here" silently
 * reshapes the move at the moment of adding it, and the author is correcting a curve the tool
 * bent rather than authoring one. That defect is invisible in a screenshot and obvious in a loop.
 *
 * INVERSION BY BISECTION, NOT NEWTON. `UnitBezier` inverts x→t with Newton and falls back to
 * bisection, which is the right trade inside a per-frame sampler. A split runs once per inserted
 * knot, so the simple monotone search is enough, and its precondition — x(t) monotone on [0,1] —
 * is guaranteed rather than hoped for, because `clampHandlesX` holds both x handles in [0,1].
 */

/**
 * The identity ease, in the uniform parameterisation where `x(t) = t`. Used where a half of a
 * split has no value span to normalise against — any curve reproduces a constant.
 */
const LINEAR: CubicBezierHandles = [1 / 3, 1 / 3, 2 / 3, 2 / 3];

/**
 * Below this span a half-segment carries no value, so its curve cannot be renormalised and does
 * not need to be: the error a linear stand-in induces is bounded by the span itself.
 */
const FLAT_SPAN = 1e-9;

/** Iterations of bisection on x. 2^-40 in t, three orders below the sampler's own epsilon. */
const INVERSION_STEPS = 40;

/** Rounding room on the x domain check, so a handle landing on 0 or 1 is not read as outside it. */
const DOMAIN_SLACK = 1e-9;

type Point = readonly [number, number];

export interface EaseSplit {
	/** The curve leaving the original keyframe and arriving at the inserted one. */
	left: CubicBezierHandles;
	/** The curve leaving the inserted keyframe. */
	right: CubicBezierHandles;
	/** Value fraction at the cut — the eased y the original curve reads at `x`. */
	splitY: number;
}

function lerp(a: Point, b: Point, t: number): Point {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Forward evaluation of the curve's x at parameter t. Monotone under `clampHandlesX`. */
function curveX(h: CubicBezierHandles, t: number): number {
	const u = 1 - t;
	// Bézier basis with P0x = 0 and P3x = 1; the first term vanishes.
	return 3 * u * u * t * h[0] + 3 * u * t * t * h[2] + t * t * t;
}

/** Invert x → t on the monotone x component. */
function parameterAtX(h: CubicBezierHandles, x: number): number {
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < INVERSION_STEPS; i += 1) {
		const mid = (lo + hi) / 2;
		if (curveX(h, mid) < x) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
}

/**
 * Cut an ease at a time fraction, yielding the two eases that reproduce it.
 *
 * `x` is the position within the segment, `0 < x < 1`. A cut at either end is not a cut and
 * returns `null`, which is the caller's signal that the knot it wanted already exists.
 */
export function splitEase(ease: Ease, x: number): EaseSplit | null {
	if (!(x > 0) || !(x < 1)) return null;

	const h = clampHandlesX(easingHandles(ease));
	const p0: Point = [0, 0];
	const p1: Point = [h[0], h[1]];
	const p2: Point = [h[2], h[3]];
	const p3: Point = [1, 1];

	const t = parameterAtX(h, x);
	const a = lerp(p0, p1, t);
	const b = lerp(p1, p2, t);
	const c = lerp(p2, p3, t);
	const d = lerp(a, b, t);
	const e = lerp(b, c, t);
	const s = lerp(d, e, t);

	// The cut's own x is re-read from the subdivision rather than reusing the requested `x`, so
	// the two halves normalise against the point that was actually produced.
	const sx = s[0];
	const sy = s[1];

	const leftSpan = sy;
	const rightSpan = 1 - sy;
	const left: CubicBezierHandles =
		Math.abs(leftSpan) < FLAT_SPAN || sx < FLAT_SPAN
			? LINEAR
			: [a[0] / sx, a[1] / leftSpan, d[0] / sx, d[1] / leftSpan];
	const right: CubicBezierHandles =
		Math.abs(rightSpan) < FLAT_SPAN || 1 - sx < FLAT_SPAN
			? LINEAR
			: [
					(e[0] - sx) / (1 - sx),
					(e[1] - sy) / rightSpan,
					(c[0] - sx) / (1 - sx),
					(c[1] - sy) / rightSpan,
				];

	// REPRESENTABILITY, NOT PRECISION, IS THE LIMIT. A subdivided half of a monotone curve is
	// still monotone, but its control polygon can carry an x outside [0,1] — and `resolveEase`
	// clamps x on every read, so such a half cannot be stored. Reporting `null` is the honest
	// answer; clamping would return a curve that is quietly not the one that was cut.
	if (!inDomain(left) || !inDomain(right)) return null;
	return { left: clampHandlesX(left), right: clampHandlesX(right), splitY: sy };
}

/** Can this ease be cut at `x` and stored? Cheap enough to ask before offering the gesture. */
export function isSplittable(ease: Ease, x: number): boolean {
	return splitEase(ease, x) !== null;
}

function inDomain(h: CubicBezierHandles): boolean {
	return h[0] >= -DOMAIN_SLACK && h[0] <= 1 + DOMAIN_SLACK && h[2] >= -DOMAIN_SLACK && h[2] <= 1 + DOMAIN_SLACK;
}
