import { describe, expect, it } from "vitest";

import { CAMERA_MOVES, type StudioPose, poseForMove } from "./studio-camera";

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
