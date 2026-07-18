import { describe, expect, it } from "vitest";

import {
	BASE_SWEEP_ANGLE,
	FLOOR_SWEEP_INTENSITY,
	glassSweepGradientCss,
	PEAK_SWEEP_INTENSITY,
	resolveGlassSweep,
} from "./three-glass-sweep";

describe("resolveGlassSweep", () => {
	it("is centered, un-tilted, and at peak intensity dead-on (the composed hero)", () => {
		const sweep = resolveGlassSweep({ azimuth: 0, elevation: 0 });

		expect(sweep.position).toBeCloseTo(50, 5);
		expect(sweep.angle).toBeCloseTo(BASE_SWEEP_ANGLE, 5);
		expect(sweep.intensity).toBeCloseTo(PEAK_SWEEP_INTENSITY, 5);
	});

	it("mirrors the band position around center for opposite azimuth", () => {
		const right = resolveGlassSweep({ azimuth: 20, elevation: 0 });
		const left = resolveGlassSweep({ azimuth: -20, elevation: 0 });

		expect(right.position - 50).toBeCloseTo(-(left.position - 50), 5);
		// Intensity is even in azimuth about dead-on.
		expect(right.intensity).toBeCloseTo(left.intensity, 5);
	});

	it("fades the streak monotonically as the camera orbits away from the catch", () => {
		const near = resolveGlassSweep({ azimuth: 10, elevation: 0 });
		const mid = resolveGlassSweep({ azimuth: 30, elevation: 0 });
		const far = resolveGlassSweep({ azimuth: 60, elevation: 0 });

		expect(near.intensity).toBeGreaterThan(mid.intensity);
		expect(mid.intensity).toBeGreaterThan(far.intensity);
	});

	it("tilts the gradient angle with azimuth so the streak rotates as you orbit", () => {
		expect(resolveGlassSweep({ azimuth: 30, elevation: 0 }).angle).toBeGreaterThan(
			BASE_SWEEP_ANGLE,
		);
		expect(resolveGlassSweep({ azimuth: -30, elevation: 0 }).angle).toBeLessThan(
			BASE_SWEEP_ANGLE,
		);
	});

	it("shifts the band vertically with elevation", () => {
		const level = resolveGlassSweep({ azimuth: 0, elevation: 0 });
		const raised = resolveGlassSweep({ azimuth: 0, elevation: 25 });

		expect(raised.position).not.toBeCloseTo(level.position, 3);
	});

	it("clamps every output into range at extreme poses", () => {
		for (const azimuth of [-180, 180, 90, -90]) {
			for (const elevation of [-90, 90]) {
				const sweep = resolveGlassSweep({ azimuth, elevation });
				expect(sweep.position).toBeGreaterThanOrEqual(0);
				expect(sweep.position).toBeLessThanOrEqual(100);
				expect(sweep.intensity).toBeGreaterThanOrEqual(FLOOR_SWEEP_INTENSITY);
				expect(sweep.intensity).toBeLessThanOrEqual(PEAK_SWEEP_INTENSITY);
				expect(Number.isFinite(sweep.angle)).toBe(true);
				expect(sweep.spread).toBeGreaterThan(0);
			}
		}
	});

	it("is deterministic — same pose in, identical params out", () => {
		expect(resolveGlassSweep({ azimuth: 17, elevation: -9 })).toEqual(
			resolveGlassSweep({ azimuth: 17, elevation: -9 }),
		);
	});
});

describe("glassSweepGradientCss", () => {
	it("emits a valid linear-gradient carrying the angle and intensity", () => {
		const css = glassSweepGradientCss(resolveGlassSweep({ azimuth: 0, elevation: 0 }));

		expect(css.startsWith("linear-gradient(")).toBe(true);
		expect(css).toContain(`${BASE_SWEEP_ANGLE}`);
		expect(css).toMatch(/rgba\(255, ?255, ?255, ?0?\.\d+\)/);
	});

	it("keeps gradient stops ordered and within 0–100%", () => {
		const css = glassSweepGradientCss(resolveGlassSweep({ azimuth: 60, elevation: 40 }));
		const stops = [...css.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));

		expect(stops.length).toBeGreaterThanOrEqual(2);
		for (let i = 1; i < stops.length; i++) {
			expect(stops[i]).toBeGreaterThanOrEqual(stops[i - 1]);
		}
		expect(stops[0]).toBeGreaterThanOrEqual(0);
		expect(stops[stops.length - 1]).toBeLessThanOrEqual(100);
	});
});
