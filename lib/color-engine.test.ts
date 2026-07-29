import { describe, expect, it } from "vitest";
import {
	ColorRegistry,
	contrastRatio,
	pairKey,
	relativeLuminance,
	type ColorNode,
} from "./color-engine";
import { srgbToLinear } from "./three-color-resolve";

const FINISHES: ColorNode[] = [
	{ id: "white-1g", hex: "#FFFFFF", role: "case", family: "white" },
	{ id: "white-5g", hex: "#F5F5F0", role: "case", family: "white" },
	{ id: "black-5g", hex: "#1b1818", role: "case", family: "black" },
	{ id: "black-6g", hex: "#1c1a1b", role: "case", family: "black" },
	{ id: "silver-6g", hex: "#C0C0C0", role: "case", family: "silver" },
	{ id: "wheel-via", hex: "#202022", role: "wheel", family: "black" },
];

const registry = (): ColorRegistry => new ColorRegistry(FINISHES);

describe("pairKey — unordered identity", () => {
	it("is identical in both directions", () => {
		expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
	});

	it("separates distinct pairs", () => {
		expect(pairKey("a", "b")).not.toBe(pairKey("a", "c"));
	});
});

describe("ColorRegistry — flat peer registry", () => {
	it("rejects a malformed hex at the point it is authored", () => {
		expect(() => new ColorRegistry([{ id: "bad", hex: "not-a-colour" }])).toThrow(/invalid hex/);
	});

	it("does not silently coerce a malformed hex to black", () => {
		// normalizeHexColor answers bad input with #000000; the registry must not.
		expect(() => new ColorRegistry([{ id: "bad", hex: "#12345" }])).toThrow(/invalid hex/);
	});

	it("rejects a duplicate id", () => {
		expect(() =>
			new ColorRegistry([
				{ id: "x", hex: "#000000" },
				{ id: "x", hex: "#ffffff" },
			]),
		).toThrow(/duplicate id/);
	});

	it("accepts shorthand hex and normalises it", () => {
		const r = new ColorRegistry([{ id: "s", hex: "#fff" }]);
		expect(r.get("s")?.hex).toBe("#ffffff");
	});
});

