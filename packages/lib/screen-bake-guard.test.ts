import { describe, expect, it } from "vitest";

import {
	BLANK_VARIANCE_THRESHOLD,
	isBlankLuminance,
	luminanceStats,
	rasterizeWithBlankRetry,
} from "./screen-bake-guard";

/**
 * Why these tests exist — the "dead iPod OS" export bug.
 *
 * On long clip exports (~40s+) Chromium's foreignObject rasterizer intermittently
 * painted the Now Playing screen's content layer EMPTY (status bar + progress bar
 * intact, everything between them pure white). Measured live: 94–113 of 120
 * re-bakes blanked on a 60s export, and a single immediate "warm" retry repaired
 * 94/94 of them. These tests lock down the probe (what counts as blank) and the
 * retry policy (warm retries, then hold-last-good).
 */

/** Build an RGBA byte array of `n` pixels, all the same gray value. */
function uniformPixels(n: number, value: number): Uint8ClampedArray {
	const data = new Uint8ClampedArray(n * 4);
	for (let i = 0; i < data.length; i += 4) {
		data[i] = data[i + 1] = data[i + 2] = value;
		data[i + 3] = 255;
	}
	return data;
}

/** Alternate black/white pixels — maximal contrast, like text on an LCD. */
function contrastyPixels(n: number): Uint8ClampedArray {
	const data = new Uint8ClampedArray(n * 4);
	for (let p = 0; p < n; p++) {
		const v = p % 2 === 0 ? 0 : 255;
		const i = p * 4;
		data[i] = data[i + 1] = data[i + 2] = v;
		data[i + 3] = 255;
	}
	return data;
}

describe("luminanceStats", () => {
	it("reports zero variance for a uniform field", () => {
		const { mean, variance } = luminanceStats(uniformPixels(64, 255));
		expect(mean).toBeCloseTo(255, 0);
		expect(variance).toBeCloseTo(0, 5);
	});

	it("reports high variance for text-like contrast", () => {
		const { variance } = luminanceStats(contrastyPixels(64));
		expect(variance).toBeGreaterThan(1000);
	});
});

describe("isBlankLuminance", () => {
	it("flags a pure-white content region as blank", () => {
		expect(isBlankLuminance(uniformPixels(64, 255))).toBe(true);
	});

	it("flags a pure-black content region as blank (screen-off render)", () => {
		expect(isBlankLuminance(uniformPixels(64, 0))).toBe(true);
	});

	it("does not flag real screen content", () => {
		expect(isBlankLuminance(contrastyPixels(64))).toBe(false);
	});

	it("uses a threshold tuned above encoder noise but below any real content", () => {
		// Real blank bakes measured variance 0; real content measured ~3180.
		expect(BLANK_VARIANCE_THRESHOLD).toBeGreaterThan(0);
		expect(BLANK_VARIANCE_THRESHOLD).toBeLessThan(1000);
	});
});

describe("rasterizeWithBlankRetry", () => {
	it("returns the first rasterization when it has content", async () => {
		const calls: boolean[] = [];
		const result = await rasterizeWithBlankRetry(
			async (bust) => {
				calls.push(bust);
				return "good";
			},
			async () => false,
		);
		expect(result).toBe("good");
		expect(calls).toEqual([true]); // first attempt busts cache by default
	});

	it("retries warm (no cache-bust) when the first bake is blank", async () => {
		const outputs = ["blank", "good"];
		const calls: boolean[] = [];
		const result = await rasterizeWithBlankRetry(
			async (bust) => {
				calls.push(bust);
				return outputs.shift() as string;
			},
			async (url) => url === "blank",
		);
		expect(result).toBe("good");
		expect(calls).toEqual([true, false]); // retry rides the warm cache
	});

	it("honours firstAttemptBustsCache=false for re-bakes", async () => {
		const calls: boolean[] = [];
		await rasterizeWithBlankRetry(
			async (bust) => {
				calls.push(bust);
				return "good";
			},
			async () => false,
			{ firstAttemptBustsCache: false },
		);
		expect(calls).toEqual([false]);
	});

	it("returns null after exhausting the retry budget so callers hold the last good frame", async () => {
		let attempts = 0;
		const result = await rasterizeWithBlankRetry(
			async () => {
				attempts++;
				return "blank";
			},
			async () => true,
			{ maxRetries: 3 },
		);
		expect(result).toBeNull();
		expect(attempts).toBe(4); // 1 initial + 3 retries
	});

	it("never swaps in a blank: a blank final attempt still yields null", async () => {
		const result = await rasterizeWithBlankRetry(
			async () => "blank",
			async () => true,
			{ maxRetries: 1 },
		);
		expect(result).toBeNull();
	});
});
