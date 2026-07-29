/**
 * studio-themes — savable full-device looks for the /3d studio.
 *
 * A theme is the COMPLETE presentation in one record: all seven surface colours
 * (case, wheel ring, wheel centre, back, edge, bezel, stage) plus the lighting
 * rig, referenced by rig name. Finishes (Black/Silver) are factory assets;
 * themes are the user's own — "save the look I just dialed in and get it back
 * in one tap, on any machine state".
 *
 * Learner's note: the rig is stored as a preset NAME plus the fields that
 * DEVIATE from it — never a whole copy. Storing a copy would fork the truth:
 * a later revision of a preset could never reach the themes that name it.
 * Storing only the name loses any tuning the user did on top of the preset,
 * which is the defect this pair was written to close (the rig came back
 * pristine after a save, silently). Name plus sparse overrides keeps both
 * properties — the preset remains the single definition of itself, and the
 * deviation from it becomes the theme's own data. An empty `overrides` is the
 * untouched case, and it still tracks the preset. The colours ARE stored by
 * value, because they are the theme.
 */

import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import type { IpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer, type IpodWorkbenchAction } from "@/lib/ipod-state/update";
import {
	DESIGNER_DARK_RIG,
	applyOverrides,
	diffFromPreset,
	type RigOverrides,
	type StudioLightingConfig,
} from "@/lib/studio-lighting-config";

// ─── Model ──────────────────────────────────────────────────────────────────

export interface StudioThemeColors {
	skinColor: string;
	ringColor: string;
	centerColor: string;
	backColor: string;
	edgeColor: string;
	bezelColor: string;
	bgColor: string;
}

/**
 * A rig as a theme records it: the preset it was dialed from, plus only what
 * the user moved. `overrides: {}` is an untouched preset and keeps tracking it.
 */
export interface StudioThemeRig {
	/** Name of a rig in `RIG_PRESETS` (e.g. "Designer Dark"). */
	name: string;
	/** Fields that deviate from that preset — empty when nothing was tuned. */
	overrides: RigOverrides;
}

export interface StudioTheme {
	id: string;
	label: string;
	colors: StudioThemeColors;
	rig: StudioThemeRig;
	/** Factory themes ship with the app and cannot be deleted, renamed or overwritten. */
	builtIn?: boolean;
}

/**
 * The canonical factory look — ratified verbatim from the curated localStorage
 * snapshot (case #1b1818, hand-tuned ring #313030, blue #0048FF stage, Designer
 * Dark rig). This is also exactly what a fresh `createInitialIpodWorkbenchModel`
 * boots; the theme exists so the user can always RETURN to factory in one tap.
 */
export const NOIR_THEME: StudioTheme = {
	id: "noir",
	label: "Noir",
	builtIn: true,
	colors: {
		skinColor: "#1b1818",
		ringColor: "#313030",
		centerColor: "#141212",
		backColor: "#cfd3d7",
		edgeColor: "#cfd3d7",
		bezelColor: "#0a0a0a",
		bgColor: "#0048FF",
	},
	rig: { name: "Designer Dark", overrides: {} },
};

export const BUILT_IN_THEMES: readonly StudioTheme[] = [NOIR_THEME] as const;

/**
 * Resolve a theme's rig to a private, editable config — the preset it names with
 * the theme's own deviations laid over it. An unknown preset degrades to
 * Designer Dark, the same rig a fresh load boots.
 */
export function rigForTheme(theme: StudioTheme): StudioLightingConfig {
	return applyOverrides(theme.rig.name, theme.rig.overrides);
}

/** Record a live rig as a theme's rig — the name it was dialed from, plus the delta. */
export function themeRigFromConfig(config: StudioLightingConfig, presetName: string): StudioThemeRig {
	return { name: presetName, overrides: diffFromPreset(config, presetName) };
}

