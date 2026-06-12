/**
 * studio-lighting-config — the *data* model of the `/3d` studio rig.
 *
 * This module is deliberately framework-free: no React, no three, no drei. It holds the
 * pure description of a lighting setup so it can be (a) embedded in the persisted workbench
 * model, (b) live-tuned by the Lighting Cockpit, and (c) rendered by `<StudioLighting>` —
 * all three reading the exact same record. One source of truth, deterministic by hex value.
 *
 * MENTAL MODEL — a photographer's product table, not a videogame scene:
 *
 *   The device's front face and wheel are *dyed metal* (metalness ≈ 1.0). A metal has almost
 *   no diffuse colour of its own; what you see is `albedo × environment`. So the brightness
 *   of the iPod comes FIRST from the surrounding studio (the `env` softboxes), and the three
 *   hard spots only *shape* — they carve highlights and a separation rim, they never floodlight.
 *
 *   pseudocode  surfaceColour(pixel):
 *       reflected = sample(environment, reflect(viewDir, normal))   // the softbox wall it mirrors
 *       shaped    = Σ spot_i.contribution(pixel)                     // key + fill + rim kickers
 *       return toneMap(albedo * reflected + shaped)
 *
 * Every field below is plain JSON so the cockpit can serialize/restore it and the export path
 * is WYSIWYG (the same numbers drive the live canvas and the baked frame).
 */

/** drei `<Environment preset>` values — kept as a literal union so this file needs no drei import. */
export type EnvironmentPreset =
	| "apartment"
	| "city"
	| "dawn"
	| "forest"
	| "lobby"
	| "night"
	| "park"
	| "studio"
	| "sunset"
	| "warehouse";

export const ENVIRONMENT_PRESETS: readonly EnvironmentPreset[] = [
	"apartment",
	"city",
	"dawn",
	"forest",
	"lobby",
	"night",
	"park",
	"studio",
	"sunset",
	"warehouse",
] as const;

/** A hard, shaping light (key / fill / rim). Position is a studio coordinate in device units. */
export interface SpotSpec {
	color: string;
	intensity: number;
	position: [number, number, number];
	/** Cone half-angle (radians). Tighter = a directional kicker; wider = a wash. */
	angle: number;
	/** 0 = hard edge, 1 = fully soft falloff. */
	penumbra: number;
	castShadow?: boolean;
}

/** A soft emissive panel in the environment — the wall the metal actually mirrors. */
export interface SoftboxSpec {
	color: string;
	intensity: number;
	position: [number, number, number];
	scale: [number, number, number];
}

/** The three named, shapeable spots of the rig. */
export type SpotRole = "key" | "fill" | "rim";

export interface StudioLightingConfig {
	name: string;
	ambient: { color: string; intensity: number };
	key: SpotSpec;
	fill: SpotSpec;
	rim: SpotSpec;
	env: {
		preset: EnvironmentPreset;
		/** Master dial for how bright the metal reads — the env *is* the metal's brightness. */
		intensity: number;
		blur: number;
		softboxes: SoftboxSpec[];
	};
}

/**
 * The named default rig — "Apple Product".
 *
 * Design intent (ratified in the 3d-product-fidelity spec): brightness comes first from a
 * filled studio environment; the direct spots only add soft shaping — never clipping. The big
 * soft `frontFill` softbox (+Z, between device and lens) is what the silver face mirrors back
 * at the camera: it lifts Silver into brushed satin while Black (albedo ~0.1) tints that same
 * panel down to rich graphite. One panel, two finishes, both correct.
 */
