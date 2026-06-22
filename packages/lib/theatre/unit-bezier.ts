/**
 * A faithful, zero-dependency port of the unit cubic-Bézier solver that
 * `@theatre/core` uses internally to ease keyframe segments (its `timing-function`
 * `UnitBezier`, which is itself the WebKit CSS timing-function solver).
 *
 * WHY WE OWN A COPY: Theatre can only *sample* its sequences when a prism is kept
 * "hot" (a live subscription plus a manual ticker) — there is no synchronous,
 * cold read. That is fine for the live canvas, but our exports render frames
 * deterministically off the main loop and our unit tests run in plain Node. A
 * pure solver lets us interpolate keyframes synchronously, identically to
 * Theatre, with nothing to keep warm. The parity test pins our output to
 * `@theatre/core`'s so the two can never silently diverge.
 *
 * THE MATH: a cubic Bézier with endpoints fixed at (0,0) and (1,1) and two
 * control points (p1x,p1y),(p2x,p2y). Easing answers a Y-for-X question — "given
 * progress through the segment in time (x), how far along are we in value (y)?" —
 * but the curve is parameterised by t, not x. So `solve(x)` first inverts x→t
 * (Newton-Raphson, then a bisection fallback for ill-conditioned curves) and then
 * evaluates y at that t.
 */
export class UnitBezier {
	private readonly ax: number;
	private readonly bx: number;
	private readonly cx: number;
	private readonly ay: number;
	private readonly by: number;
	private readonly cy: number;

	constructor(p1x: number, p1y: number, p2x: number, p2y: number) {
		// Polynomial coefficients of the cubic, pre-computed from the control
		// points (Bézier → power basis), one set per axis.
		this.cx = 3 * p1x;
		this.bx = 3 * (p2x - p1x) - this.cx;
		this.ax = 1 - this.cx - this.bx;
		this.cy = 3 * p1y;
		this.by = 3 * (p2y - p1y) - this.cy;
		this.ay = 1 - this.cy - this.by;
	}

	private sampleCurveX(t: number): number {
		return ((this.ax * t + this.bx) * t + this.cx) * t;
	}

	private sampleCurveY(t: number): number {
		return ((this.ay * t + this.by) * t + this.cy) * t;
	}

	private sampleCurveDerivativeX(t: number): number {
		return (3 * this.ax * t + 2 * this.bx) * t + this.cx;
	}

	/** Invert x → t. Newton-Raphson converges fast; bisection guarantees a result. */
	private solveCurveX(x: number, epsilon: number): number {
		let t2 = x;

		// Newton-Raphson — 8 iterations is what WebKit/Theatre use.
		for (let i = 0; i < 8; i++) {
			const x2 = this.sampleCurveX(t2) - x;
			if (Math.abs(x2) < epsilon) {
				return t2;
			}
			const d2 = this.sampleCurveDerivativeX(t2);
			if (Math.abs(d2) < epsilon) {
				break;
			}
			t2 = t2 - x2 / d2;
		}

		// Bisection fallback for nearly-vertical tangents Newton can't handle.
		let t0 = 0;
		let t1 = 1;
		t2 = x;
		if (t2 < t0) {
			return t0;
		}
		if (t2 > t1) {
			return t1;
		}
		while (t0 < t1) {
			const x2 = this.sampleCurveX(t2);
			if (Math.abs(x2 - x) < epsilon) {
				return t2;
			}
			if (x > x2) {
				t0 = t2;
			} else {
				t1 = t2;
			}
			t2 = (t1 - t0) * 0.5 + t0;
		}
		return t2;
	}

	/** Eased fraction y for a time fraction x ∈ [0,1]. */
	solve(x: number, epsilon = 1e-6): number {
		return this.sampleCurveY(this.solveCurveX(x, epsilon));
	}
}
