import { describe, expect, it } from "vitest";

import { colorManifest } from "./color-manifest";
import { hexToRgb, rgbToHex, deltaECIEDE2000 } from "./color-proximity";
import {
	NEUTRAL_START_COMPRESSION,
	neutralToneMap,
	srgbToLinear,
	linearToSrgb,
} from "./three-color-resolve";

// Feed a picked hex through the display transform the way the GPU does: sRGB → linear,
// tone-map, then the sRGB output encode — and read the result back as a hex so we can
// score it against the pick in perceptual (ΔE2000) terms.
function hexThroughNeutral(hex: string): string {
	const { r, g, b } = hexToRgb(hex);
	const [tr, tg, tb] = neutralToneMap([
		srgbToLinear(r / 255),
		srgbToLinear(g / 255),
		srgbToLinear(b / 255),
	]);
	return rgbToHex(linearToSrgb(tr) * 255, linearToSrgb(tg) * 255, linearToSrgb(tb) * 255);
}

function linearPeak(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return Math.max(srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
}

describe("neutralToneMap — port faithfulness to three r182 GLSL", () => {
	it("holds the compression threshold at linear peak 0.76", () => {
		expect(NEUTRAL_START_COMPRESSION).toBeCloseTo(0.76, 10);
	});

	it("passes true black through untouched (offset tapers to zero at black)", () => {
		expect(neutralToneMap([0, 0, 0])).toEqual([0, 0, 0]);
	});

	it("compresses an over-range peak toward — but never to — white", () => {
		const [r] = neutralToneMap([4, 4, 4]);
		expect(r).toBeLessThan(1);
		expect(r).toBeGreaterThan(NEUTRAL_START_COMPRESSION);
	});
});

describe("neutralToneMap — below-threshold guarantee (hue preserved, bounded black lift)", () => {
	// A neutral + a chromatic sample, both with peak < 0.76.
	const samples: ReadonlyArray<readonly [number, number, number]> = [
		[0.5, 0.5, 0.5],
		[0.6, 0.3, 0.15],
		[0.2, 0.4, 0.7],
		[0.05, 0.05, 0.05],
	];

	it("shifts every channel by one shared offset in [0, 0.04] — so channel deltas (hue) survive", () => {
		for (const c of samples) {
			const out = neutralToneMap(c);
			const offsets = c.map((v, i) => v - out[i]);
			for (const o of offsets) {
				expect(o).toBeGreaterThanOrEqual(0);
				expect(o).toBeLessThanOrEqual(0.04 + 1e-9);
			}
			// One shared offset ⇒ pairwise channel differences are invariant (hue preserved).
			expect(out[0] - out[1]).toBeCloseTo(c[0] - c[1], 9);
			expect(out[1] - out[2]).toBeCloseTo(c[1] - c[2], 9);
		}
	});

	it("darkens monotonically (output never brighter than input) below threshold", () => {
		for (const c of samples) {
			const out = neutralToneMap(c);
			out.forEach((v, i) => expect(v).toBeLessThanOrEqual(c[i] + 1e-9));
		}
	});
});

describe("neutralToneMap — above-threshold rolloff is monotonic with no clip plateau", () => {
	it("maps a rising grayscale ramp to a strictly increasing, sub-unity peak", () => {
		let prev = -1;
		for (let peak = 0.76; peak <= 8; peak += 0.05) {
			const [out] = neutralToneMap([peak, peak, peak]);
			expect(out).toBeGreaterThan(prev); // strictly increasing → no flat clip plateau
			expect(out).toBeLessThan(1); // never reaches white
			prev = out;
		}
	});
});

describe("neutralToneMap — real manifest finishes, banded by the physics", () => {
	const finishes = colorManifest.authenticFinishes.map((f) => ({ ...f, peak: linearPeak(f.hex) }));

	it("has finishes in each band (guards the partition from silently emptying)", () => {
		expect(finishes.some((f) => f.peak >= 0.5 && f.peak < NEUTRAL_START_COMPRESSION)).toBe(true);
		expect(finishes.some((f) => f.peak < 0.5)).toBe(true);
	});

	// Mid/light finishes with radiance headroom above the ≤0.04 black floor: the picked
	// hex survives within the perceptibility bound. (ΔE ≈ 1–2 is "imperceptible"; research
	// charter Q2.) Silver measures ~1.75, product-red ~0.0.
	it("preserves below-threshold finishes with peak ≥ 0.5 within ΔE2000 ≤ 2", () => {
		const mids = finishes.filter((f) => f.peak >= 0.5 && f.peak < NEUTRAL_START_COMPRESSION);
		for (const f of mids) {
			expect(deltaECIEDE2000(f.hex, hexThroughNeutral(f.hex))).toBeLessThanOrEqual(2);
		}
	});

	// Dark finishes (peak ≪ 0.5): the ≤0.04 linear black floor is a large *perceptual*
	// shift, so raw albedo through the transform is NOT within ΔE 2 — and that is correct
	// radiance behaviour, not a regression. On-screen WYSIWYG for the picked hex is carried
	// by `toneMapped={false}` swatches (task 0.2); black reading as a distinct surface is
	// carried by specular separation (task 3), never by the albedo. What we DO guarantee for
	// darks is the universal below-threshold property: hue preserved, bounded black lift.
	it("keeps hue + bounds the black lift on dark finishes (deviation is the offset, not distortion)", () => {
		const darks = finishes.filter((f) => f.peak < 0.5);
		for (const f of darks) {
			const { r, g, b } = hexToRgb(f.hex);
			const lin: [number, number, number] = [
				srgbToLinear(r / 255),
				srgbToLinear(g / 255),
				srgbToLinear(b / 255),
			];
			const out = neutralToneMap(lin);
			const offsets = lin.map((v, i) => v - out[i]);
			for (const o of offsets) {
				expect(o).toBeGreaterThanOrEqual(-1e-9);
				expect(o).toBeLessThanOrEqual(0.04 + 1e-9);
			}
			expect(out[0] - out[1]).toBeCloseTo(lin[0] - lin[1], 9);
			expect(out[1] - out[2]).toBeCloseTo(lin[1] - lin[2], 9);
		}
	});
});
