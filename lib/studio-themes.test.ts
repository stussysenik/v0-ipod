/**
 * The Noir theme is the app's "return to factory in one tap" promise, so these
 * tests pin the two ways that promise can quietly break.
 *
 * 1. PARTIAL APPLY. A theme that overwrites six of the seven surfaces still looks
 *    applied — the seventh just keeps whatever the last experiment left on it. So
 *    the assertion is not "it dispatched" but "from an arbitrarily dirtied model,
 *    every field the theme owns lands on the theme's value".
 * 2. DRIFT. `NOIR_THEME` claims to be exactly what `createInitialIpodWorkbenchModel`
 *    boots. Nothing enforces that — they are two hand-written literals in two files.
 *    If the factory model is retuned and the theme is not, "Noir" silently becomes a
 *    look you can never get back to. The drift test makes that a failing test rather
 *    than a bug someone notices in a screenshot months later.
 */

import { describe, expect, it } from "vitest";

import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { DESIGNER_DARK_RIG } from "@/lib/studio-lighting-config";
import {
	BUILT_IN_THEMES,
	NOIR_THEME,
	rigForTheme,
	themeActions,
	type StudioThemeColors,
} from "@/lib/studio-themes";

const COLOR_KEYS: (keyof StudioThemeColors)[] = [
	"skinColor",
	"ringColor",
	"centerColor",
	"backColor",
	"edgeColor",
	"bezelColor",
	"bgColor",
];

/** Every surface dialed to a value no theme would ever choose. */
const DIRT = "#ff00ff";

function dirtiedModel() {
	let model = createInitialIpodWorkbenchModel();
	for (const action of [
		{ type: "SET_SKIN_COLOR", payload: DIRT },
		{ type: "SET_RING_COLOR", payload: DIRT },
		{ type: "SET_CENTER_COLOR", payload: DIRT },
		{ type: "SET_BACK_COLOR", payload: DIRT },
		{ type: "SET_EDGE_COLOR", payload: DIRT },
		{ type: "SET_BEZEL_COLOR", payload: DIRT },
		{ type: "SET_BG_COLOR", payload: DIRT },
	] as const) {
		model = ipodWorkbenchReducer(model, action);
	}
	return model;
}

function applyTheme(model: ReturnType<typeof createInitialIpodWorkbenchModel>, theme = NOIR_THEME) {
	return themeActions(theme).reduce(
		(next, action) => ipodWorkbenchReducer(next, action),
		model,
	);
}

describe("themeActions", () => {
	it("writes all seven surfaces — none is left to the previous look", () => {
		const applied = applyTheme(dirtiedModel());
		for (const key of COLOR_KEYS) {
			expect(applied.presentation[key], `${key} was not overwritten by the theme`).toBe(
				NOIR_THEME.colors[key],
			);
		}
		// The negative half of the same claim: no dirt survives anywhere.
		expect(Object.values(applied.presentation)).not.toContain(DIRT);
	});

	it("carries the rig, so colours and light land as one look", () => {
		const applied = applyTheme(dirtiedModel());
		expect(applied.studio.lighting.name).toBe(DESIGNER_DARK_RIG.name);
	});

	it("is deterministic — the same theme from any state lands on the same device", () => {
		const fromDirty = applyTheme(dirtiedModel());
		const fromFactory = applyTheme(createInitialIpodWorkbenchModel());
		expect(fromDirty.presentation).toEqual(fromFactory.presentation);
		expect(fromDirty.studio.lighting).toEqual(fromFactory.studio.lighting);
	});

	it("is idempotent — applying twice is applying once", () => {
		const once = applyTheme(dirtiedModel());
		const twice = applyTheme(once);
		expect(twice.presentation).toEqual(once.presentation);
	});
});

describe("NOIR_THEME", () => {
	it("IS the factory look — the theme and the boot model cannot drift apart", () => {
		// The promise the Noir chip makes: one tap returns the device to what a cold
		// load boots. If this fails, either retune the theme to match the model or
		// admit Noir is no longer factory — do not delete the test.
		const factory = createInitialIpodWorkbenchModel().presentation;
		for (const key of COLOR_KEYS) {
			expect(NOIR_THEME.colors[key], `Noir's ${key} drifted from the factory model`).toBe(
				factory[key],
			);
		}
	});

	it("ships as a built-in the user cannot delete", () => {
		expect(BUILT_IN_THEMES).toContain(NOIR_THEME);
		expect(NOIR_THEME.builtIn).toBe(true);
	});
});

describe("rigForTheme", () => {
	it("degrades to Designer Dark when a theme names a rig that no longer exists", () => {
		const orphan = { ...NOIR_THEME, rigName: "Rig That Was Deleted In A Later Revision" };
		expect(rigForTheme(orphan).name).toBe(DESIGNER_DARK_RIG.name);
	});

	it("hands back a private clone — editing the applied rig cannot mutate the preset", () => {
		const rig = rigForTheme(NOIR_THEME);
		rig.name = "mutated";
		expect(DESIGNER_DARK_RIG.name).not.toBe("mutated");
		expect(rigForTheme(NOIR_THEME).name).toBe(DESIGNER_DARK_RIG.name);
	});
});
