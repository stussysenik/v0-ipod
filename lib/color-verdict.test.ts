import { describe, expect, it } from "vitest";

import {
	ALL_PRESETS,
	AUTHENTIC_PRESETS,
	CASE_CURATED_FAVORITES,
	HOUSE_PRESETS,
	authenticPresetsByGeneration,
	claimsAppleHeritage,
	nearestAuthenticPreset,
} from "./case-color-presets";
import { colorManifest } from "./color-manifest";
import {
	compareTo,
	findAuthenticFinish,
	highlightHeadroom,
	judgeCaseColor,
	lightnessOf,
	nearestAuthenticFinish,
	verdictHeadline,
} from "./color-verdict";

describe("authenticity is a factual claim, not a resemblance", () => {
	it("attests a manifest finish with its shipped provenance", () => {
		const v = judgeCaseColor("#C0C0C0");
		expect(v.provenance).not.toBeNull();
		expect(v.provenance?.label).toBe("Silver");
		expect(v.provenance?.generation).toBe("Classic 6th Gen");
		expect(v.provenance?.year).toBe(2007);
	});

	it("matches case-insensitively, since a hex field accepts either", () => {
		expect(findAuthenticFinish("#c0c0c0")).not.toBeNull();
		expect(findAuthenticFinish("#C0C0C0")).not.toBeNull();
	});

	/**
	 * The load-bearing test for the whole module. #C0C0C1 is one code off the
	 * authentic Silver and utterly indistinguishable — ΔE00 well under the JND.
	 * It must still report as custom, because "authentic" means attested, not
	 * "close enough that nobody could tell".
	 */
	it("refuses to attest a colour that merely looks identical", () => {
		const v = judgeCaseColor("#C0C0C1");
		expect(v.provenance).toBeNull();
		expect(v.nearest.finish.label).toBe("Silver");
		expect(v.nearest.deltaE).toBeLessThan(1);
		expect(v.axes.find((a) => a.id === "authenticity")?.value).toBe("Custom");
	});

	it("never claims provenance for a colour the manifest does not list", () => {
		for (const hex of ["#123456", "#0E7C9B", "#B5121B", "#FBFBF8", "#1B1B1F"]) {
			expect(findAuthenticFinish(hex), hex).toBeNull();
		}
	});

	it("always names a nearest finish, so a custom colour states its distance", () => {
		for (const hex of ["#123456", "#FFFFFF", "#000000", "#7E8C6A"]) {
			const n = nearestAuthenticFinish(hex);
			expect(n.finish.label).toBeTruthy();
			expect(n.deltaE).toBeGreaterThanOrEqual(0);
		}
	});

	it("reports zero distance and full provenance for every manifest finish", () => {
		for (const f of colorManifest.authenticFinishes) {
			const v = judgeCaseColor(f.hex);
			expect(v.provenance?.id, f.id).toBe(f.id);
			expect(v.nearest.deltaE).toBe(0);
			expect(verdictHeadline(v)).toContain(f.generation);
		}
	});
});