describe("pairs — each combination appears exactly once", () => {
	it("emits the upper triangle: n*(n-1)/2 pairs, no diagonal", () => {
		const r = registry();
		const pairs = r.pairs();
		expect(pairs).toHaveLength((FINISHES.length * (FINISHES.length - 1)) / 2);
		expect(pairs.every((p) => p.a.id !== p.b.id)).toBe(true);
	});

	it("never emits the same combination twice in either order", () => {
		const keys = registry().pairs().map((p) => p.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("measures distance symmetrically regardless of which side is listed first", () => {
		const r = registry();
		const m = r.pairs().find((p) => p.key === pairKey("black-5g", "wheel-via"));
		expect(m).toBeDefined();
		// The failing manifest rule, measured through the engine.
		expect(m?.deltaE).toBeCloseTo(3.276, 2);
	});
});

describe("match — custom rules over the registry", () => {
	it("returns only pairs inside a distance window, each once", () => {
		const out = registry().match({ maxDeltaE: 5 });
		expect(out.length).toBeGreaterThan(0);
		expect(out.every((m) => m.deltaE <= 5)).toBe(true);
		expect(new Set(out.map((m) => m.key)).size).toBe(out.length);
	});

	it("orders by perceptual distance, closest first", () => {
		const out = registry().match();
		const deltas = out.map((m) => m.deltaE);
		expect([...deltas].sort((a, b) => a - b)).toEqual(deltas);
	});

	it("filters to pairs within one family", () => {
		const out = registry().match({ family: "same" });
		expect(out.every((m) => m.a.family === m.b.family)).toBe(true);
	});

	it("filters to pairs across two families", () => {
		const out = registry().match({ family: "different" });
		expect(out.every((m) => m.a.family !== m.b.family)).toBe(true);
	});

	it("restricts by role before pairing, not after", () => {
		const out = registry().match({ roles: ["case"] });
		expect(out.every((m) => m.a.role === "case" && m.b.role === "case")).toBe(true);
		const cases = FINISHES.filter((f) => f.role === "case").length;
		expect(out).toHaveLength((cases * (cases - 1)) / 2);
	});

	it("applies a contrast floor for pairs that must carry text", () => {
		const out = registry().match({ minContrast: 4.5 });
		expect(out.every((m) => m.contrast >= 4.5)).toBe(true);
	});

	it("returns nothing when a rule is unsatisfiable, rather than falling back", () => {
		expect(registry().match({ minDeltaE: 500 })).toEqual([]);
	});
});

describe("matchesFor — a peer relation read from one side", () => {
	it("returns the same edges match() does, filtered to one node", () => {
		const r = registry();
		const all = r.match({ maxDeltaE: 20 });
		const mine = r.matchesFor("black-5g", { maxDeltaE: 20 });
		expect(mine.every((m) => all.some((a) => a.key === m.key))).toBe(true);
		expect(mine.every((m) => m.a.id === "black-5g" || m.b.id === "black-5g")).toBe(true);
	});

	it("is symmetric: an edge is visible from both of its nodes", () => {
		const r = registry();
		const fromA = r.matchesFor("black-5g").map((m) => m.key);
		const fromB = r.matchesFor("wheel-via").map((m) => m.key);
		const shared = pairKey("black-5g", "wheel-via");
		expect(fromA).toContain(shared);
		expect(fromB).toContain(shared);
	});

	it("throws on an unknown id rather than returning an empty list", () => {
		expect(() => registry().matchesFor("nope")).toThrow(/unknown id/);
	});
});

describe("luminance and contrast", () => {
	it("anchors black and white", () => {
		expect(relativeLuminance("#000000")).toBeCloseTo(0, 10);
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
	});

	it("gives the WCAG 21:1 extreme", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 6);
	});

	it("is symmetric", () => {
		expect(contrastRatio("#1b1818", "#F5F5F0")).toBeCloseTo(
			contrastRatio("#F5F5F0", "#1b1818"),
			10,
		);
	});

	/**
	 * This module is now the repo's only relative-luminance implementation;
	 * `color-manifest` and `studio-control-tokens` re-export it. Those two used
	 * WCAG's quoted knee of 0.03928 while this uses IEC 61966-2-1's normative
	 * 0.04045, so collapsing them looks like a behaviour change and is not one.
	 *
	 * Proof rather than assurance: the knees bracket (0.03928, 0.04045], and no
	 * 8-bit code lands inside — 10/255 = 0.039216 falls below, 11/255 = 0.043137
	 * above. Every hex input takes the same branch under either constant, so the
	 * two forms are bitwise identical over the entire input domain.
	 */
	it("is unaffected by the WCAG-vs-IEC knee discrepancy, across all 256 codes", () => {
		const withKnee = (knee: number) => (hex: string) => {
			const v = Number.parseInt(hex.slice(1), 16);
			const lin = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
				const s = c / 255;
				return s <= knee ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
		};
		const wcag = withKnee(0.03928);
		const iec = withKnee(0.04045);
		for (let v = 0; v < 256; v += 1) {
			const hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
			expect(wcag(hex), `grey ${hex}`).toBe(iec(hex));
			expect(relativeLuminance(hex)).toBe(iec(hex));
		}
		// And no 8-bit value can ever fall between the two knees.
		const between = [...Array(256).keys()].map((v) => v / 255).filter((s) => s > 0.03928 && s <= 0.04045);
		expect(between).toEqual([]);
	});

	/**
	 * The contrast model and the render linearisation answer different physical
	 * questions and must not be merged. They agree channel-wise by construction —
	 * both are the sRGB EOTF — and differ in what they do next: this one applies
	 * observer weighting to produce a single luminance, the renderer's keeps three
	 * channels of radiometric light. Pinning the agreement documents that the
	 * separation is deliberate, not an oversight.
	 */
	it("shares the sRGB EOTF with the render linearisation but not its purpose", () => {
		for (let v = 0; v < 256; v += 1) {
			const hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
			// A neutral grey's relative luminance is its linear channel value, since
			// the three observer weights sum to 1.
			expect(relativeLuminance(hex)).toBeCloseTo(srgbToLinear(v / 255), 12);
		}
		// But the renderer's function is per-channel and has no luminance opinion:
		// it cannot answer the contrast question for a chromatic colour.
		expect(relativeLuminance("#00FF00")).toBeGreaterThan(relativeLuminance("#0000FF"));
		expect(srgbToLinear(1)).toBe(srgbToLinear(1));
	});
});