/**
 * The complete edit that applying a theme makes — every one of the seven surface
 * colours plus the rig, as data.
 *
 * This is a pure function rather than a method on the cockpit because "apply Noir
 * returns the device to factory" is a claim that has to be TESTABLE. A theme that
 * sets six colours out of seven still looks applied — the seventh just keeps
 * whatever the last experiment left there — so the guarantee is not "it dispatched"
 * but "it overwrote every field the theme owns, from any prior state". A test can
 * only make that assertion against a value it can hold; so the cockpit dispatches
 * this list, and the list is what we test.
 */
export function themeActions(theme: StudioTheme): IpodWorkbenchAction[] {
	const { colors } = theme;
	return [
		{ type: "SET_SKIN_COLOR", payload: colors.skinColor },
		{ type: "SET_RING_COLOR", payload: colors.ringColor },
		{ type: "SET_CENTER_COLOR", payload: colors.centerColor },
		{ type: "SET_BACK_COLOR", payload: colors.backColor },
		{ type: "SET_EDGE_COLOR", payload: colors.edgeColor },
		{ type: "SET_BEZEL_COLOR", payload: colors.bezelColor },
		{ type: "SET_BG_COLOR", payload: colors.bgColor },
		// The rig completes the theme — colours and light are one look.
		{ type: "SET_LIGHTING", payload: rigForTheme(theme) },
	];
}

// ─── Persistence ────────────────────────────────────────────────────────────

export const STUDIO_THEMES_STORAGE_KEY = "ipodStudioThemes";

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Read a stored rig reference, migrating the v1 shape on the way in.
 *
 * v1 stored `rigName: string` and nothing else, so it reads as that preset with
 * no deviations — no stored data is lost and no write is required to upgrade.
 * A malformed `overrides` blob heals to "no deviation" rather than throwing:
 * `applyOverrides` is total, so re-diffing what it produced drops exactly what
 * it had to repair and keeps whatever survived.
 */
function sanitizeThemeRig(value: { rig?: unknown; rigName?: unknown }): StudioThemeRig {
	const rig = value.rig;
	if (typeof rig === "object" && rig !== null && !Array.isArray(rig)) {
		const { name, overrides } = rig as { name?: unknown; overrides?: unknown };
		if (typeof name === "string" && name.length > 0) {
			const repaired = applyOverrides(name, overrides as RigOverrides);
			return { name, overrides: diffFromPreset(repaired, name) };
		}
	}
	if (typeof value.rigName === "string" && value.rigName.length > 0) {
		return { name: value.rigName, overrides: {} };
	}
	return { name: DESIGNER_DARK_RIG.name, overrides: {} };
}

function sanitizeTheme(value: unknown): StudioTheme | null {
	if (typeof value !== "object" || value === null) return null;
	const t = value as Partial<StudioTheme> & { rigName?: unknown };
	const c = (t.colors ?? {}) as Partial<StudioThemeColors>;
	const colorKeys: (keyof StudioThemeColors)[] = [
		"skinColor",
		"ringColor",
		"centerColor",
		"backColor",
		"edgeColor",
		"bezelColor",
		"bgColor",
	];
	if (typeof t.id !== "string" || t.id.length === 0) return null;
	if (typeof t.label !== "string" || t.label.length === 0) return null;
	const colors = {} as StudioThemeColors;
	for (const key of colorKeys) {
		const hex = c[key];
		if (typeof hex !== "string" || !HEX.test(hex)) return null;
		colors[key] = hex;
	}
	return { id: t.id, label: t.label, colors, rig: sanitizeThemeRig(t) };
}

/** Load the user's saved themes (never the built-ins; those ship with the code). */
export function loadSavedThemes(): StudioTheme[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STUDIO_THEMES_STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map(sanitizeTheme)
			.filter((t): t is StudioTheme => t !== null);
	} catch {
		return [];
	}
}

export function persistSavedThemes(themes: StudioTheme[]): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STUDIO_THEMES_STORAGE_KEY, JSON.stringify(themes));
	} catch {
		// Quota/private-mode failures are non-fatal: the theme still applies live.
	}
}

