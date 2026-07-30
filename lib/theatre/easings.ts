/**
 * The easing vocabulary — the expressive half of "expand the animation options".
 *
 * An easing here is a CSS cubic-bezier: two control points `(c1x,c1y),(c2x,c2y)`
 * for a curve pinned at (0,0)→(1,1). When we author a keyframe segment, the LEFT
 * keyframe's outgoing handle becomes `(c1x,c1y)` and the RIGHT keyframe's incoming
 * handle becomes `(c2x,c2y)` — exactly how Theatre stores per-segment easing. The
 * values mirror the well-known easings.net / Penner curves so designers get the
 * feel they expect, and they round-trip cleanly through the Theatre studio GUI.
 */

export type CubicBezierHandles = readonly [number, number, number, number];

export const EASINGS = {
	linear: [1 / 3, 1 / 3, 2 / 3, 2 / 3],

	// The CSS keyword family.
	ease: [0.25, 0.1, 0.25, 1],
	easeIn: [0.42, 0, 1, 1],
	easeOut: [0, 0, 0.58, 1],
	easeInOut: [0.42, 0, 0.58, 1],

	// Sine — the gentlest accel/decel; ideal for breathing camera moves.
	easeInSine: [0.12, 0, 0.39, 0],
	easeOutSine: [0.61, 1, 0.88, 1],
	easeInOutSine: [0.37, 0, 0.63, 1],

	// Quad / Cubic / Quart — progressively snappier polynomial eases.
	easeInQuad: [0.11, 0, 0.5, 0],
	easeOutQuad: [0.5, 1, 0.89, 1],
	easeInOutQuad: [0.45, 0, 0.55, 1],
	easeInCubic: [0.32, 0, 0.67, 0],
	easeOutCubic: [0.33, 1, 0.68, 1],
	easeInOutCubic: [0.65, 0, 0.35, 1],
	easeInQuart: [0.5, 0, 0.75, 0],
	easeOutQuart: [0.25, 1, 0.5, 1],
	easeInOutQuart: [0.76, 0, 0.24, 1],

	// Expo — dramatic, near-hold-then-snap motion.
	easeInExpo: [0.7, 0, 0.84, 0],
	easeOutExpo: [0.16, 1, 0.3, 1],
	easeInOutExpo: [0.87, 0, 0.13, 1],

	// Back — anticipation / follow-through that overshoots the range. The product
	// "settling into place" look.
	easeInBack: [0.36, 0, 0.66, -0.56],
	easeOutBack: [0.34, 1.56, 0.64, 1],
	easeInOutBack: [0.68, -0.6, 0.32, 1.6],
} as const satisfies Record<string, CubicBezierHandles>;

export type EasingName = keyof typeof EASINGS;

export const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

/**
 * An easing value anywhere in the system: a name from the vocabulary above, or a
 * hand-authored curve. The two are interchangeable — a named curve round-trips to
 * a tuple and back — so "picked from a menu" and "dragged by hand" are the same
 * kind of value rather than two parallel representations.
 */
export type Ease = EasingName | CubicBezierHandles;

/** Resolve a named easing, or pass a raw `[c1x,c1y,c2x,c2y]` tuple straight through. */
export function easingHandles(easing: Ease): CubicBezierHandles {
	return typeof easing === "string" ? EASINGS[easing] : easing;
}

/**
 * Clamp the two X control points into `[0,1]`, leaving Y untouched.
 *
 * ASYMMETRY IS THE POINT. Y carries expression: a control point above 1 or below 0
 * makes the curve overshoot its keyframe range, which is anticipation and
 * follow-through — `easeInOutBack` ships that way and it is a feature. X carries
 * TIME, and `UnitBezier.solve` inverts x→t by Newton-Raphson over `[0,1]`
 * (`unit-bezier.ts:53`). An X outside that domain makes the curve non-monotonic in
 * time — the motion would run backwards mid-segment — and leaves the Newton solve
 * ill-conditioned, falling through to bisection for a value that was never
 * meaningful. So X is a domain constraint and Y is a design choice.
 */
export function clampHandlesX(handles: CubicBezierHandles): CubicBezierHandles {
	const [c1x, c1y, c2x, c2y] = handles;
	const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
	return [clamp(c1x), c1y, clamp(c2x), c2y];
}
