import { describe, expect, it } from "vitest";

import { clampCaptureTarget, MOBILE_MAX_LONG_EDGE } from "./export-target";

// Desktop GPUs report limits far above any export the app requests.
const DESKTOP: { maxTextureSize: number; maxSamples: number; maxLongEdge: number } = {
	maxTextureSize: 16384,
	maxSamples: 8,
	maxLongEdge: Number.POSITIVE_INFINITY,
};

// A representative mobile GPU: dimension limit is generous, but MSAA caps at 4 and we
// impose the memory ceiling.
const MOBILE = {
	maxTextureSize: 8192,
	maxSamples: 4,
	maxLongEdge: MOBILE_MAX_LONG_EDGE,
};

describe("clampCaptureTarget", () => {
	it("passes a 4K/8× still through untouched on desktop", () => {
		expect(clampCaptureTarget({ width: 2160, height: 3840, samples: 8 }, DESKTOP)).toEqual({
			width: 2160,
			height: 3840,
			samples: 8,
		});
	});

	it("scales a 4K still under the mobile long-edge ceiling and preserves aspect", () => {
		const out = clampCaptureTarget({ width: 2160, height: 3840, samples: 8 }, MOBILE);
		// Long edge pinned to the ceiling…
		expect(Math.max(out.width, out.height)).toBe(MOBILE_MAX_LONG_EDGE);
		// …samples clamped to the GPU max…
		expect(out.samples).toBe(4);
		// …and the aspect ratio is unchanged (uniform scale).
		expect(out.width / out.height).toBeCloseTo(2160 / 3840, 5);
	});

	it("clamps sample count even when dimensions are already within budget", () => {
		const out = clampCaptureTarget({ width: 1024, height: 1024, samples: 8 }, MOBILE);
		expect(out).toEqual({ width: 1024, height: 1024, samples: 4 });
	});

	it("honors the hard texture-size limit when it is the tighter bound", () => {
		const tinyGpu = { maxTextureSize: 1024, maxSamples: 4, maxLongEdge: Number.POSITIVE_INFINITY };
		const out = clampCaptureTarget({ width: 2160, height: 3840, samples: 8 }, tinyGpu);
		expect(Math.max(out.width, out.height)).toBe(1024);
		expect(out.width / out.height).toBeCloseTo(2160 / 3840, 5);
	});

	it("never returns a zero dimension", () => {
		const out = clampCaptureTarget({ width: 1, height: 10000, samples: 0 }, MOBILE);
		expect(out.width).toBeGreaterThanOrEqual(1);
		expect(out.height).toBeGreaterThanOrEqual(1);
	});
});
