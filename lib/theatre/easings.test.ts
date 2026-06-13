import { describe, expect, it } from "vitest";

import { EASING_NAMES, easingHandles, EASINGS } from "./easings";
import { UnitBezier } from "./unit-bezier";

/**
 * The easing catalogue is the vocabulary designers reach for. Each entry is a CSS
 * cubic-bezier (two control points) that becomes a keyframe-segment's curve. These
 * tests guard the catalogue's invariants — valid control points, endpoints pinned,
 * and the qualitative "feel" of the headline curves — without over-pinning exact
 * values that are a matter of taste.
 */

function curve([c1x, c1y, c2x, c2y]: readonly [number, number, number, number]): UnitBezier {
	return new UnitBezier(c1x, c1y, c2x, c2y);
}

describe("easing catalogue", () => {
	it("every easing has 4 control values with X within [0,1]", () => {
		for (const name of EASING_NAMES) {
			const h = EASINGS[name];
			expect(h).toHaveLength(4);
			expect(h[0]).toBeGreaterThanOrEqual(0);
			expect(h[0]).toBeLessThanOrEqual(1);
			expect(h[2]).toBeGreaterThanOrEqual(0);
			expect(h[2]).toBeLessThanOrEqual(1);
		}
	});

	it("every easing is pinned at the endpoints (0→0, 1→1)", () => {
		for (const name of EASING_NAMES) {
			const c = curve(EASINGS[name]);
			expect(c.solve(0)).toBeCloseTo(0, 6);
			expect(c.solve(1)).toBeCloseTo(1, 6);
		}
	});

	it("linear is the identity", () => {
		const c = curve(EASINGS.linear);
		for (const x of [0.2, 0.5, 0.8]) {
			expect(c.solve(x)).toBeCloseTo(x, 6);
		}
	});

	it("easeIn trails, easeOut leads, easeInOut is symmetric at the midpoint", () => {
		expect(curve(EASINGS.easeIn).solve(0.5)).toBeLessThan(0.5);
		expect(curve(EASINGS.easeOut).solve(0.5)).toBeGreaterThan(0.5);
		expect(curve(EASINGS.easeInOut).solve(0.5)).toBeCloseTo(0.5, 2);
	});

	it("back eases overshoot their range (anticipation / follow-through)", () => {
		// easeOutBack should exceed 1 somewhere before settling.
		let overshoots = false;
		const c = curve(EASINGS.easeOutBack);
		for (let i = 0; i <= 100; i++) {
			if (c.solve(i / 100) > 1.0001) {
				overshoots = true;
				break;
			}
		}
		expect(overshoots).toBe(true);
	});

	it("resolves a named easing and passes through raw handle tuples untouched", () => {
		expect(easingHandles("easeInOut")).toEqual(EASINGS.easeInOut);
		const raw = [0.1, 0.2, 0.3, 0.4] as const;
		expect(easingHandles(raw)).toEqual(raw);
	});

	it("offers a broad vocabulary (≥ 16 named easings)", () => {
		expect(EASING_NAMES.length).toBeGreaterThanOrEqual(16);
	});
});
