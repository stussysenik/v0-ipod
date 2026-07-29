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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { DESIGNER_DARK_RIG, cloneLightingConfig } from "@/lib/studio-lighting-config";
import {
	BUILT_IN_THEMES,
	NOIR_THEME,
	STUDIO_THEMES_STORAGE_KEY,
	createBootedWorkbenchModel,
	loadDefaultThemeId,
	loadSavedThemes,
	overwriteTheme,
	persistDefaultThemeId,
	persistSavedThemes,
	renameTheme,
	resolveDefaultTheme,
	rigForTheme,
	themeActions,
	themeRigFromConfig,
	type StudioTheme,
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

describe("a hand-tuned rig survives the round trip", () => {
	/**
	 * Violated clause — `3d-studio-presentation` → "Savable Studio Themes":
	 * "Applying a theme SHALL restore the rig the user saved, including any
	 * hand-tuned values, and SHALL NOT substitute the pristine preset for a
	 * tuned rig."
	 *
	 * The accepted scenario next to it reads "saves, changes COLORS, then
	 * applies" — it exercises the colour path and never the rig path, so the
	 * gate passed on the case that works while the rig case shipped broken.
	 * Storing the rig by name alone throws the tuning away with no notice.
	 */
	it("restores the tuned value, not the pristine preset", () => {
		const tuned = cloneLightingConfig(DESIGNER_DARK_RIG);
		tuned.key.intensity = DESIGNER_DARK_RIG.key.intensity + 111;

		const theme: StudioTheme = {
			...NOIR_THEME,
			id: "tuned",
			label: "Tuned",
			builtIn: false,
			rig: { name: tuned.name, overrides: { key: { ...tuned.key } } },
		};

		expect(rigForTheme(theme).key.intensity).toBe(tuned.key.intensity);
	});
});

describe("rigForTheme", () => {
	it("degrades to Designer Dark when a theme names a rig that no longer exists", () => {
		const orphan: StudioTheme = {
			...NOIR_THEME,
			rig: { name: "Rig That Was Deleted In A Later Revision", overrides: {} },
		};
		expect(rigForTheme(orphan).name).toBe(DESIGNER_DARK_RIG.name);
	});

	it("an untouched theme tracks its preset rather than pinning a copy", () => {
		// The reason a theme stores deviations and not a rig: a theme saved on an
		// untouched preset holds `{}`, so a later revision of that preset reaches it.
		expect(NOIR_THEME.rig.overrides).toEqual({});
		expect(rigForTheme(NOIR_THEME)).toEqual(DESIGNER_DARK_RIG);
	});

	it("hands back a private clone — editing the applied rig cannot mutate the preset", () => {
		const rig = rigForTheme(NOIR_THEME);
		rig.name = "mutated";
		expect(DESIGNER_DARK_RIG.name).not.toBe("mutated");
		expect(rigForTheme(NOIR_THEME).name).toBe(DESIGNER_DARK_RIG.name);
	});
});

/*
 * ── The stored record: migration, the default pointer, and editing ───────────
 *
 * Everything below is the persistence contract. A theme is a document the user
 * keeps across reloads and across app revisions, so the tests that matter are
 * the ones about what happens to a record written by an OLDER build.
 */

function fakeStorage() {
	const map = new Map<string, string>();
	return {
		getItem: (k: string) => map.get(k) ?? null,
		setItem: (k: string, v: string) => void map.set(k, v),
		removeItem: (k: string) => void map.delete(k),
		clear: () => map.clear(),
	};
}

describe("stored themes", () => {
	let storage: ReturnType<typeof fakeStorage>;

	beforeEach(() => {
		storage = fakeStorage();
		vi.stubGlobal("window", { localStorage: storage });
	});
	afterEach(() => vi.unstubAllGlobals());

	const write = (value: unknown) =>
		storage.setItem(STUDIO_THEMES_STORAGE_KEY, JSON.stringify(value));

	const v1Theme = (rigName: string) => ({
		id: "old",
		label: "Saved Under v1",
		colors: { ...NOIR_THEME.colors },
		rigName,
	});

	it("reads a v1 record — a bare rig name becomes that preset with no deviations", () => {
		write([v1Theme("Apple Product")]);
		const [loaded] = loadSavedThemes();
		expect(loaded.rig).toEqual({ name: "Apple Product", overrides: {} });
		// Neither the theme nor its colours are discarded (spec scenario).
		expect(loaded.colors).toEqual(NOIR_THEME.colors);
	});

	it("keeps a v1 record's rig name even when the preset is gone", () => {
		write([v1Theme("Rig Deleted In A Later Revision")]);
		const [loaded] = loadSavedThemes();
		expect(loaded.rig.name).toBe("Rig Deleted In A Later Revision");
		// Resolution — not storage — is where an orphan name heals.
		expect(rigForTheme(loaded).name).toBe(DESIGNER_DARK_RIG.name);
	});

	it("reads a record carrying neither rig nor rigName as Designer Dark", () => {
		write([{ id: "bare", label: "Bare", colors: { ...NOIR_THEME.colors } }]);
		expect(loadSavedThemes()[0].rig).toEqual({ name: DESIGNER_DARK_RIG.name, overrides: {} });
	});

	it("degrades a malformed overrides blob to no deviation instead of throwing", () => {
		for (const junk of ["overrides", 42, null, [1, 2], { env: "bright" }]) {
			write([{ ...v1Theme("x"), rig: { name: "Designer Dark", overrides: junk } }]);
			const loaded = loadSavedThemes();
			expect(loaded, `overrides ${JSON.stringify(junk)} dropped the whole theme`).toHaveLength(1);
			expect(loaded[0].rig.overrides).toEqual({});
		}
	});

	it("round-trips a tuned rig through storage — the defect this change closes", () => {
		const tuned = cloneLightingConfig(DESIGNER_DARK_RIG);
		tuned.key.intensity = 377;
		const theme: StudioTheme = {
			id: "tuned",
			label: "Tuned",
			colors: { ...NOIR_THEME.colors },
			rig: themeRigFromConfig(tuned, DESIGNER_DARK_RIG.name),
		};
		persistSavedThemes([theme]);
		expect(rigForTheme(loadSavedThemes()[0]).key.intensity).toBe(377);
	});

	it("persists the default pointer", () => {
		persistDefaultThemeId("theme-x");
		expect(loadDefaultThemeId()).toBe("theme-x");
	});
});

describe("resolveDefaultTheme", () => {
	const mine: StudioTheme = {
		id: "mine",
		label: "Mine",
		colors: { ...NOIR_THEME.colors, skinColor: "#123456" },
		rig: { name: "Apple Product", overrides: {} },
	};
	const all = [NOIR_THEME, mine];

	it("returns the theme the pointer names", () => {
		expect(resolveDefaultTheme(all, "mine")).toBe(mine);
	});

	it("falls back to Noir when the pointer is absent or empty", () => {
		expect(resolveDefaultTheme(all, null)).toBe(NOIR_THEME);
		expect(resolveDefaultTheme(all, undefined)).toBe(NOIR_THEME);
		expect(resolveDefaultTheme(all, "")).toBe(NOIR_THEME);
	});

	it("heals a dangling pointer to Noir — deleting the default is not a broken boot", () => {
		// Delete leaves the pointer alone on purpose, so exactly one place heals.
		const afterDelete = all.filter((t) => t.id !== "mine");
		expect(resolveDefaultTheme(afterDelete, "mine")).toBe(NOIR_THEME);
	});

	it("exactly one theme is the default — a pointer cannot name two", () => {
		const matches = all.filter((t) => t.id === resolveDefaultTheme(all, "mine").id);
		expect(matches).toHaveLength(1);
	});
});

describe("createBootedWorkbenchModel", () => {
	it("boots the Noir look when nothing is stored", () => {
		const booted = createBootedWorkbenchModel([], null);
		for (const key of COLOR_KEYS) expect(booted.presentation[key]).toBe(NOIR_THEME.colors[key]);
		expect(booted.studio.lighting.name).toBe(DESIGNER_DARK_RIG.name);
	});

	it("follows the default theme rather than the factory model's own literals", () => {
		// The coincidence this closes: `createInitialIpodWorkbenchModel` used to
		// hold the seven values independently, and matched Noir by nothing but
		// hand-copying. Point the default at a theme that differs and the boot has
		// to follow it — if it does not, the two sources have drifted.
		const fixture: StudioTheme = {
			...NOIR_THEME,
			id: "fixture",
			builtIn: false,
			colors: { ...NOIR_THEME.colors, skinColor: "#3d5a80" },
		};
		const booted = createBootedWorkbenchModel([NOIR_THEME, fixture], "fixture");
		expect(booted.presentation.skinColor).toBe("#3d5a80");
	});

	it("carries the default theme's tuned rig into the booted model", () => {
		const tuned = cloneLightingConfig(DESIGNER_DARK_RIG);
		tuned.rim.intensity = 411;
		const fixture: StudioTheme = {
			...NOIR_THEME,
			id: "fixture",
			builtIn: false,
			rig: themeRigFromConfig(tuned, DESIGNER_DARK_RIG.name),
		};
		expect(
			createBootedWorkbenchModel([fixture], "fixture").studio.lighting.rim.intensity,
		).toBe(411);
	});

	it("boots Noir when the pointer dangles", () => {
		const booted = createBootedWorkbenchModel([], "deleted-theme");
		expect(booted.presentation.skinColor).toBe(NOIR_THEME.colors.skinColor);
	});
});

describe("renameTheme / overwriteTheme", () => {
	const mine: StudioTheme = {
		id: "mine",
		label: "Mine",
		colors: { ...NOIR_THEME.colors },
		rig: { name: "Designer Dark", overrides: {} },
	};
	const other: StudioTheme = { ...mine, id: "other", label: "Other" };

	it("rename preserves identity and position", () => {
		const next = renameTheme([mine, other], "mine", "Studio Blue");
		expect(next.map((t) => t.id)).toEqual(["mine", "other"]);
		expect(next[0].label).toBe("Studio Blue");
	});

	it("rename rejects an empty label", () => {
		expect(renameTheme([mine], "mine", "   ")[0].label).toBe("Mine");
		expect(renameTheme([mine], "mine", "")[0].label).toBe("Mine");
	});

	it("rename and overwrite reject built-ins", () => {
		expect(renameTheme([NOIR_THEME], "noir", "Not Noir")[0].label).toBe("Noir");
		const dirty = { ...NOIR_THEME.colors, skinColor: "#ff00ff" };
		expect(
			overwriteTheme([NOIR_THEME], "noir", dirty, mine.rig)[0].colors.skinColor,
		).toBe(NOIR_THEME.colors.skinColor);
	});

	it("overwrite replaces the look but keeps id, label and position", () => {
		const tuned = cloneLightingConfig(DESIGNER_DARK_RIG);
		tuned.key.intensity = 512;
		const colors = { ...NOIR_THEME.colors, skinColor: "#0f4c5c" };
		const next = overwriteTheme(
			[mine, other],
			"mine",
			colors,
			themeRigFromConfig(tuned, DESIGNER_DARK_RIG.name),
		);
		expect(next).toHaveLength(2);
		expect(next[0].id).toBe("mine");
		expect(next[0].label).toBe("Mine");
		expect(next[0].colors.skinColor).toBe("#0f4c5c");
		expect(rigForTheme(next[0]).key.intensity).toBe(512);
	});

	it("editing the default theme leaves it the default — the reason identity is kept", () => {
		// The alternative design, delete-and-recreate, mints a new id and silently
		// drops the default pointer to a dangling reference on every edit.
		const renamed = renameTheme([mine, other], "mine", "Renamed");
		expect(resolveDefaultTheme(renamed, "mine").label).toBe("Renamed");
		const written = overwriteTheme(renamed, "mine", NOIR_THEME.colors, mine.rig);
		expect(resolveDefaultTheme(written, "mine").id).toBe("mine");
	});
});
