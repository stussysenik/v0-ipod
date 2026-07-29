import { describe, expect, it } from "vitest";
import {
	NEUTRAL,
	applyCalibration,
	calibrationForTarget,
	contrastExponent,
	kelvinToChromaticity,
	kelvinToRgbGains,
	type Calibration,
} from "./color-calibration";
import { deltaECIEDE2000 } from "./color-proximity";

/** The finishes the manifest pins; neutral calibration must not move any of them. */
const FINISHES = ["#FFFFFF", "#F7F7F7", "#F5F5F0", "#1b1818", "#C0C0C0", "#2D2F34", "#111111"];

describe("neutral is identity", () => {
	it("returns every authentic finish unchanged at brightness 100 / contrast 50 / 6500K", () => {
		for (const hex of FINISHES) {
			expect(applyCalibration(hex, NEUTRAL).toLowerCase()).toBe(hex.toLowerCase());
		}
	});

	it("defaults to neutral when no calibration is supplied", () => {
		for (const hex of FINISHES) {
			expect(applyCalibration(hex)).toBe(applyCalibration(hex, NEUTRAL));
		}
	});

	it("gains at 6500K are exactly unity", () => {
		const g = kelvinToRgbGains(6500);
		expect(g.r).toBeCloseTo(1, 12);
		expect(g.g).toBeCloseTo(1, 12);
		expect(g.b).toBeCloseTo(1, 12);
	});

	it("is continuous through the neutral point", () => {
		// A step here would tint every finish the moment the slider left centre.
		const below = kelvinToRgbGains(6499);
		const above = kelvinToRgbGains(6501);
		expect(below.b).toBeCloseTo(1, 3);
		expect(above.r).toBeCloseTo(1, 3);
	});
});

describe("contrast", () => {
	it("is unity at the centre of the slider", () => {
		expect(contrastExponent(50)).toBe(1);
	});

	it("is monotonic in the slider position", () => {
		const xs = [0, 10, 25, 50, 75, 90, 100].map(contrastExponent);
		expect([...xs].sort((a, b) => a - b)).toEqual(xs);
	});

	it("deepens a mid grey above centre and lifts it below", () => {
		const mid = "#808080";
		const deep = applyCalibration(mid, { ...NEUTRAL, contrast: 75 });
		const flat = applyCalibration(mid, { ...NEUTRAL, contrast: 25 });
		expect(parseInt(deep.slice(1, 3), 16)).toBeLessThan(0x80);
		expect(parseInt(flat.slice(1, 3), 16)).toBeGreaterThan(0x80);
	});
});

describe("brightness", () => {
	it("collapses to black at zero", () => {
		expect(applyCalibration("#C0C0C0", { ...NEUTRAL, brightness: 0 })).toBe("#000000");
	});

	it("is monotonic: lowering it never lightens a colour", () => {
		let previous = 256;
		for (const brightness of [100, 80, 60, 40, 20, 0]) {
			const out = applyCalibration("#C0C0C0", { ...NEUTRAL, brightness });
			const r = parseInt(out.slice(1, 3), 16);
			expect(r).toBeLessThanOrEqual(previous);
			previous = r;
		}
	});
});

describe("white point", () => {
	it("warms below 6500K — blue attenuates relative to red", () => {
		const g = kelvinToRgbGains(4000);
		expect(g.b).toBeLessThan(g.r);
	});

	it("cools above 6500K — red attenuates relative to blue", () => {
		const g = kelvinToRgbGains(12000);
		expect(g.r).toBeLessThan(g.b);
	});

	it("never exceeds unity on any channel, so nothing clips", () => {
		for (let k = 4000; k <= 25000; k += 500) {
			const g = kelvinToRgbGains(k);
			expect(Math.max(g.r, g.g, g.b)).toBeLessThanOrEqual(1 + 1e-12);
			expect(Math.min(g.r, g.g, g.b)).toBeGreaterThanOrEqual(0);
		}
	});

	it("clamps out-of-range input rather than producing a nonsense chromaticity", () => {
		expect(kelvinToChromaticity(1)).toEqual(kelvinToChromaticity(4000));
		expect(kelvinToChromaticity(1e9)).toEqual(kelvinToChromaticity(25000));
	});

	it("stays on the daylight locus: y is a plausible chromaticity across the range", () => {
		for (let k = 4000; k <= 25000; k += 1000) {
			const { x, y } = kelvinToChromaticity(k);
			expect(x).toBeGreaterThan(0.2);
			expect(x).toBeLessThan(0.4);
			expect(y).toBeGreaterThan(0.2);
			expect(y).toBeLessThan(0.45);
		}
	});

	it("moves a white finish perceptibly but not wildly at a warm setting", () => {
		const warmed = applyCalibration("#FFFFFF", { ...NEUTRAL, whitePointK: 4000 });
		const shift = deltaECIEDE2000("#FFFFFF", warmed);
		expect(shift).toBeGreaterThan(1);
		expect(shift).toBeLessThan(30);
	});
});

describe("named transfer targets", () => {
	it("sRGB is the neutral position — the target you are already at", () => {
		expect(calibrationForTarget("sRGB").contrast).toBeCloseTo(50, 10);
	});

	it("Rec.709 and DCI-P3 sit above sRGB, in gamma order", () => {
		const srgb = calibrationForTarget("sRGB").contrast;
		const r709 = calibrationForTarget("Rec.709").contrast;
		const p3 = calibrationForTarget("DCI-P3").contrast;
		expect(r709).toBeGreaterThan(srgb);
		expect(p3).toBeGreaterThan(r709);
	});

	it("preserves the rest of the calibration it is applied to", () => {
		const base: Calibration = { brightness: 80, contrast: 50, whitePointK: 5000 };
		const out = calibrationForTarget("Rec.709", base);
		expect(out.brightness).toBe(80);
		expect(out.whitePointK).toBe(5000);
	});
});

describe("stability", () => {
	it("is deterministic across repeated application", () => {
		const cal: Calibration = { brightness: 90, contrast: 60, whitePointK: 5200 };
		const once = applyCalibration("#C0C0C0", cal);
		expect(applyCalibration("#C0C0C0", cal)).toBe(once);
	});

	it("always emits a well-formed hex", () => {
		for (const hex of FINISHES) {
			for (const k of [4000, 6500, 20000]) {
				const out = applyCalibration(hex, { brightness: 55, contrast: 70, whitePointK: k });
				expect(out).toMatch(/^#[0-9a-f]{6}$/i);
			}
		}
	});
});
