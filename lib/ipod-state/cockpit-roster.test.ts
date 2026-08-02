import { describe, expect, it } from "vitest";

import {
	ALL_COCKPITS_VISIBLE,
	COCKPIT_ROSTER,
	type CockpitId,
	PRODUCT_VIEW,
	cockpitEntry,
	isProductView,
	sanitizeCockpitVisibility,
	toggleCockpit,
	visibleCockpitCount,
} from "./cockpit-roster";

/**
 * THE ROSTER — the invariants that let the stage stop restating panel order and let a
 * stored visibility map be trusted as total.
 */

describe("the cockpit roster", () => {
	it("numbers 01→09 once each, with no repeated id or label", () => {
		expect(COCKPIT_ROSTER.map((e) => e.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(new Set(COCKPIT_ROSTER.map((e) => e.id)).size).toBe(COCKPIT_ROSTER.length);
		expect(new Set(COCKPIT_ROSTER.map((e) => e.label)).size).toBe(COCKPIT_ROSTER.length);
	});

	it("splits into the shoot columns the stage lays out: 01–05 left, 06–09 right", () => {
		for (const entry of COCKPIT_ROSTER) {
			expect(entry.side).toBe(entry.index <= 5 ? "left" : "right");
		}
	});

	it("resolves every id, so the header can read its own number and name", () => {
		for (const entry of COCKPIT_ROSTER) {
			expect(cockpitEntry(entry.id)).toBe(entry);
		}
	});
});

describe("cockpit visibility", () => {
	it("ships every panel visible, and the product view hides every one of them", () => {
		expect(visibleCockpitCount(ALL_COCKPITS_VISIBLE)).toBe(COCKPIT_ROSTER.length);
		expect(visibleCockpitCount(PRODUCT_VIEW)).toBe(0);
		expect(isProductView(PRODUCT_VIEW)).toBe(true);
		expect(isProductView(ALL_COCKPITS_VISIBLE)).toBe(false);
	});

	it("toggles one panel and leaves the other eight where they were", () => {
		const once = toggleCockpit(ALL_COCKPITS_VISIBLE, "light");
		expect(once.light).toBe(false);
		expect(visibleCockpitCount(once)).toBe(COCKPIT_ROSTER.length - 1);
		expect(toggleCockpit(once, "light")).toEqual(ALL_COCKPITS_VISIBLE);
	});

	it("hiding every panel one at a time reaches exactly the product view", () => {
		const hidden = COCKPIT_ROSTER.reduce(
			(acc, entry) => toggleCockpit(acc, entry.id),
			ALL_COCKPITS_VISIBLE,
		);
		expect(hidden).toEqual(PRODUCT_VIEW);
	});

	it("is reversible: the product view returns to the factory value in one write", () => {
		expect(isProductView(PRODUCT_VIEW)).toBe(true);
		expect(sanitizeCockpitVisibility(ALL_COCKPITS_VISIBLE)).toEqual(ALL_COCKPITS_VISIBLE);
	});
});

describe("healing a stored visibility map", () => {
	it("fills a missing id with visible rather than leaving it undefined", () => {
		// The defect this exists to prevent: a legacy record has no `workspace` key, the
		// stage reads `undefined`, the panel is hidden, and no gesture explains why.
		const healed = sanitizeCockpitVisibility({ studio: false });
		expect(healed.studio).toBe(false);
		expect(healed.workspace).toBe(true);
		expect(Object.keys(healed).sort()).toEqual(COCKPIT_ROSTER.map((e) => e.id).sort());
	});

	it("drops keys the roster does not declare", () => {
		const healed = sanitizeCockpitVisibility({ studio: true, ghost: false });
		expect("ghost" in healed).toBe(false);
	});

	it("falls back to visible for a non-boolean, and for a non-object payload", () => {
		const coerced = sanitizeCockpitVisibility({ color: "no" as unknown as boolean });
		expect(coerced.color).toBe(true);
		for (const candidate of [null, undefined, 7, "all", [] as unknown]) {
			expect(sanitizeCockpitVisibility(candidate)).toEqual(ALL_COCKPITS_VISIBLE);
		}
	});

	it("round-trips a hand-authored view through JSON, which is how it is stored", () => {
		const authored = toggleCockpit(toggleCockpit(ALL_COCKPITS_VISIBLE, "proof"), "export");
		const stored = JSON.parse(JSON.stringify(authored)) as unknown;
		expect(sanitizeCockpitVisibility(stored)).toEqual(authored);
	});

	it("covers the whole id union — a new cockpit that skips the roster fails here", () => {
		const ids: CockpitId[] = [
			"studio",
			"color",
			"nowplaying",
			"battery",
			"camera",
			"light",
			"proof",
			"export",
			"workspace",
		];
		expect(COCKPIT_ROSTER.map((e) => e.id).sort()).toEqual([...ids].sort());
	});
});
