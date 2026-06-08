import { describe, expect, it } from "vitest";

import { APPLE_PRODUCT_RIG, DESIGNER_DARK_RIG } from "./studio-lighting-config";
import { STEEL_ROUGHNESS_FLOOR, deriveOwnedRig, relativeLuminance } from "./studio-owned-finish";

describe("relativeLuminance", () => {
	it("maps black→0 and white→1", () => {
		expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
	});

	it("is monotonic in brightness and weights green heaviest", () => {
		expect(relativeLuminance("#808080")).toBeGreaterThan(relativeLuminance("#404040"));
		// Rec.709: pure green is far brighter than pure blue.
		expect(relativeLuminance("#00ff00")).toBeGreaterThan(relativeLuminance("#0000ff"));
	});

	it("tolerates shorthand and a missing hash", () => {
		expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
		expect(relativeLuminance("000")).toBeCloseTo(0, 5);
	});
});

describe("STEEL_ROUGHNESS_FLOOR", () => {
	it("sits above the mirror-crawl threshold", () => {
		// Below ~0.1 the back reads as a 1:1 mirror and crawls under a turntable.
		expect(STEEL_ROUGHNESS_FLOOR).toBeGreaterThan(0.1);
		expect(STEEL_ROUGHNESS_FLOOR).toBeLessThan(0.3);
	});
});

describe("deriveOwnedRig — purity", () => {
	it("never mutates the base config", () => {
		const baseRimBefore = DESIGNER_DARK_RIG.rim.intensity;
		const baseFillBefore = APPLE_PRODUCT_RIG.fill.intensity;
		deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#000000", back: "#000000", stage: "#0b0d12" });
		deriveOwnedRig(APPLE_PRODUCT_RIG, { skin: "#ffffff", stage: "#ffffff" });
		expect(DESIGNER_DARK_RIG.rim.intensity).toBe(baseRimBefore);
		expect(APPLE_PRODUCT_RIG.fill.intensity).toBe(baseFillBefore);
	});
});

describe("deriveOwnedRig — I2 separation", () => {
	it("dark device on a dark stage boosts the cool rim", () => {
		const out = deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#0d0f14", back: "#0d0f14", stage: "#0b0d12" });
		expect(out.rim.intensity).toBeGreaterThan(DESIGNER_DARK_RIG.rim.intensity);
	});

	it("a clearly distinct device on a dark stage leaves the rim ~unchanged", () => {
		const out = deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#e8e8e8", back: "#e8e8e8", stage: "#0b0d12" });
		expect(out.rim.intensity).toBeCloseTo(DESIGNER_DARK_RIG.rim.intensity, 5);
	});

	it("rim boost grows as the device tone converges on the stage", () => {
		const near = deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#101319", back: "#101319", stage: "#0b0d12" });
		const far = deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#5a5f6b", back: "#5a5f6b", stage: "#0b0d12" });
		expect(near.rim.intensity).toBeGreaterThan(far.rim.intensity);
	});

	it("light device on a light stage deepens the dark contrast panel", () => {
		const panelIndex = APPLE_PRODUCT_RIG.env.softboxes.findIndex(
			(s) => relativeLuminance(s.color) < 0.08,
		);
		expect(panelIndex).toBeGreaterThanOrEqual(0);
		const out = deriveOwnedRig(APPLE_PRODUCT_RIG, { skin: "#fafafa", back: "#fafafa", stage: "#ffffff" });
		expect(out.env.softboxes[panelIndex]!.intensity).toBeGreaterThan(
			APPLE_PRODUCT_RIG.env.softboxes[panelIndex]!.intensity,
		);
	});
});

describe("deriveOwnedRig — I4 no crush / no wash", () => {
	it("a near-black face lifts the fill and ambient floor", () => {
		const out = deriveOwnedRig(DESIGNER_DARK_RIG, { skin: "#050505", stage: "#0b0d12" });
		expect(out.fill.intensity).toBeGreaterThan(DESIGNER_DARK_RIG.fill.intensity);
		expect(out.ambient.intensity).toBeGreaterThan(DESIGNER_DARK_RIG.ambient.intensity);
	});

	it("a near-white face trims the key and env to avoid washing the hue flat", () => {
		const out = deriveOwnedRig(APPLE_PRODUCT_RIG, { skin: "#ffffff", stage: "#ffffff" });
		expect(out.key.intensity).toBeLessThan(APPLE_PRODUCT_RIG.key.intensity);
		expect(out.env.intensity).toBeLessThan(APPLE_PRODUCT_RIG.env.intensity);
	});

	it("a mid-tone face leaves key/fill/ambient essentially untouched", () => {
		const out = deriveOwnedRig(APPLE_PRODUCT_RIG, { skin: "#8a8d92", stage: "#ffffff" });
		expect(out.key.intensity).toBeCloseTo(APPLE_PRODUCT_RIG.key.intensity, 5);
		expect(out.fill.intensity).toBeCloseTo(APPLE_PRODUCT_RIG.fill.intensity, 5);
		expect(out.ambient.intensity).toBeCloseTo(APPLE_PRODUCT_RIG.ambient.intensity, 5);
	});
});
