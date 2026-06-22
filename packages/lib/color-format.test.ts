import { describe, expect, it } from "vitest";

import { type ColorFormat, formatColor, parseColor } from "./color-format";

describe("parseColor — hex", () => {
	it("expands shorthand and uppercases", () => {
		expect(parseColor("#000")).toBe("#000000");
		expect(parseColor("#FFF")).toBe("#FFFFFF");
		expect(parseColor("#1a2b3c")).toBe("#1A2B3C");
		expect(parseColor("#FFFFFF")).toBe("#FFFFFF");
	});

	it("accepts hex without a leading hash", () => {
		expect(parseColor("1a2b3c")).toBe("#1A2B3C");
		expect(parseColor("fff")).toBe("#FFFFFF");
	});

	it("trims surrounding whitespace", () => {
		expect(parseColor("  #1a2b3c  ")).toBe("#1A2B3C");
	});
});

describe("parseColor — rgb / rgba", () => {
	it("parses integer channels", () => {
		expect(parseColor("rgb(26, 43, 60)")).toBe("#1A2B3C");
		expect(parseColor("rgb(0,0,0)")).toBe("#000000");
		expect(parseColor("rgb(255, 255, 255)")).toBe("#FFFFFF");
	});

	it("ignores the alpha channel of rgba()", () => {
		expect(parseColor("rgba(26, 43, 60, 0.5)")).toBe("#1A2B3C");
	});

	it("supports the space/slash CSS4 syntax", () => {
		expect(parseColor("rgb(26 43 60)")).toBe("#1A2B3C");
		expect(parseColor("rgb(26 43 60 / 50%)")).toBe("#1A2B3C");
	});

	it("supports percentage channels", () => {
		expect(parseColor("rgb(0%, 0%, 0%)")).toBe("#000000");
		expect(parseColor("rgb(100%, 100%, 100%)")).toBe("#FFFFFF");
	});
});

describe("parseColor — hsl / hsla", () => {
	it("parses canonical hsl values", () => {
		expect(parseColor("hsl(0, 0%, 0%)")).toBe("#000000");
		expect(parseColor("hsl(0, 0%, 100%)")).toBe("#FFFFFF");
		expect(parseColor("hsl(0, 100%, 50%)")).toBe("#FF0000");
		expect(parseColor("hsl(120, 100%, 50%)")).toBe("#00FF00");
		expect(parseColor("hsl(240, 100%, 50%)")).toBe("#0000FF");
	});

	it("ignores the alpha channel of hsla()", () => {
		expect(parseColor("hsla(240, 100%, 50%, 0.25)")).toBe("#0000FF");
	});
});

describe("parseColor — invalid input", () => {
	it("returns null for unparseable strings", () => {
		expect(parseColor("nope")).toBeNull();
		expect(parseColor("#12")).toBeNull();
		expect(parseColor("")).toBeNull();
		expect(parseColor("   ")).toBeNull();
		expect(parseColor("#12345")).toBeNull();
		expect(parseColor("#GGGGGG")).toBeNull();
	});

	it("rejects out-of-range channels", () => {
		expect(parseColor("rgb(256, 0, 0)")).toBeNull();
		expect(parseColor("rgb(-1, 0, 0)")).toBeNull();
		expect(parseColor("rgb(0, 0)")).toBeNull();
		expect(parseColor("hsl(0, 150%, 50%)")).toBeNull();
		expect(parseColor("hsl(0, 50%, 200%)")).toBeNull();
	});
});

describe("formatColor", () => {
	it("renders each notation", () => {
		expect(formatColor("#1A2B3C", "hex")).toBe("#1A2B3C");
		expect(formatColor("#1a2b3c", "hex")).toBe("#1A2B3C");
		expect(formatColor("#000000", "rgb")).toBe("rgb(0, 0, 0)");
		expect(formatColor("#FFFFFF", "rgb")).toBe("rgb(255, 255, 255)");
		expect(formatColor("#FF0000", "hsl")).toBe("hsl(0, 100%, 50%)");
	});
});

describe("round-trip stability", () => {
	// hex and rgb are lossless for every 24-bit colour.
	const exact = ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#808080", "#1A2B3C", "#C8C9CB"];
	const exactFormats: ColorFormat[] = ["hex", "rgb"];
	for (const hex of exact) {
		for (const fmt of exactFormats) {
			it(`${hex} via ${fmt} re-parses to itself`, () => {
				expect(parseColor(formatColor(hex, fmt))).toBe(hex);
			});
		}
	}

	// HSL with integer components is lossy for arbitrary colours, but stable for
	// the representative anchors (pure primaries, greyscale) — the spec's bar.
	const hslStable = ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#808080"];
	for (const hex of hslStable) {
		it(`${hex} via hsl re-parses to itself`, () => {
			expect(parseColor(formatColor(hex, "hsl"))).toBe(hex);
		});
	}
});
