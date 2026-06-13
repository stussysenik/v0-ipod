import { describe, expect, it } from "vitest";

import { FrameAccumulator, shutterFraction, subFrameOffsets } from "./motion-blur";

/**
 * Motion blur is the "buttery" in buttery exports: each output frame is the
 * average of several sub-frames sampled across the time the shutter is open. The
 * pacing math — WHERE in time those sub-frames sit — is pure and must be exact, or
 * the blur smears asymmetrically (a leading/trailing ghost) instead of centering
 * on the frame. These tests pin the sub-frame placement in units of one
 * frame-duration.
 */
describe("shutterFraction", () => {
	it("maps shutter angle to the open fraction of a frame", () => {
		expect(shutterFraction(360)).toBeCloseTo(1, 9); // fully open
		expect(shutterFraction(180)).toBeCloseTo(0.5, 9); // the cinematic default
		expect(shutterFraction(90)).toBeCloseTo(0.25, 9);
	});

	it("clamps out-of-range angles to (0, 360]", () => {
		expect(shutterFraction(0)).toBeGreaterThan(0);
		expect(shutterFraction(-50)).toBeGreaterThan(0);
		expect(shutterFraction(720)).toBeCloseTo(1, 9);
	});
});

describe("subFrameOffsets", () => {
	it("returns a single centered sample when blur is disabled", () => {
		expect(subFrameOffsets(1, 180)).toEqual([0]);
		expect(subFrameOffsets(0, 180)).toEqual([0]);
	});

	it("produces the requested number of samples", () => {
		expect(subFrameOffsets(4, 180)).toHaveLength(4);
		expect(subFrameOffsets(8, 180)).toHaveLength(8);
	});

	it("centers the samples on the frame (mean offset ≈ 0)", () => {
		for (const n of [2, 3, 4, 8]) {
			const offsets = subFrameOffsets(n, 180);
			const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
			expect(mean).toBeCloseTo(0, 9);
		}
	});

	it("keeps samples inside the shutter window (±fraction/2)", () => {
		const offsets = subFrameOffsets(6, 180); // window 0.5 → ±0.25
		for (const o of offsets) {
			expect(o).toBeGreaterThanOrEqual(-0.25 - 1e-9);
			expect(o).toBeLessThanOrEqual(0.25 + 1e-9);
		}
	});

	it("widens the window with the shutter angle", () => {
		const half = subFrameOffsets(8, 180);
		const full = subFrameOffsets(8, 360);
		const span = (o: number[]) => Math.max(...o) - Math.min(...o);
		expect(span(full)).toBeGreaterThan(span(half));
		expect(span(full)).toBeCloseTo(span(half) * 2, 6);
	});

	it("returns offsets in ascending order", () => {
		const offsets = subFrameOffsets(5, 270);
		const sorted = [...offsets].sort((a, b) => a - b);
		expect(offsets).toEqual(sorted);
	});
});

describe("FrameAccumulator", () => {
	it("averages added sub-frame buffers channel by channel", () => {
		const acc = new FrameAccumulator(4);
		acc.add(new Uint8ClampedArray([0, 100, 200, 255]));
		acc.add(new Uint8ClampedArray([100, 100, 0, 255]));
		const out = new Uint8ClampedArray(4);
		acc.average(out);
		expect(Array.from(out)).toEqual([50, 100, 100, 255]);
	});

	it("rounds to the nearest byte", () => {
		const acc = new FrameAccumulator(1);
		acc.add(new Uint8ClampedArray([0]));
		acc.add(new Uint8ClampedArray([0]));
		acc.add(new Uint8ClampedArray([1]));
		const out = new Uint8ClampedArray(1);
		acc.average(out); // 1/3 → 0.333 → 0
		expect(out[0]).toBe(0);
	});

	it("reset clears the running sum so it can be reused per frame", () => {
		const acc = new FrameAccumulator(2);
		acc.add(new Uint8ClampedArray([10, 20]));
		acc.reset();
		acc.add(new Uint8ClampedArray([200, 40]));
		const out = new Uint8ClampedArray(2);
		acc.average(out);
		expect(Array.from(out)).toEqual([200, 40]);
	});
});