export const APPLE_PRODUCT_RIG: StudioLightingConfig = {
	name: "Apple Product",
	ambient: { color: "#eef1f5", intensity: 0.35 },
	// Warm soft key, top-right. Gentle: the metal draws its brightness from the env, so a
	// punchy key would only clip the matte aluminum to flat white.
	key: {
		color: "#FFF5E0",
		intensity: 120,
		position: [9, 13, 11],
		angle: 0.35,
		penumbra: 1.0,
		castShadow: true,
	},
	// Cool fill, left.
	fill: { color: "#d8e8ff", intensity: 80, position: [-11, 5, 9], angle: 0.55, penumbra: 0.95 },
	// Cool separation rim — raked from the upper-back-LEFT so it draws a thin bright edge down
	// the device's left/top silhouette, the side that otherwise melts into the sweep at a 3/4
	// hero angle. Tighter angle = a directional kicker, not a wash; cool so it reads as a studio
	// rim rather than a second key (design D13 separation).
	rim: { color: "#D8E8FF", intensity: 110, position: [-6, 7, -8], angle: 0.5, penumbra: 0.98 },
	env: {
		preset: "studio",
		intensity: 1.25,
		blur: 0.4,
		softboxes: [
			// The big soft front fill — the panel the front face mirrors back to the lens.
			// Wide + tall so it fills the front reflection hemisphere as an even wash.
			{ color: "#f8fafc", intensity: 0.85, position: [0, 1.5, 9.5], scale: [30, 38, 1] },
			// Top edge — a crisp horizon highlight raked across the chrome.
			{ color: "#ffffff", intensity: 0.75, position: [0, 9, 1], scale: [14, 0.5, 1] },
			// Warm shoulder, top-right.
			{ color: "#fff4e6", intensity: 0.65, position: [6, 4, 4], scale: [7, 4, 1] },
			// Cool shoulder, left.
			{ color: "#e6f0ff", intensity: 0.6, position: [-6, 2, 4], scale: [7, 4, 1] },
			// Dark contrast panel — gives white/silver edges definition instead of bleeding
			// into a white environment ("solidified product").
			{ color: "#000000", intensity: 0.8, position: [0, -2, -10], scale: [20, 20, 1] },
			// Soft floor bounce.
			{ color: "#f0f0f0", intensity: 0.35, position: [0, -5, 2], scale: [12, 1.5, 1] },
		],
	},
};

/**
 * "Designer Dark" — a low-key, editorial hero rig. Where the Apple Product rig floods the
 * metal evenly, this one drops the floor to near-black and carves the device out with a
 * single punchy warm key and a hard cool rim, so the silhouette reads dramatic against a
 * black stage. Pair with a dark Stage colour (the cockpit preset sets both). This is the
 * boundary-pushing end of the range — turn the env down, let the shadows fall.
 */
export const DESIGNER_DARK_RIG: StudioLightingConfig = {
	name: "Designer Dark",
	ambient: { color: "#0a0e16", intensity: 0.16 },
	// Punchy warm key raked from the side — the one source that models the form.
	key: {
		color: "#fff0d6",
		intensity: 240,
		position: [11, 9, 8],
		angle: 0.28,
		penumbra: 0.9,
		castShadow: true,
	},
	// Barely-there cool fill — just enough to keep the shadow side from going pure black.
	fill: { color: "#1a2740", intensity: 34, position: [-12, 3, 7], angle: 0.6, penumbra: 1.0 },
	// Hard cool rim from upper-back-left — the bright separation edge that sells the dark.
	rim: { color: "#cfe6ff", intensity: 260, position: [-7, 6, -9], angle: 0.4, penumbra: 0.95 },
	env: {
		preset: "night",
		intensity: 0.4,
		blur: 0.5,
		softboxes: [
			// Dim front fill — a deep graphite the silver face mirrors as a moody sheen.
			{ color: "#10141c", intensity: 0.45, position: [0, 1.5, 9.5], scale: [30, 38, 1] },
			// A single crisp bright horizon edge — the highlight that rakes the chrome rim.
			{ color: "#dbe8ff", intensity: 1.3, position: [0, 8, 2], scale: [16, 0.4, 1] },
			// Tight warm shoulder, top-right.
			{ color: "#ffce9e", intensity: 0.85, position: [6, 3, 4], scale: [5, 3, 1] },
			// Big dark contrast panel — solidifies the edges against the black field.
			{ color: "#000000", intensity: 1.0, position: [0, -2, -10], scale: [22, 22, 1] },
		],
	},
};