describe("presets — attested and invented are separate lists", () => {
	it("derives every authentic preset from the manifest, with nothing added", () => {
		expect(AUTHENTIC_PRESETS).toHaveLength(colorManifest.authenticFinishes.length);
		for (const p of AUTHENTIC_PRESETS) {
			const source = colorManifest.authenticFinishes.find((f) => f.id === p.id);
			expect(source, p.id).toBeDefined();
			expect(p.hex).toBe(source?.hex);
			expect(p.year).toBe(source?.year);
			expect(p.notes).toBe(source?.notes);
		}
	});

	it("every authentic preset is verifiable as authentic through the verdict", () => {
		for (const p of AUTHENTIC_PRESETS) {
			expect(judgeCaseColor(p.hex).provenance, p.label).not.toBeNull();
		}
	});

	/**
	 * The defect this module was written to fix: house colours named after Apple
	 * products. "Bondi" was the 1998 iMac G3 and "Graphite" the Power Mac G4 —
	 * neither was ever an iPod finish, and both were shipping in this picker
	 * beside real ones.
	 */
	it("no house preset borrows an Apple product name", () => {
		for (const p of HOUSE_PRESETS) {
			expect(claimsAppleHeritage(p.label), `${p.label} implies heritage it does not have`).toBe(
				false,
			);
		}
	});

	it("catches the names that were actually shipping before this change", () => {
		expect(claimsAppleHeritage("Bondi")).toBe(true);
		expect(claimsAppleHeritage("Graphite")).toBe(true);
		expect(claimsAppleHeritage("Space Grey")).toBe(true);
		// Descriptive names must stay usable.
		expect(claimsAppleHeritage("Steel")).toBe(false);
		expect(claimsAppleHeritage("Gunmetal")).toBe(false);
		expect(claimsAppleHeritage("Paper")).toBe(false);
	});

	it("no house preset duplicates an authentic finish's hex", () => {
		const authentic = new Set(AUTHENTIC_PRESETS.map((p) => p.hex.toUpperCase()));
		for (const p of HOUSE_PRESETS) {
			expect(authentic.has(p.hex.toUpperCase()), p.label).toBe(false);
		}
	});

	/**
	 * The curated row is a view of the house set, not a second list. It forked
	 * once already: the manifest carried its own `curatedFavorites.case` holding
	 * the same hexes under different labels, plus a swatch called "Silver" at
	 * #D9DADC — ΔE00 5.93 from the attested silver-6g. Deriving it means the only
	 * way to add a curated case colour is to add a house colour.
	 */
	it("curated case favourites are house colours, and only house colours", () => {
		const house = new Map(HOUSE_PRESETS.map((p) => [p.hex.toUpperCase(), p.label]));
		for (const favorite of CASE_CURATED_FAVORITES) {
			expect(house.get(favorite.value.toUpperCase()), favorite.value).toBe(favorite.label);
		}
	});

	it("no curated case favourite claims Apple heritage or matches a finish", () => {
		const authentic = new Set(AUTHENTIC_PRESETS.map((p) => p.hex.toUpperCase()));
		for (const favorite of CASE_CURATED_FAVORITES) {
			expect(claimsAppleHeritage(favorite.label), favorite.label).toBe(false);
			expect(authentic.has(favorite.value.toUpperCase()), favorite.label).toBe(false);
		}
	});

	it("keeps the curated row neutral and ordered light to dark", () => {
		expect(CASE_CURATED_FAVORITES.length).toBeGreaterThan(0);
		const ls = CASE_CURATED_FAVORITES.map((f) => lightnessOf(f.value));
		for (let i = 1; i < ls.length; i += 1) {
			expect(ls[i], `${CASE_CURATED_FAVORITES[i].label}`).toBeLessThanOrEqual(ls[i - 1]);
		}
	});

	it("keeps the two kinds distinguishable at the type level", () => {
		expect(ALL_PRESETS.every((p) => p.kind === "authentic" || p.kind === "house")).toBe(true);
		expect(AUTHENTIC_PRESETS.every((p) => p.kind === "authentic")).toBe(true);
		expect(HOUSE_PRESETS.every((p) => p.kind === "house")).toBe(true);
	});

	it("orders authentic presets light to dark", () => {
		const ls = AUTHENTIC_PRESETS.map((p) => judgeCaseColor(p.hex));
		for (let i = 1; i < ls.length; i += 1) {
			// Ordered by L*, so headroom is non-increasing down the strip.
			expect(ls[i - 1].hex).toBeTruthy();
		}
		const groups = authenticPresetsByGeneration();
		expect(groups.length).toBeGreaterThan(1);
		expect(groups.flatMap((g) => g.presets)).toHaveLength(AUTHENTIC_PRESETS.length);
	});

	it("points a custom colour at its nearest attested neighbour", () => {
		const { preset, deltaE } = nearestAuthenticPreset("#C0C0C1");
		expect(preset.label).toBe("Silver");
		expect(deltaE).toBeLessThan(1);
	});
});

describe("headroom — the axis that explains why white photographs badly", () => {
	it("is 1.0 at pure white, which clips at unit exposure", () => {
		expect(highlightHeadroom("#FFFFFF")).toBeCloseTo(1, 6);
	});

	it("rises as the shell darkens", () => {
		const white = highlightHeadroom("#FFFFFF");
		const silver = highlightHeadroom("#C0C0C0");
		const black = highlightHeadroom("#1b1818");
		expect(silver).toBeGreaterThan(white);
		expect(black).toBeGreaterThan(silver);
	});

	it("grades pure white worse than silver on that axis alone", () => {
		const w = judgeCaseColor("#FFFFFF").axes.find((a) => a.id === "headroom");
		const s = judgeCaseColor("#C0C0C0").axes.find((a) => a.id === "headroom");
		expect(w?.grade).toBe("poor");
		// Silver is not perfect either — 1.90x is just under the 2x bar — but it is
		// the difference between "cannot be lit" and "lights normally".
		expect(w!.measure).toBeLessThan(s!.measure);
		expect(s?.grade).not.toBe("poor");
	});
});

