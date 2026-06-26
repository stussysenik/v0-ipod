import { describe, expect, it } from "vitest";

import { computeStageLayout, railLayoutMode, rectsOverlap, type Rect } from "./keepout";

// A grid of realistic stage sizes: compact phones, large phones, tablets, desktop —
// both portrait and landscape. The keep-out invariant must hold for every one.
const STAGE_SIZES = [
	{ width: 320, height: 568 }, // iPhone SE portrait
	{ width: 390, height: 844 }, // iPhone 14 portrait (the screenshot)
	{ width: 844, height: 390 }, // iPhone 14 landscape
	{ width: 768, height: 1024 }, // iPad portrait
	{ width: 1280, height: 832 }, // laptop
	{ width: 1440, height: 900 }, // desktop
];

describe("rectsOverlap", () => {
	const base: Rect = { x: 0, y: 0, width: 100, height: 100 };

	it("detects a genuine intersection", () => {
		expect(rectsOverlap(base, { x: 50, y: 50, width: 100, height: 100 })).toBe(true);
	});

	it("treats edge-touching rects as non-overlapping (zero intersection area)", () => {
		// Shared edge, no shared area — this is exactly a device sitting flush against a rail.
		expect(rectsOverlap(base, { x: 100, y: 0, width: 100, height: 100 })).toBe(false);
	});

	it("detects fully disjoint rects", () => {
		expect(rectsOverlap(base, { x: 200, y: 200, width: 10, height: 10 })).toBe(false);
	});
});

describe("railLayoutMode", () => {
	it("stacks rails as rows below the device on narrow containers", () => {
		expect(railLayoutMode(390, 560)).toBe("rows");
	});

	it("places rails as side columns on wide containers", () => {
		expect(railLayoutMode(1280, 560)).toBe("columns");
	});

	it("treats the breakpoint itself as wide (>=)", () => {
		expect(railLayoutMode(560, 560)).toBe("columns");
	});
});

describe("computeStageLayout — the keep-out invariant", () => {
	it("never lets a rail overlap the device, at any stage size", () => {
		for (const stage of STAGE_SIZES) {
			const layout = computeStageLayout(stage);
			for (const rail of layout.rails) {
				expect(
					rectsOverlap(layout.device, rail),
					`device overlaps a rail at ${stage.width}x${stage.height}`,
				).toBe(false);
			}
		}
	});

	it("keeps every rail disjoint from every other rail", () => {
		for (const stage of STAGE_SIZES) {
			const { rails } = computeStageLayout(stage);
			for (let i = 0; i < rails.length; i++) {
				for (let j = i + 1; j < rails.length; j++) {
					expect(rectsOverlap(rails[i], rails[j])).toBe(false);
				}
			}
		}
	});

	it("never produces horizontal overflow (everything fits within the stage width)", () => {
		for (const stage of STAGE_SIZES) {
			const layout = computeStageLayout(stage);
			const boxes = [layout.device, ...layout.rails];
			for (const b of boxes) {
				expect(b.x).toBeGreaterThanOrEqual(0);
				expect(b.x + b.width).toBeLessThanOrEqual(stage.width + 0.001);
			}
		}
	});
});

describe("computeStageLayout — container-query determinism", () => {
	it("sizes the device off container WIDTH in rows mode, so a height change can't rescale it", () => {
		// The screenshot bug: URL bar collapses, height drops 844->440, device shrinks.
		const tall = computeStageLayout({ width: 390, height: 844 });
		const short = computeStageLayout({ width: 390, height: 440 });
		expect(tall.mode).toBe("rows");
		expect(short.device.width).toBeCloseTo(tall.device.width, 5);
		expect(short.device.height).toBeCloseTo(tall.device.height, 5);
	});

	it("renders proportionally at two very different container widths", () => {
		const small = computeStageLayout({ width: 320, height: 568 });
		const large = computeStageLayout({ width: 900, height: 700 });
		const ratio = (r: Rect) => r.width / r.height;
		// Same device aspect ratio regardless of container size.
		expect(ratio(small.device)).toBeCloseTo(ratio(large.device), 3);
	});

	it("stacks rails below the device in rows mode (device sits above every rail)", () => {
		const layout = computeStageLayout({ width: 390, height: 844 });
		expect(layout.mode).toBe("rows");
		for (const rail of layout.rails) {
			expect(rail.y).toBeGreaterThanOrEqual(layout.device.y + layout.device.height - 0.001);
		}
	});
});