/** Next free "Theme NN" label so saving never demands a naming dialog. */
export function nextThemeLabel(existing: readonly StudioTheme[]): string {
	const taken = new Set(existing.map((t) => t.label));
	for (let i = 1; i < 100; i++) {
		const label = `Theme ${String(i).padStart(2, "0")}`;
		if (!taken.has(label)) return label;
	}
	return `Theme ${existing.length + 1}`;
}

// ─── The default theme — one pointer, never a flag per record ────────────────

/**
 * Which theme a fresh visitor boots, stored as a single theme id.
 *
 * A pointer rather than an `isDefault` boolean on each record: a per-record flag
 * admits a state where two themes claim the default and one where none does, and
 * both will happen. A pointer cannot express either.
 */
export const STUDIO_DEFAULT_THEME_STORAGE_KEY = "ipodStudioDefaultTheme";

export function loadDefaultThemeId(): string | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage.getItem(STUDIO_DEFAULT_THEME_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function persistDefaultThemeId(id: string): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STUDIO_DEFAULT_THEME_STORAGE_KEY, id);
	} catch {
		// Quota/private-mode failures are non-fatal: the default still applies live.
	}
}

/**
 * The theme the pointer names, or Noir when it names nothing that exists.
 *
 * Deleting a theme deliberately leaves the pointer dangling rather than
 * rewriting it, so healing happens in exactly one place — here. Two places that
 * heal are two places that can disagree about what the default became.
 */
export function resolveDefaultTheme(
	themes: readonly StudioTheme[],
	id: string | null | undefined,
): StudioTheme {
	if (typeof id !== "string" || id.length === 0) return NOIR_THEME;
	return themes.find((t) => t.id === id) ?? NOIR_THEME;
}

/**
 * The model a fresh visitor boots — the factory model with the default theme's
 * look applied over it.
 *
 * Before this, `createInitialIpodWorkbenchModel` independently held the same
 * seven colours the Noir record holds, and the two agreed by coincidence. Two
 * sources of one fact with no link between them: edit either and "a fresh
 * visitor sees the noir hero look" starts passing for the wrong reason, or
 * failing for an invisible one. Now the theme is the source and the boot reads it.
 */
export function createBootedWorkbenchModel(
	themes: readonly StudioTheme[],
	defaultThemeId: string | null | undefined,
): IpodWorkbenchModel {
	const theme = resolveDefaultTheme(themes, defaultThemeId);
	return themeActions(theme).reduce(
		(model, action) => ipodWorkbenchReducer(model, action),
		createInitialIpodWorkbenchModel(),
	);
}

// ─── Editing a saved theme in place ─────────────────────────────────────────

/**
 * Rename a saved theme, preserving its identity and position.
 *
 * Identity is preserved rather than delete-and-recreate because the default
 * pointer names an id: a theme that is the default must stay the default across
 * a rename. Built-ins are rejected for the same reason they cannot be deleted —
 * they are the guaranteed route back to the factory look.
 */
export function renameTheme(
	themes: readonly StudioTheme[],
	id: string,
	label: string,
): StudioTheme[] {
	const next = label.trim();
	if (next.length === 0) return [...themes];
	return themes.map((t) => (t.id === id && !t.builtIn ? { ...t, label: next } : t));
}

/**
 * Replace a saved theme's look while keeping its id, label and position — the
 * "change one colour in a look I already like" path, which otherwise costs
 * apply → tweak → save-new → delete-old and leaves the survivor named "Theme 04".
 */
export function overwriteTheme(
	themes: readonly StudioTheme[],
	id: string,
	colors: StudioThemeColors,
	rig: StudioThemeRig,
): StudioTheme[] {
	return themes.map((t) =>
		t.id === id && !t.builtIn ? { ...t, colors: { ...colors }, rig } : t,
	);
}
