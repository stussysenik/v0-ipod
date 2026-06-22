/**
 * studio-themes — savable full-device looks for the /3d studio.
 *
 * A theme is the COMPLETE presentation in one record: all seven surface colours
 * (case, wheel ring, wheel centre, back, edge, bezel, stage) plus the lighting
 * rig, referenced by rig name. Finishes (Black/Silver) are factory assets;
 * themes are the user's own — "save the look I just dialed in and get it back
 * in one tap, on any machine state".
 *
 * Learner's note: the rig is stored by NAME, not by value. Rigs are live-tunable
 * JSON, so persisting a full rig copy inside every theme would fork the truth —
 * instead a theme points at a named preset in `RIG_PRESETS` and degrades
 * gracefully (Designer Dark) if the name disappears in a future revision. The
 * colours ARE stored by value because they are the theme.
 */

import {
	DESIGNER_DARK_RIG,
	RIG_PRESETS,
	cloneLightingConfig,
	type StudioLightingConfig,
} from "@ipod/lib/studio-lighting-config";

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

export interface StudioTheme {
	id: string;
	label: string;
	colors: StudioThemeColors;
	/** Name of a rig in `RIG_PRESETS` (e.g. "Designer Dark"). */
	rigName: string;
	/** Factory themes ship with the app and cannot be deleted. */
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
	rigName: "Designer Dark",
};

export const BUILT_IN_THEMES: readonly StudioTheme[] = [NOIR_THEME] as const;

/** Resolve a theme's rig to a private, editable clone (Designer Dark fallback). */
export function rigForTheme(theme: StudioTheme): StudioLightingConfig {
	const preset = RIG_PRESETS.find((p) => p.config.name === theme.rigName);
	return cloneLightingConfig(preset?.config ?? DESIGNER_DARK_RIG);
}

// ─── Persistence ────────────────────────────────────────────────────────────

export const STUDIO_THEMES_STORAGE_KEY = "ipodStudioThemes";

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function sanitizeTheme(value: unknown): StudioTheme | null {
	if (typeof value !== "object" || value === null) return null;
	const t = value as Partial<StudioTheme>;
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
	return {
		id: t.id,
		label: t.label,
		colors,
		rigName: typeof t.rigName === "string" ? t.rigName : DESIGNER_DARK_RIG.name,
	};
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