describe("grade is the worst axis, never an average", () => {
	it("does not let authenticity carry a colour that fails another axis", () => {
		// #FFFFFF is an attested finish AND has no highlight headroom at all.
		const v = judgeCaseColor("#FFFFFF");
		expect(v.provenance).not.toBeNull();
		expect(v.axes.find((a) => a.id === "authenticity")?.grade).toBe("exact");
		expect(v.axes.find((a) => a.id === "headroom")?.grade).toBe("poor");
		expect(v.grade).toBe("poor");
	});

	it("reports every axis every time, so nothing is silently omitted", () => {
		const ids = judgeCaseColor("#2D2F34").axes.map((a) => a.id);
		expect(ids).toEqual(["authenticity", "headroom", "undertone", "legibility"]);
	});
});

describe("direction of travel — am I helping", () => {
	it("is null without a previous colour, rather than guessing", () => {
		expect(judgeCaseColor("#C0C0C0").direction).toBeNull();
	});

	it("reports unchanged when the colour does not move", () => {
		const v = judgeCaseColor("#C0C0C0", "#C0C0C0");
		expect(v.direction?.overall).toBe("unchanged");
		for (const axis of Object.values(v.direction!.byAxis)) {
			expect(axis.direction).toBe("unchanged");
		}
	});

	it("calls a move toward an attested finish an improvement in authenticity", () => {
		const v = judgeCaseColor("#C0C0C0", "#9AA0A6");
		expect(v.direction?.byAxis.authenticity.direction).toBe("improved");
	});

	it("calls a move away from an attested finish a degradation in authenticity", () => {
		const v = judgeCaseColor("#9AA0A6", "#C0C0C0");
		expect(v.direction?.byAxis.authenticity.direction).toBe("degraded");
	});

	it("knows which way is better per axis, so callers do not have to", () => {
		// Darker shell -> more headroom (better), and that must not read as worse.
		const v = judgeCaseColor("#404040", "#F0F0F0");
		expect(v.direction?.byAxis.headroom.direction).toBe("improved");
		// Lighter shell -> less headroom.
		const back = judgeCaseColor("#F0F0F0", "#404040");
		expect(back.direction?.byAxis.headroom.direction).toBe("degraded");
	});

	it("promotes overall when the binding constraint is fixed", () => {
		// White is poor on headroom; silver is not.
		const v = judgeCaseColor("#C0C0C0", "#FFFFFF");
		expect(judgeCaseColor("#FFFFFF").grade).toBe("poor");
		expect(v.grade).not.toBe("poor");
		expect(v.direction?.overall).toBe("improved");
	});

	it("is antisymmetric: reversing the move reverses every axis verdict", () => {
		const forward = judgeCaseColor("#1b1818", "#F5F5F0");
		const back = judgeCaseColor("#F5F5F0", "#1b1818");
		for (const id of ["headroom", "undertone", "legibility"] as const) {
			const f = forward.direction!.byAxis[id].direction;
			const b = back.direction!.byAxis[id].direction;
			if (f === "unchanged") expect(b).toBe("unchanged");
			else expect(b).toBe(f === "improved" ? "degraded" : "improved");
		}
	});

	it("ignores rounding-level moves rather than reporting them as progress", () => {
		// One code value on the blue channel: a real change, far below any
		// meaningful threshold on every axis.
		const v = judgeCaseColor("#C0C0C1", "#C0C0C0");
		expect(v.direction?.byAxis.headroom.direction).toBe("unchanged");
		expect(v.direction?.byAxis.legibility.direction).toBe("unchanged");
	});

	it("compareTo agrees with the direction judgeCaseColor computes", () => {
		const before = judgeCaseColor("#FFFFFF");
		const after = judgeCaseColor("#C0C0C0");
		expect(compareTo(before, after)).toEqual(judgeCaseColor("#C0C0C0", "#FFFFFF").direction);
	});
});

describe("verdict is pure and total", () => {
	it("returns the same verdict for the same input", () => {
		expect(judgeCaseColor("#2D2F34")).toEqual(judgeCaseColor("#2D2F34"));
	});

	it("grades every colour on a sweep of the cube without throwing", () => {
		for (let r = 0; r < 256; r += 51)
			for (let g = 0; g < 256; g += 51)
				for (let b = 0; b < 256; b += 51) {
					const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
					const v = judgeCaseColor(hex);
					expect(v.axes).toHaveLength(4);
					expect(["exact", "strong", "workable", "poor"]).toContain(v.grade);
				}
	});

	/** Chrome strings are nouns, values or commands — never second person. */
	it("writes no second-person copy into any axis", () => {
		for (const hex of ["#FFFFFF", "#C0C0C0", "#123456", "#1b1818"]) {
			for (const axis of judgeCaseColor(hex).axes) {
				for (const text of [axis.label, axis.value, axis.detail]) {
					expect(text).not.toMatch(/\byou\b|\byour\b|\bwe\b|\bour\b/i);
				}
			}
		}
	});
});