/**
 * "Edge Noir" — the boundary-pushing dark rig for black-on-black. Where Designer Dark
 * still models the form with one warm key, Edge Noir goes further: the field stays
 * near-black and the device is *drawn*, not lit — two opposed hard rims trace the
 * silhouette from behind, twin horizon softboxes rake the chrome edges from both
 * sides, and the front fill is dropped to a whisper so nothing floods the metal.
 * This answers the "Apple lights-on washes a black device out" failure: with a dark
 * stage the black case keeps its depth while every edge carries a drawn highlight.
 */
export const EDGE_NOIR_RIG: StudioLightingConfig = {
	name: "Edge Noir",
	ambient: { color: "#06080d", intensity: 0.1 },
	// Restrained warm key — just enough modelling that the face isn't a void.
	key: {
		color: "#ffe9c4",
		intensity: 150,
		position: [10, 8, 9],
		angle: 0.24,
		penumbra: 0.85,
		castShadow: true,
	},
	// The "fill" is repurposed as a SECOND rim from the opposite back quarter, so
	// both long edges of the chassis carry a drawn line — dual-kicker product noir.
	fill: { color: "#9fc4ff", intensity: 210, position: [8, 5, -9], angle: 0.34, penumbra: 0.9 },
	// Primary hard cool rim, upper-back-left — the brightest stroke in the frame.
	rim: { color: "#e3f0ff", intensity: 340, position: [-7, 7, -9], angle: 0.36, penumbra: 0.9 },
	env: {
		preset: "night",
		intensity: 0.3,
		blur: 0.45,
		softboxes: [
			// Whisper front fill — keeps the LCD glass alive without lifting the case.
			{ color: "#0a0d13", intensity: 0.35, position: [0, 1.5, 9.5], scale: [30, 38, 1] },
			// Twin horizon blades — thin bright lines the chrome edge mirrors on BOTH
			// flanks, so the side band reads as a continuous drawn edge in any pose.
			{ color: "#e8f1ff", intensity: 1.6, position: [-7, 5, 1], scale: [0.5, 18, 1] },
			{ color: "#e8f1ff", intensity: 1.6, position: [7, 5, 1], scale: [0.5, 18, 1] },
			// Crisp top horizon — the highlight that rakes the crown.
			{ color: "#dbe8ff", intensity: 1.2, position: [0, 8.5, 1], scale: [16, 0.4, 1] },
			// Deep contrast pit behind — solidifies the silhouette against the field.
			{ color: "#000000", intensity: 1.0, position: [0, -2, -10], scale: [24, 24, 1] },
		],
	},
};

/**
 * A neutral, recessive rig for the "Lights Off / Technical" flat view. The device materials
 * are swapped to flat/unlit in the renderer, so this rig only needs to keep the LCD legible
 * and the field calm — no shaping, no reflections competing with the flat albedo.
 */
export const FLAT_TECHNICAL_RIG: StudioLightingConfig = {
	name: "Technical Flat",
	ambient: { color: "#ffffff", intensity: 1.0 },
	key: { color: "#ffffff", intensity: 0, position: [0, 10, 10], angle: 0.4, penumbra: 1 },
	fill: { color: "#ffffff", intensity: 0, position: [-10, 5, 9], angle: 0.5, penumbra: 1 },
	rim: { color: "#ffffff", intensity: 0, position: [-6, 7, -8], angle: 0.5, penumbra: 1 },
	env: { preset: "studio", intensity: 0, blur: 1, softboxes: [] },
};

/**
 * One-tap rig presets for the cockpit — the named ends of the creative range. Each carries an
 * optional `stage` colour so a preset can set the whole look (rig + backdrop) in one gesture.
 */
export interface RigPreset {
	id: string;
	label: string;
	config: StudioLightingConfig;
	/** Stage/backdrop colour that completes the look (dispatched as SET_BG_COLOR). */
	stage?: string;
}

