import { describe, expect, it } from "vitest";

import { NAMED_POSES } from "./studio-camera-poses";
import {
	APPLE_PRODUCT_RIG,
	cloneLightingConfig,
	composeRigForPose,
	MAX_AMBIENT_INTENSITY,
	MAX_ENV_INTENSITY,
	MAX_SOFTBOX_INTENSITY,
	MAX_SPOT_INTENSITY,
	NATURAL_LIGHT_RIG,
	POSE_LIGHT_COMPOSITIONS,
	RIG_PRESETS,
	sanitizeLightingConfig,
	selectPoseComposition,
	applyOverrides,
	DESIGNER_DARK_RIG,
	diffFromPreset,
	ENVIRONMENT_PRESETS,
	type StudioLightingConfig,
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

describe("per-pose light compositions (§4.1 — spec: 3d-shaped-light-compositions)", () => {
	it("every named camera pose has exactly one composition, keyed by pose id", () => {
		for (const pose of NAMED_POSES) {
			const matches = POSE_LIGHT_COMPOSITIONS.filter((c) => c.poseId === pose.id);
			expect(matches, `pose "${pose.id}" needs one composition`).toHaveLength(1);
		}
		// No composition points at a pose that does not exist.
		const poseIds = new Set(NAMED_POSES.map((p) => p.id));
		for (const c of POSE_LIGHT_COMPOSITIONS) expect(poseIds.has(c.poseId)).toBe(true);
	});

	it("compositions are sane, named panels within the softbox ceiling", () => {
		for (const c of POSE_LIGHT_COMPOSITIONS) {
			expect(c.name.length).toBeGreaterThan(0);
			expect(c.softboxes.length).toBeGreaterThan(0);
			for (const s of c.softboxes) {
				expect(Number.isFinite(s.intensity)).toBe(true);
				expect(s.intensity).toBeGreaterThanOrEqual(0);
				expect(s.intensity).toBeLessThanOrEqual(MAX_SOFTBOX_INTENSITY);
			}
		}
	});

	it("selection is a pure function of the pose id — known resolves, unknown/free-orbit → null", () => {
		expect(selectPoseComposition("hero")?.name).toBe("Chamfer Rake");
		expect(selectPoseComposition("back")?.name).toBe("Horizon Card");
		// Unknown pose and free orbit both fall back to the default rig (null composition).
		expect(selectPoseComposition("does-not-exist")).toBeNull();
		expect(selectPoseComposition(null)).toBeNull();
		expect(selectPoseComposition(undefined)).toBeNull();
	});

	it("composeRigForPose swaps only the softboxes; spots, env preset and ambient pass through", () => {
		const posed = composeRigForPose(APPLE_PRODUCT_RIG, "back");
		const back = selectPoseComposition("back")!;
		expect(posed.env.softboxes).toEqual(back.softboxes);
		// Everything else is the base rig, unchanged — dials remain the override layer.
		expect(posed.key).toEqual(APPLE_PRODUCT_RIG.key);
		expect(posed.fill).toEqual(APPLE_PRODUCT_RIG.fill);
		expect(posed.rim).toEqual(APPLE_PRODUCT_RIG.rim);
		expect(posed.ambient).toEqual(APPLE_PRODUCT_RIG.ambient);
		expect(posed.env.preset).toBe(APPLE_PRODUCT_RIG.env.preset);
		expect(posed.env.intensity).toBe(APPLE_PRODUCT_RIG.env.intensity);
	});

	it("an unknown pose yields the base rig cloned — softboxes unchanged", () => {
		const posed = composeRigForPose(APPLE_PRODUCT_RIG, "free-orbit");
		expect(posed.env.softboxes).toEqual(APPLE_PRODUCT_RIG.env.softboxes);
	});

	it("is immutable and deterministic — never mutates the base, no hidden coupling", () => {
		const before = cloneLightingConfig(APPLE_PRODUCT_RIG);
		const a = composeRigForPose(APPLE_PRODUCT_RIG, "hero");
		const b = composeRigForPose(APPLE_PRODUCT_RIG, "hero");
		// Base rig is untouched by composition (no shared references leak through).
		expect(APPLE_PRODUCT_RIG).toEqual(before);
		// Pure function of (rig, pose): same inputs → deep-equal output, no colour term.
		expect(a).toEqual(b);
		a.env.softboxes[0].intensity = 999;
		expect(b.env.softboxes[0].intensity).not.toBe(999);
	});
});

/*
 * ── Rig deviation (spec: 3d-studio-presentation — "Savable Studio Themes") ────
 *
 * A saved theme records a preset NAME plus the fields that deviate from it,
 * never a copy of the rig. Two properties carry that design, and every other
 * guarantee in the change rests on them:
 *
 *  1. Round trip: `applyOverrides(name, diffFromPreset(c, name))` reconstructs
 *     `c`. If this leaks, a saved look silently changes on reload.
 *  2. Empty case: a config equal to its preset diffs to `{}`, so an untouched
 *     theme still reaches a later revision of the preset it names.
 */

/** Deterministic LCG — a property test that only fails on some seeds is not a gate. */
function makeRandom(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 0x100000000;
	};
}

