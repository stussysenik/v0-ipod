import { describe, expect, it } from "vitest";

import {
	cloneLightingConfig,
	NATURAL_LIGHT_RIG,
	RIG_PRESETS,
	sanitizeLightingConfig,
} from "./studio-lighting-config";

/*
 * ── Rig QC — "light evidence" ────────────────────────────────────────────────
 *
 * The studio's rigs are pure data, so the photographic invariants they promise
 * are testable headlessly. Two kinds of guarantees:
 *
 *  1. Plumbing: every preset survives the persistence round-trip (localStorage →
 *     sanitize → identical rig), so a saved look can never silently mutate.
 *  2. Physics: the device's metal face renders `albedo × environment` — its
 *     brightness comes from the panels it mirrors. For rigs that promise
 *     legibility (Natural Light), the front-hemisphere energy must actually be
 *     there; that is what keeps dark-wheel print readable in the final output.
 */

const srgbToLinear = (c: number) => {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = (hex: string) => {
	const h = hex.replace("#", "");
	const [r, g, b] = [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((c) =>
		srgbToLinear(parseInt(c, 16)),
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe("rig preset registry", () => {
	it("preset ids and rig names are unique (themes resolve rigs by name)", () => {
		const ids = RIG_PRESETS.map((p) => p.id);
		const names = RIG_PRESETS.map((p) => p.config.name);
		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(names).size).toBe(names.length);
	});

	it.each(RIG_PRESETS.map((p) => [p.id, p.config] as const))(
		"%s — survives the persistence round-trip unchanged",
		(_id, config) => {
			expect(sanitizeLightingConfig(cloneLightingConfig(config))).toEqual(
				cloneLightingConfig(config),
			);
		},
	);
});

describe("Natural Light — the legibility template", () => {
	it("carries real front-hemisphere energy (the wall a metal face mirrors)", () => {
		const frontPanels = NATURAL_LIGHT_RIG.env.softboxes.filter((s) => s.position[2] > 5);
		expect(frontPanels.length).toBeGreaterThan(0);
		const main = frontPanels.reduce((a, b) => (a.intensity >= b.intensity ? a : b));
		// Bright (near-white) and strong — this is what lifts a black wheel's
		// reflected tone so the printed labels separate from the ring.
		expect(main.intensity).toBeGreaterThanOrEqual(0.9);
		expect(luminance(main.color)).toBeGreaterThanOrEqual(0.8);
		// And big: a panel must fill the reflection hemisphere, not glint in it.
		expect(main.scale[0] * main.scale[1]).toBeGreaterThanOrEqual(400);
	});

	it("keeps an open-room ambient floor — no studio-void crush", () => {
		expect(NATURAL_LIGHT_RIG.ambient.intensity).toBeGreaterThanOrEqual(0.4);
		expect(NATURAL_LIGHT_RIG.env.intensity).toBeGreaterThanOrEqual(1.0);
	});

	it("mixes warm key with cool fill — daylight, not a tinted rig", () => {
		// Warm sun side: red channel leads; cool sky side: blue channel leads.
		const key = NATURAL_LIGHT_RIG.key.color.toLowerCase();
		const fill = NATURAL_LIGHT_RIG.fill.color.toLowerCase();
		const channel = (hex: string, i: number) =>
			parseInt(hex.replace("#", "").slice(i * 2, i * 2 + 2), 16);
		expect(channel(key, 0)).toBeGreaterThan(channel(key, 2)); // key: R > B
		expect(channel(fill, 2)).toBeGreaterThan(channel(fill, 0)); // fill: B > R
	});

	it("ships with a light stage — the backdrop stays a backdrop", () => {
		const preset = RIG_PRESETS.find((p) => p.config.name === "Natural Light");
		expect(preset).toBeDefined();
		expect(luminance(preset!.stage!)).toBeGreaterThanOrEqual(0.7);
	});
});