export const RIG_PRESETS: readonly RigPreset[] = [
	{ id: "apple", label: "Apple", config: APPLE_PRODUCT_RIG, stage: "#FFFFFF" },
	{ id: "dark", label: "Designer Dark", config: DESIGNER_DARK_RIG, stage: "#0B0D12" },
	{ id: "edge-noir", label: "Edge Noir", config: EDGE_NOIR_RIG, stage: "#050608" },
] as const;

/** Deep-clone a config so the cockpit edits a private copy, never the shared default. */
export function cloneLightingConfig(config: StudioLightingConfig): StudioLightingConfig {
	return {
		name: config.name,
		ambient: { ...config.ambient },
		key: { ...config.key, position: [...config.key.position] },
		fill: { ...config.fill, position: [...config.fill.position] },
		rim: { ...config.rim, position: [...config.rim.position] },
		env: {
			...config.env,
			softboxes: config.env.softboxes.map((s) => ({
				...s,
				position: [...s.position],
				scale: [...s.scale],
			})),
		},
	};
}

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const num = (v: unknown, fallback: number): number =>
	typeof v === "number" && Number.isFinite(v) ? v : fallback;
const hex = (v: unknown, fallback: string): string =>
	typeof v === "string" && HEX.test(v) ? v : fallback;
const triple = (
	v: unknown,
	fallback: [number, number, number],
): [number, number, number] =>
	Array.isArray(v) && v.length === 3
		? [num(v[0], fallback[0]), num(v[1], fallback[1]), num(v[2], fallback[2])]
		: fallback;

function sanitizeSpot(v: unknown, fallback: SpotSpec): SpotSpec {
	const c = (v ?? {}) as Partial<SpotSpec>;
	return {
		color: hex(c.color, fallback.color),
		intensity: Math.max(0, num(c.intensity, fallback.intensity)),
		position: triple(c.position, fallback.position),
		angle: Math.min(Math.max(num(c.angle, fallback.angle), 0), Math.PI / 2),
		penumbra: Math.min(Math.max(num(c.penumbra, fallback.penumbra), 0), 1),
		castShadow: typeof c.castShadow === "boolean" ? c.castShadow : fallback.castShadow,
	};
}

/**
 * Tolerant validator for a config loaded from localStorage. Any malformed field falls back to
 * the Designer Dark default — the same rig a fresh load boots — so a corrupt or out-of-date
 * blob heals to the factory look instead of silently switching the studio's mood.
 */
export function sanitizeLightingConfig(value: unknown): StudioLightingConfig {
	const base = DESIGNER_DARK_RIG;
	if (typeof value !== "object" || value === null) return cloneLightingConfig(base);
	const c = value as Partial<StudioLightingConfig>;
	const env = (c.env ?? {}) as Partial<StudioLightingConfig["env"]>;
	const preset = ENVIRONMENT_PRESETS.includes(env.preset as EnvironmentPreset)
		? (env.preset as EnvironmentPreset)
		: base.env.preset;

	return {
		name: typeof c.name === "string" ? c.name : base.name,
		ambient: {
			color: hex(c.ambient?.color, base.ambient.color),
			intensity: Math.max(0, num(c.ambient?.intensity, base.ambient.intensity)),
		},
		key: sanitizeSpot(c.key, base.key),
		fill: sanitizeSpot(c.fill, base.fill),
		rim: sanitizeSpot(c.rim, base.rim),
		env: {
			preset,
			intensity: Math.max(0, num(env.intensity, base.env.intensity)),
			blur: Math.min(Math.max(num(env.blur, base.env.blur), 0), 1),
			softboxes: Array.isArray(env.softboxes)
				? env.softboxes.map((s, i) => {
						const fb = base.env.softboxes[i] ?? base.env.softboxes[0];
						const sb = (s ?? {}) as Partial<SoftboxSpec>;
						return {
							color: hex(sb.color, fb.color),
							intensity: Math.max(0, num(sb.intensity, fb.intensity)),
							position: triple(sb.position, fb.position),
							scale: triple(sb.scale, fb.scale),
						};
					})
				: base.env.softboxes.map((s) => ({ ...s, position: [...s.position], scale: [...s.scale] })),
		},
	};
}