/**
 * A randomised config that stays inside the sanitizer's clamps. Values above a
 * ceiling are supposed to be pulled down on the way through storage, so feeding
 * them here would test the clamp, not the round trip.
 */
function randomConfig(rand: () => number): StudioLightingConfig {
	const spot = () => ({
		color: `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`,
		intensity: rand() * MAX_SPOT_INTENSITY,
		position: [rand() * 20 - 10, rand() * 20 - 10, rand() * 20 - 10] as [number, number, number],
		angle: rand() * (Math.PI / 2),
		penumbra: rand(),
		castShadow: rand() > 0.5,
	});
	return {
		name: `Rig ${Math.floor(rand() * 1000)}`,
		ambient: {
			color: `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`,
			intensity: rand() * MAX_AMBIENT_INTENSITY,
		},
		key: spot(),
		fill: spot(),
		rim: spot(),
		env: {
			preset: ENVIRONMENT_PRESETS[Math.floor(rand() * ENVIRONMENT_PRESETS.length)],
			intensity: rand() * MAX_ENV_INTENSITY,
			blur: rand(),
			softboxes: Array.from({ length: 1 + Math.floor(rand() * 6) }, () => ({
				color: `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0")}`,
				intensity: rand() * MAX_SOFTBOX_INTENSITY,
				position: [rand() * 20 - 10, rand() * 20 - 10, rand() * 20 - 10] as [number, number, number],
				scale: [rand() * 30, rand() * 30, 1] as [number, number, number],
			})),
		},
	};
}

describe("diffFromPreset / applyOverrides", () => {
	it("round-trips any config through its deviation record", () => {
		const rand = makeRandom(20260729);
		for (let i = 0; i < 200; i++) {
			const config = randomConfig(rand);
			const presetName = RIG_PRESETS[i % RIG_PRESETS.length].config.name;
			const rebuilt = applyOverrides(presetName, diffFromPreset(config, presetName));
			expect(rebuilt, `round trip lost data against ${presetName} on iteration ${i}`).toEqual(
				config,
			);
		}
	});

	it("records no deviation for a config equal to its preset", () => {
		for (const preset of RIG_PRESETS) {
			expect(
				diffFromPreset(cloneLightingConfig(preset.config), preset.config.name),
				`${preset.config.name} diffed against itself`,
			).toEqual({});
		}
	});

	it("still records nothing after the config has been through storage", () => {
		// `sanitizeSpot` writes `castShadow: undefined` where a preset literal has
		// no such key. If that counted as a deviation, every reloaded theme would
		// pin its rig and stop tracking the preset — the empty case would hold
		// only until the first reload.
		for (const preset of RIG_PRESETS) {
			const round = sanitizeLightingConfig(JSON.parse(JSON.stringify(preset.config)));
			expect(diffFromPreset(round, preset.config.name)).toEqual({});
		}
	});

	it("records only the field that moved", () => {
		const tuned = cloneLightingConfig(DESIGNER_DARK_RIG);
		tuned.key.intensity = 999;
		const overrides = diffFromPreset(tuned, DESIGNER_DARK_RIG.name);
		expect(Object.keys(overrides)).toEqual(["key"]);
		expect(applyOverrides(DESIGNER_DARK_RIG.name, overrides).key.intensity).toBe(999);
		// The untouched fields are the preset's, not the theme's own copies.
		expect(applyOverrides(DESIGNER_DARK_RIG.name, overrides).env).toEqual(DESIGNER_DARK_RIG.env);
	});

	it("falls back to Designer Dark for an unknown preset, matching rigForTheme", () => {
		expect(applyOverrides("Rig That Was Deleted", {}).name).toBe(DESIGNER_DARK_RIG.name);
		expect(diffFromPreset(cloneLightingConfig(DESIGNER_DARK_RIG), "Rig That Was Deleted")).toEqual(
			{},
		);
	});

	it("degrades a malformed deviation record to no deviation instead of throwing", () => {
		for (const junk of [null, undefined, "overrides", 42, [1, 2, 3]]) {
			expect(
				applyOverrides(DESIGNER_DARK_RIG.name, junk as never).name,
				`applyOverrides threw or drifted on ${JSON.stringify(junk)}`,
			).toBe(DESIGNER_DARK_RIG.name);
		}
		// A structurally wrong field heals to the default rather than propagating.
		expect(applyOverrides(DESIGNER_DARK_RIG.name, { env: "bright" } as never).env.preset).toBe(
			DESIGNER_DARK_RIG.env.preset,
		);
	});

	it("hands back a detached config — editing the result cannot reach the preset", () => {
		const rig = applyOverrides(DESIGNER_DARK_RIG.name, {});
		rig.key.intensity = 1;
		rig.env.softboxes[0].color = "#ff00ff";
		expect(DESIGNER_DARK_RIG.key.intensity).not.toBe(1);
		expect(DESIGNER_DARK_RIG.env.softboxes[0].color).not.toBe("#ff00ff");
	});
});
