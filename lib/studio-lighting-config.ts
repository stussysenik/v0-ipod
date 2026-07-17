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
 * "Natural Light" — the window-daylight product template. Where the studio rigs
 * sculpt (Apple floods, the dark rigs carve), this one photographs: a big warm
 * window wall from the front-left, a cool sky bounce opposite, soft paper stage.
 *
 * Physics of why the labels read on a dark device under this rig: the wheel is
 * metal — its visible tone is `albedo × environment`, so a black wheel is only
 * as dark as the wall it mirrors. The bright window-wall softbox in front IS
 * that wall: it lifts the black ring's reflected tone several stops while the
 * screen-printed labels (diffuse ink, near-constant reflectance) stay put —
 * widening the print-to-ring contrast instead of washing it. Daylight is also
 * spectrally flat (high CRI): the warm window (≈5000K) + cool sky bounce mix to
 * neutral, so anodized hues read true rather than tinted by the rig.
 */
export const NATURAL_LIGHT_RIG: StudioLightingConfig = {
	name: "Natural Light",
	// Open-room ambience — daylight scattered off walls, not a black studio void.
	ambient: { color: "#f2f3f5", intensity: 0.5 },
	// The sun side of the window: warm, high, from the left — gentle modelling key.
	key: {
		color: "#fff3df",
		intensity: 130,
		position: [-9, 12, 10],
		angle: 0.42,
		penumbra: 1.0,
		castShadow: true,
	},
	// Skylight fill from the right — the cool half of daylight's warm/cool mix.
	fill: { color: "#e2ecf8", intensity: 70, position: [10, 6, 8], angle: 0.6, penumbra: 1.0 },
	// Soft top-back separation so the crown doesn't merge into the bright room.
	rim: { color: "#eef4fc", intensity: 80, position: [0, 9, -7], angle: 0.5, penumbra: 1.0 },
	env: {
		preset: "apartment",
		intensity: 1.1,
		blur: 0.55,
		softboxes: [
			// The window wall — the big bright panel the face and wheel mirror back.
			// This is the single light source that keeps dark-wheel labels legible.
			{ color: "#f7f4ed", intensity: 1.0, position: [-4, 3, 9], scale: [30, 38, 1] },
			// Second window pane, warmer and tighter — the glossy highlight with shape.
			{ color: "#fdf3e3", intensity: 0.85, position: [-8, 5, 4], scale: [9, 14, 1] },
			// Cool sky bounce, right — fills the shadow side a stop down.
			{ color: "#dfe9f4", intensity: 0.55, position: [8, 3, 4], scale: [8, 8, 1] },
			// Ceiling horizon — the thin crisp line that rakes the chrome rim.
			{ color: "#ffffff", intensity: 0.6, position: [0, 9, 1], scale: [14, 0.5, 1] },
			// Soft dark room corner behind — edge definition without studio black.
			{ color: "#3a3833", intensity: 0.6, position: [4, -1, -10], scale: [18, 18, 1] },
			// Warm floor/table bounce — daylight off the paper sweep.
			{ color: "#efe9de", intensity: 0.4, position: [0, -5, 2], scale: [12, 1.5, 1] },
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
 * One-tap rig presets for the cockpit — the named ends of the creative range. Picking a preset
 * only sets the LIGHTING; it never touches the background, so the lighting and the stage stay
 * independent (deterministic by value, no cross-talk).
 */
export interface RigPreset {
	id: string;
	label: string;
	config: StudioLightingConfig;
	/**
	 * The stage/backdrop colour this rig was *designed against* — a descriptor of the intended
	 * pairing (theme authoring, docs), NOT auto-applied to the live background. The lighting
	 * cockpit reads only `config`; the stage is the user's to set separately.
	 */
	stage?: string;
}

export const RIG_PRESETS: readonly RigPreset[] = [
	{ id: "apple", label: "Apple", config: APPLE_PRODUCT_RIG, stage: "#FFFFFF" },
	{ id: "natural", label: "Natural Light", config: NATURAL_LIGHT_RIG, stage: "#EDEAE3" },
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

/**
 * Per-pose light compositions — the softbox arrangement a named camera pose is
 * *shaped against*, in reflection space.
 *
 * A metal surface shows `albedo × environment`, so a highlight is the reflection of
 * a softbox. To draw one continuous highlight down the chamfer a given view describes,
 * the panel must sit where the camera sees its mirror. One global arrangement cannot do
 * that for every angle: the ¾ hero wants a long blade raking the front-right chamfer;
 * the back-steel view wants a single clean horizon card behind the lens; a side profile
 * wants the blade on the camera's flank and darkness opposite for edge contrast.
 *
 * These compositions are keyed by `studio-camera-poses` ids (see NAMED_POSES). They are
 * the pose's softbox *base*; the cockpit dials remain the override layer on top, so live
 * lighting stays a pure function of (dials, pose) with no coupling to the finish colour.
 * The spots (key/fill/rim), env preset and ambient come from the active rig unchanged —
 * only the reflected panels are re-shaped per pose. §4.2 tunes the exact panel geometry
 * visually under the final colour transform; this module fixes the structure + selection.
 */
export interface PoseLightComposition {
	/** Read-only name surfaced in the lighting cockpit (§4.3). */
	name: string;
	/** The `studio-camera-poses` id this composition is shaped for. */
	poseId: string;
	/** The reflected panels, in reflection space for this pose. Replaces `env.softboxes`. */
	softboxes: SoftboxSpec[];
}

/** The big even front-fill panel the face mirrors back to the lens — shared base plate. */
const FRONT_FILL: SoftboxSpec = { color: "#f8fafc", intensity: 0.85, position: [0, 1.5, 9.5], scale: [30, 38, 1] };
/** The deep panel behind the device that gives silver/white edges definition. */
const CONTRAST_PIT: SoftboxSpec = { color: "#000000", intensity: 0.8, position: [0, -2, -10], scale: [20, 20, 1] };

export const POSE_LIGHT_COMPOSITIONS: readonly PoseLightComposition[] = [
	{
		// ¾ hero: a long warm blade raked top-right so its reflection runs down the
		// front-right chamfer the ¾ view is about; cool shoulder opposite for separation.
		name: "Chamfer Rake",
		poseId: "hero",
		softboxes: [
			FRONT_FILL,
			{ color: "#ffffff", intensity: 0.9, position: [7, 7, 3], scale: [0.6, 22, 1] },
			{ color: "#fff4e6", intensity: 0.65, position: [6, 4, 4], scale: [7, 4, 1] },
			{ color: "#e6f0ff", intensity: 0.6, position: [-6, 2, 4], scale: [7, 4, 1] },
			CONTRAST_PIT,
		],
	},
	{
		// Front face-on: the front fill dominates as an even wash; symmetric shoulders and
		// a crisp top horizon rake the crown. No side bias — the face reads flat and true.
		name: "Even Wash",
		poseId: "front",
		softboxes: [
			FRONT_FILL,
			{ color: "#ffffff", intensity: 0.75, position: [0, 9, 1], scale: [14, 0.5, 1] },
			{ color: "#fff4e6", intensity: 0.6, position: [6, 4, 4], scale: [6, 5, 1] },
			{ color: "#e6f0ff", intensity: 0.6, position: [-6, 4, 4], scale: [6, 5, 1] },
			CONTRAST_PIT,
		],
	},
	{
		// Back steel: the mirror-polished cap wants one clean gradient, not busy panels —
		// a single tall horizon card behind the lens sweeps the pillowed steel top-to-bottom.
		name: "Horizon Card",
		poseId: "back",
		softboxes: [
			{ color: "#f4f7fb", intensity: 0.95, position: [0, 3, 10], scale: [34, 30, 1] },
			{ color: "#ffffff", intensity: 0.7, position: [0, 9, 2], scale: [16, 0.5, 1] },
			CONTRAST_PIT,
		],
	},
	{
		// Right profile: blade on the camera flank (+X) rakes the right edge chamfer; the
		// opposite flank stays dark so the silhouette edge carries a single drawn line.
		name: "Right Edge Rake",
		poseId: "right",
		softboxes: [
			FRONT_FILL,
			{ color: "#ffffff", intensity: 1.0, position: [8, 5, 3], scale: [0.6, 20, 1] },
			CONTRAST_PIT,
		],
	},
	{
		// Left profile: mirror of Right — blade on -X for the left edge chamfer.
		name: "Left Edge Rake",
		poseId: "left",
		softboxes: [
			FRONT_FILL,
			{ color: "#ffffff", intensity: 1.0, position: [-8, 5, 3], scale: [0.6, 20, 1] },
			CONTRAST_PIT,
		],
	},
	{
		// Top-down crown: an overhead soft box plus a low even ring so the crown and the
		// wheel dish both read without a raking edge (there is no side chamfer from above).
		name: "Overhead Soft",
		poseId: "top",
		softboxes: [
			{ color: "#f8fafc", intensity: 0.9, position: [0, 10, 3], scale: [26, 26, 1] },
			{ color: "#eef4fc", intensity: 0.5, position: [0, 1, 9], scale: [24, 12, 1] },
			CONTRAST_PIT,
		],
	},
] as const;

/**
 * Which composition a pose sits on — a pure function of the pose id. An unknown id or
 * free orbit (`null`) returns `null`, meaning "keep the rig's own softboxes" (the default
 * rig). No finish colour is read: lighting stays a pure function of (dials, pose).
 */
export function selectPoseComposition(poseId: string | null | undefined): PoseLightComposition | null {
	if (!poseId) return null;
	return POSE_LIGHT_COMPOSITIONS.find((c) => c.poseId === poseId) ?? null;
}

/**
 * Apply a pose's composition to a rig — the pure `(dials, pose) → rig` map. Returns a new
 * config with only `env.softboxes` swapped for the pose's reflected panels; the spots, env
 * preset, ambient and every dial value pass through untouched (dials are the override layer).
 * An unknown/free-orbit pose returns the base rig cloned, unchanged. The output never depends
 * on any finish colour — the spec's "no hidden coupling to finish" guarantee, made testable.
 */
export function composeRigForPose(
	base: StudioLightingConfig,
	poseId: string | null | undefined,
): StudioLightingConfig {
	const composition = selectPoseComposition(poseId);
	const config = cloneLightingConfig(base);
	if (!composition) return config;
	config.env.softboxes = composition.softboxes.map((s) => ({
		...s,
		position: [...s.position],
		scale: [...s.scale],
	}));
	return config;
}

/**
 * Upper intensity clamps for the sanitizer. The canvas renders with NoToneMapping —
 * there is no filmic rolloff, so an oversized intensity clips straight to white and
 * this sanitizer is the only safety net. Each ceiling sits ~3–4× the hottest shipped
 * rig value (rim spot 340, softbox 1.6, env 1.25, ambient 1.0), so every hand-tuned
 * look passes untouched while a corrupt or hand-edited blob cannot white out the render.
 */
export const MAX_AMBIENT_INTENSITY = 4;
export const MAX_SPOT_INTENSITY = 1200;
export const MAX_SOFTBOX_INTENSITY = 6;
export const MAX_ENV_INTENSITY = 4;

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
		intensity: Math.min(Math.max(num(c.intensity, fallback.intensity), 0), MAX_SPOT_INTENSITY),
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
			intensity: Math.min(Math.max(num(c.ambient?.intensity, base.ambient.intensity), 0), MAX_AMBIENT_INTENSITY),
		},
		key: sanitizeSpot(c.key, base.key),
		fill: sanitizeSpot(c.fill, base.fill),
		rim: sanitizeSpot(c.rim, base.rim),
		env: {
			preset,
			intensity: Math.min(Math.max(num(env.intensity, base.env.intensity), 0), MAX_ENV_INTENSITY),
			blur: Math.min(Math.max(num(env.blur, base.env.blur), 0), 1),
			softboxes: Array.isArray(env.softboxes)
				? env.softboxes.map((s, i) => {
						const fb = base.env.softboxes[i] ?? base.env.softboxes[0];
						const sb = (s ?? {}) as Partial<SoftboxSpec>;
						return {
							color: hex(sb.color, fb.color),
							intensity: Math.min(Math.max(num(sb.intensity, fb.intensity), 0), MAX_SOFTBOX_INTENSITY),
							position: triple(sb.position, fb.position),
							scale: triple(sb.scale, fb.scale),
						};
					})
				: base.env.softboxes.map((s) => ({ ...s, position: [...s.position], scale: [...s.scale] })),
		},
	};
}
