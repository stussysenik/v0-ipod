import { describe, expect, it } from "vitest";

import { UnitBezier } from "./unit-bezier";

/**
 * A unit cubic Bézier is the easing primitive Theatre.js stores per keyframe
 * segment: a curve pinned at (0,0)→(1,1) with two control points. `solve(x)`
 * answers "given how far we are along the segment in TIME (x), how far are we
 * along in VALUE (y)?". These tests pin the exact arithmetic so our pure port
 * stays bit-faithful to `@theatre/core`'s internal solver (the parity test
 * proves the whole pipeline; this proves the kernel in isolation).
 */
describe("UnitBezier", () => {
	it("passes through the curve endpoints", () => {
		const b = new UnitBezier(0.42, 0, 0.58, 1);
		expect(b.solve(0)).toBeCloseTo(0, 9);
		expect(b.solve(1)).toBeCloseTo(1, 9);
	});

	it("is the identity when both control points sit on the diagonal", () => {
		const b = new UnitBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3);
		for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
			expect(b.solve(x)).toBeCloseTo(x, 6);
		}
	});

	it("reproduces Theatre's classic ease-in-out segment (handles 0.5,0 → 0.5,1)", () => {
		// This is the exact curve behind today's headless smoke test:
		// a 0→100 tween sampled at quarter-progress lands at ~10.589.
		const b = new UnitBezier(0.5, 0, 0.5, 1);
		expect(b.solve(0.25)).toBeCloseTo(0.10589, 4);
		expect(b.solve(0.5)).toBeCloseTo(0.5, 6); // symmetric midpoint
		expect(b.solve(0.75)).toBeCloseTo(0.89411, 4);
	});

	it("ease-in bunches motion late (output trails input before the midpoint)", () => {
		const easeIn = new UnitBezier(0.42, 0, 1, 1);
		expect(easeIn.solve(0.5)).toBeLessThan(0.5);
	});

	it("ease-out front-loads motion (output leads input before the midpoint)", () => {
		const easeOut = new UnitBezier(0, 0, 0.58, 1);
		expect(easeOut.solve(0.5)).toBeGreaterThan(0.5);
	});

	it("is monotonically non-decreasing across the segment", () => {
		const b = new UnitBezier(0.42, 0, 0.58, 1);
		let prev = -Infinity;
		for (let i = 0; i <= 100; i++) {
			const y = b.solve(i / 100);
			expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
			prev = y;
		}
	});
});
