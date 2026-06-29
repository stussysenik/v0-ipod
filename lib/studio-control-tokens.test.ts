import { describe, expect, it } from "vitest";

import {
	ANCHOR_TONE_DARK,
	ANCHOR_TONE_LIGHT,
	SURFACE_BASE_TINT,
	TEXT_CONTRAST_FLOOR,
	UI_CONTRAST_FLOOR,
	contrastRatio,
	solveControlTokens,
} from "./studio-control-tokens";

// A representative sweep of stage colors: greyscale, vivid hues, the brand blue, and the
// awkward mid-luminance band where naive solving fails.
const STAGE_SWEEP = [
	"#000000", "#0A0A0A", "#1B1818", "#2B2B2B", "#3D3D3D", "#555555", "#6E6E6E",
	"#777777", "#7E7E7E", "#808080", "#888888", "#999999", "#AAAAAA", "#CCCCCC",
	"#E5E5E5", "#F2F2F2", "#FFFFFF", "#0048FF", "#0F62FE", "#FF3B30", "#34C759",
	"#FFCC00", "#5856D6", "#008080", "#2E8B57", "#8B008B", "#FF7F50", "#1E90FF",
];

describe("solveControlTokens — contrast floor", () => {
	it.each(STAGE_SWEEP)("clears every floor for stage %s", (stage) => {
		const t = solveControlTokens(stage);
		// Text on its surface.
		expect(contrastRatio(t.label, t.surface)).toBeGreaterThanOrEqual(TEXT_CONTRAST_FLOOR);
		// Selected label on the solid fill (the affordance state).
		expect(contrastRatio(t.selectedLabel, t.selectedFill)).toBeGreaterThanOrEqual(
			TEXT_CONTRAST_FLOOR,
		);
		// Accent + focus ring as UI components on the surface.
		expect(contrastRatio(t.accent, t.surface)).toBeGreaterThanOrEqual(UI_CONTRAST_FLOOR);
		expect(contrastRatio(t.focusRing, t.surface)).toBeGreaterThanOrEqual(UI_CONTRAST_FLOOR);
	});
});

describe("solveControlTokens — determinism", () => {
	it("produces identical tokens on repeated runs (snapshot-stable)", () => {
		for (const stage of STAGE_SWEEP) {
			expect(solveControlTokens(stage)).toEqual(solveControlTokens(stage));
		}
	});

	it("pins exact output for fixed stages (no drift)", () => {
		expect(solveControlTokens("#FFFFFF")).toMatchInlineSnapshot(`
			{
			  "accent": "#0048FF",
			  "focusRing": "#0048FF",
			  "hairline": "#D7D8D9",
			  "label": "#10141A",
			  "selectedFill": "#0048FF",
			  "selectedLabel": "#F4F6F8",
			  "surface": "#FDFDFD",
			}
		`);
		expect(solveControlTokens("#0048FF")).toMatchInlineSnapshot(`
			{
			  "accent": "#7AA0FF",
			  "focusRing": "#7AA0FF",
			  "hairline": "#3D6AD9",
			  "label": "#F4F6F8",
			  "selectedFill": "#7AA0FF",
			  "selectedLabel": "#10141A",
			  "surface": "#0A42D0",
			}
		`);
		expect(solveControlTokens("#1B1818")).toMatchInlineSnapshot(`
			{
			  "accent": "#1457FF",
			  "focusRing": "#1457FF",
			  "hairline": "#4E4C4C",
			  "label": "#F4F6F8",
			  "selectedFill": "#1457FF",
			  "selectedLabel": "#F4F6F8",
			  "surface": "#1F1C1C",
			}
		`);
	});

	it("uses a single accent source for selection, fill, and focus ring", () => {
		const t = solveControlTokens("#0048FF");
		expect(t.selectedFill).toBe(t.accent);
		expect(t.focusRing).toBe(t.accent);
	});
});

describe("solveControlTokens — mid-luminance fallback", () => {
	// Recreate the naive base surface (stage lightly neutralized) to prove the solver
	// shaded *further* toward the anchor when the base surface failed the text floor.
	function naiveSurface(stage: string, isLight: boolean): string {
		const anchorTone = isLight ? ANCHOR_TONE_LIGHT : ANCHOR_TONE_DARK;
		const v = Number.parseInt(stage.slice(1), 16);
		const s = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
		const a = anchorTone * 255;
		const m = s.map((c) => Math.round(c + (a - c) * SURFACE_BASE_TINT));
		return `#${((1 << 24) + (m[0] << 16) + (m[1] << 8) + m[2]).toString(16).slice(1).toUpperCase()}`;
	}

	it("shades the surface away from the stage rather than only swapping ink", () => {
		// Find any stage whose glassy base surface would fail the text floor — proving the
		// mid-luminance fallback is a live mechanism, not dead code.
		const triggers = STAGE_SWEEP.filter((stage) => {
			const t = solveControlTokens(stage);
			const isLight =
				contrastRatio("#10141A", t.surface) >= contrastRatio("#F4F6F8", t.surface);
			return contrastRatio(t.label, naiveSurface(stage, isLight)) < TEXT_CONTRAST_FLOOR;
		});
		expect(triggers.length).toBeGreaterThan(0);

		// For each triggering stage the solved surface clears the floor (shaded away from
		// the stage) and differs from the failing base surface.
		for (const stage of triggers) {
			const t = solveControlTokens(stage);
			const isLight =
				contrastRatio("#10141A", t.surface) >= contrastRatio("#F4F6F8", t.surface);
			expect(contrastRatio(t.label, t.surface)).toBeGreaterThanOrEqual(TEXT_CONTRAST_FLOOR);
			expect(t.surface).not.toBe(naiveSurface(stage, isLight));
		}
	});
});
