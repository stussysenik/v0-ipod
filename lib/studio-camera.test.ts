import { describe, expect, it } from "vitest";

import {
	CAMERA_MOVES,
	clampPose,
	ELEVATION_RANGE,
	finiteOr,
	PINCH_SPREAD_FLOOR_PX,
	pinchSpread,
	pinchZoomRadius,
	poseForMove,
	REACH_RANGE,
	type StudioPose,
} from "./studio-camera";

const HERO: StudioPose = { azimuth: 20, elevation: 12, reach: 14, target: [0, 0, 0] };

/** Smallest absolute angular gap between two azimuths, in [0, 180]. */
function azGap(a: number, b: number): number {
	const d = (((a - b) % 360) + 360) % 360;
	return Math.min(d, 360 - d);
}

describe("camera moves — seamless loop", () => {
	// Every move is built from whole-turn sin/cos of φ = 2πt, so pose(1) must
	// equal pose(0): the export loops back onto the hero seam with no pop.
	// (Azimuth is compared modulo 360 since the turntable advances a full turn.)
	for (const move of CAMERA_MOVES) {
		it(`${move.id} closes on its loop seam (pose(0) === pose(1))`, () => {
			const start = poseForMove(move.id, 0, HERO);
			const end = poseForMove(move.id, 1, HERO);
			expect(azGap(end.azimuth, start.azimuth)).toBeCloseTo(0, 6);
			expect(end.elevation).toBeCloseTo(start.elevation, 6);
			expect(end.reach).toBeCloseTo(start.reach, 6);
		});
	}

	it("includes the MKBHD-style crane move", () => {
		expect(CAMERA_MOVES.some((m) => m.id === "crane")).toBe(true);
	});

	it("crane actually moves through the loop (not a static hold)", () => {
		const mid = poseForMove("crane", 0.25, HERO);
		expect(Math.abs(mid.azimuth - HERO.azimuth)).toBeGreaterThan(1);
		expect(Math.abs(mid.elevation - HERO.elevation)).toBeGreaterThan(1);
	});
});

describe("gesture guards — storm finiteness (spec: interaction-robustness)", () => {
	it("coincident pinch cannot jump the zoom (spread floor bounds the ratio)", () => {
		// A second pointer landing atop the first: both spreads collapse to the
		// floor, the ratio is exactly 1, and the radius holds.
		expect(pinchZoomRadius(14, 0, 0)).toBeCloseTo(14, 10);
		// Anything inside the floor reads AS the floor on both sides.
		expect(pinchSpread(0)).toBe(PINCH_SPREAD_FLOOR_PX);
		expect(pinchSpread(PINCH_SPREAD_FLOOR_PX - 1)).toBe(PINCH_SPREAD_FLOOR_PX);
		expect(pinchZoomRadius(14, 1e-9, PINCH_SPREAD_FLOOR_PX - 0.5)).toBeCloseTo(14, 10);
	});

	it("pinch storm stays finite and inside REACH_RANGE", () => {
		// Adversarial spreads: zero, sub-pixel, huge, negative, NaN, Infinity.
		const dists = [0, 1e-9, 1, PINCH_SPREAD_FLOOR_PX, 500, 1e9, -50, Number.NaN, Number.POSITIVE_INFINITY];
		let rad = HERO.reach;
		for (const anchor of dists) {
			for (const live of dists) {
				rad = pinchZoomRadius(rad, anchor, live);
				expect(Number.isFinite(rad)).toBe(true);
				expect(rad).toBeGreaterThanOrEqual(REACH_RANGE[0]);
				expect(rad).toBeLessThanOrEqual(REACH_RANGE[1]);
			}
		}
	});

	it("finiteOr holds the previous value for non-finite gesture math", () => {
		expect(finiteOr(Number.NaN, 1.2)).toBe(1.2);
		expect(finiteOr(Number.POSITIVE_INFINITY, 0.4)).toBe(0.4);
		expect(finiteOr(Number.NEGATIVE_INFINITY, -0.4)).toBe(-0.4);
		expect(finiteOr(2.5, 1)).toBe(2.5);
	});

	it("deterministic gesture storm — orbit/wheel/pinch deltas never wedge the pose", () => {
		// Seeded LCG so the "randomized storm" replays byte-identically in CI.
		let seed = 0xC0FFEE;
		const rand = () => {
			seed = (seed * 1664525 + 1013904223) >>> 0;
			return seed / 0xffffffff;
		};
		let az = HERO.azimuth;
		let pol = 1.2;
		let rad = HERO.reach;
		for (let i = 0; i < 2000; i++) {
			// Alternate huge, tiny, and hostile deltas across all three dials.
			const hostile = i % 7 === 0 ? Number.NaN : i % 11 === 0 ? Number.POSITIVE_INFINITY : 0;
			const dx = (rand() - 0.5) * 4000 + hostile;
			az = finiteOr(az - dx * 0.006, az);
			pol = finiteOr(Math.min(Math.max(pol - dx * 0.006, 0.18), Math.PI - 0.18), pol);
			rad = pinchZoomRadius(rad, rand() * 600 - 100, rand() * 600 - 100);
			rad = finiteOr(
				Math.min(Math.max(rad + dx * 0.012, REACH_RANGE[0]), REACH_RANGE[1]),
				rad,
			);
			expect(Number.isFinite(az)).toBe(true);
			expect(pol).toBeGreaterThanOrEqual(0.18);
			expect(pol).toBeLessThanOrEqual(Math.PI - 0.18);
			expect(rad).toBeGreaterThanOrEqual(REACH_RANGE[0]);
			expect(rad).toBeLessThanOrEqual(REACH_RANGE[1]);
		}
	});

	it("clampPose keeps extreme composed poses inside the authoring envelope", () => {
		const wild = clampPose({ azimuth: 1e6, elevation: -4000, reach: 1e9, target: [0, 0, 0] });
		expect(wild.elevation).toBe(ELEVATION_RANGE[0]);
		expect(wild.reach).toBe(REACH_RANGE[1]);
		expect(Number.isFinite(wild.azimuth)).toBe(true);
	});
});
