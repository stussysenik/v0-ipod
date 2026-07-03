import { describe, expect, it } from "vitest";

import {
	cloneLightingConfig,
	MAX_AMBIENT_INTENSITY,
	MAX_ENV_INTENSITY,
	MAX_SOFTBOX_INTENSITY,
	MAX_SPOT_INTENSITY,
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

describe("intensity ceilings (spec: interaction-robustness)", () => {
	// NoToneMapping means no highlight rolloff — an unbounded intensity clips the
	// render to white. The sanitizer is the only safety net, so it must cap every
	// dial from a corrupt or hand-edited blob at the documented ceilings.
	it("clamps oversized spot / softbox / env / ambient intensities", () => {
		const corrupt = cloneLightingConfig(NATURAL_LIGHT_RIG);
		corrupt.ambient.intensity = 1e6;
		corrupt.key.intensity = 1e6;
		corrupt.env.intensity = 1e6;
		corrupt.env.softboxes[0].intensity = 1e6;

		const healed = sanitizeLightingConfig(corrupt);
		expect(healed.ambient.intensity).toBe(MAX_AMBIENT_INTENSITY);
		expect(healed.key.intensity).toBe(MAX_SPOT_INTENSITY);
		expect(healed.env.intensity).toBe(MAX_ENV_INTENSITY);
		expect(healed.env.softboxes[0].intensity).toBe(MAX_SOFTBOX_INTENSITY);
	});

	it("ceilings clear every shipped rig — hand-tuned looks pass untouched", () => {
		for (const { config } of RIG_PRESETS) {
			expect(config.ambient.intensity).toBeLessThanOrEqual(MAX_AMBIENT_INTENSITY);
			expect(config.env.intensity).toBeLessThanOrEqual(MAX_ENV_INTENSITY);
			for (const spot of [config.key, config.fill, config.rim]) {
				expect(spot.intensity).toBeLessThanOrEqual(MAX_SPOT_INTENSITY);
			}
			for (const s of config.env.softboxes) {
				expect(s.intensity).toBeLessThanOrEqual(MAX_SOFTBOX_INTENSITY);
			}
		}
	});
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
