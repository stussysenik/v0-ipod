/**
 * studio-owned-finish — the render function takes OWNERSHIP of a clean export.
 *
 * The `/3d` studio lets an end-user pick five device colours (face, back, wheel ring/centre,
 * bezel) against a stage colour, then export a motion clip (orbit / turntable / sweep / robo).
 * That is a huge combinatorial space, and a fixed rig can't be flattering across all of it: a
 * near-white device melts into the white Apple stage; a near-black device disappears into the
 * Designer-Dark stage; a mirror back strobes under a turntable's 360° spin.
 *
 * Rather than hope the user picks a kind combination, this module makes the render path the
 * AUTHORITY. Given the curated base rig + the chosen colours, `deriveOwnedRig` returns a rig
 * whose energy is reshaped so three invariants always hold, for any colour × any motion:
 *
 *   I1  no specular crawl   — the polished back never drops below STEEL_ROUGHNESS_FLOOR, so a
 *                             turntable melts the env's bright spots into a smooth moving
 *                             gradient instead of crawling hotspots. (Applied at the material.)
 *   I2  always separated    — the silhouette always carries an edge against the stage, whether
 *                             that means lifting a cool rim (dark stage) or deepening the dark
 *                             contrast panel (light stage).
 *   I4  no crush / no wash   — a near-black face gets a fill+ambient floor so its shadow side
 *                             keeps form; a near-white face gets a gentle key+env trim so its
 *                             hue isn't washed flat. (No global tone curve — that would shift
 *                             every picked hue and break the deliberately literal NoToneMapping
 *                             render. We reshape the *rig's light energy* instead, which keeps
 *                             colour fidelity AND WYSIWYG: the same rig drives preview + export.)
 *
 * (I3 "colour reads true" is preserved by NOT touching the tone curve — see three-d-ipod's gl
 * config — so this module only ever moves light energy, never the output transform.)
 *
 * Pure + framework-free (no three, no React): every output is a deterministic function of the
 * inputs, so the whole thing is unit-testable and the keyframe-diff harness can reason about it.
 */

import { cloneLightingConfig, type StudioLightingConfig } from "./studio-lighting-config";

/**
 * Below this GGX roughness the steel back is a 1:1 mirror: a turntable's full 360° azimuth then
 * converts the camera's angular velocity directly into hotspots crawling across the back
 * whenever the env carries discrete point sources (the Night preset's street lights), strobing
 * once per cycle — the opposite of "pleasing to watch on a loop". At 0.13 the GGX lobe is wide
 * enough to low-pass those spots into a smooth gradient while clearcoat keeps the wet polish.
 * Exported as the single source of truth so the material can't silently regress below it.
 */
export const STEEL_ROUGHNESS_FLOOR = 0.13;

/** Factory stainless — the back's default when the caller leaves it unset. */
const FACTORY_STEEL = "#cfd3d7";

/** The chosen exterior colours that matter for the finish, plus the stage behind them. */
export interface DeviceColors {
	/** Front face / body (anodized aluminum albedo). */
	skin: string;
	/** Polished steel back; defaults to factory stainless. */
	back?: string;
	/** Stage / backdrop colour the device sits against. */
	stage: string;
}

/** Parse `#rgb` / `#rrggbb` into 0..1 channels; tolerant of a missing/short hash. */
function channels(hex: string): [number, number, number] {
	let h = hex.replace("#", "").trim();
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	if (h.length !== 6) return [0.5, 0.5, 0.5];
	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	return [Number.isFinite(r) ? r : 0.5, Number.isFinite(g) ? g : 0.5, Number.isFinite(b) ? b : 0.5];
}

/**
 * Perceptual luminance on the sRGB-encoded channels (Rec.709 weights). We deliberately use the
 * gamma-encoded value, not linear light, because separation is a question of *perceived*
 * brightness — how close two swatches look to the eye — which is what the gamma curve models.
 * Returns 0 (black) .. 1 (white).
 */
export function relativeLuminance(hex: string): number {
	const [r, g, b] = channels(hex);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Hermite smoothstep, clamped. edge0 < edge1. Returns 0 below edge0, 1 above edge1. */
function smoothstep(edge0: number, edge1: number, x: number): number {
	if (edge0 === edge1) return x < edge0 ? 0 : 1;
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

/** Stage darkness thresholds — below LIGHT_STAGE we separate with a rim, above we deepen the panel. */
const DARK_STAGE = 0.45;
const LIGHT_STAGE = 0.6;
/** How close (in luma) a surface must get to the stage before the proximity ramp kicks in fully. */
const PROXIMITY_SPAN = 0.35;

/**
 * Reshape a curated rig so the chosen colours export cleanly. Returns a NEW config (the base is
 * never mutated) so the same call drives both the live preview and the offline export — WYSIWYG
 * by construction. `technicalFlat` callers should skip this: the flat spec-sheet view wants the
 * neutral rig untouched.
 */
export function deriveOwnedRig(base: StudioLightingConfig, colors: DeviceColors): StudioLightingConfig {
	const rig = cloneLightingConfig(base);
	const stageLum = relativeLuminance(colors.stage);
	const faceLum = relativeLuminance(colors.skin);
	const backLum = relativeLuminance(colors.back ?? FACTORY_STEEL);

	// ── I2 separation ─────────────────────────────────────────────────────────────────────
	// `proximity` ∈ [0,1]: 0 when the nearest-in-tone exterior surface is comfortably distinct
	// from the stage, ramping to 1 as it converges on the stage's own luma (the melt-in danger).
	if (stageLum < DARK_STAGE) {
		// Dark stage → a dark device dissolves into it. Lift the cool separation rim to carve a
		// bright edge down the silhouette. Scales the rim 1×→1.7× as the device approaches stage tone.
		const darkest = Math.min(faceLum, backLum);
		const proximity = 1 - smoothstep(0, PROXIMITY_SPAN, Math.abs(darkest - stageLum));
		rig.rim.intensity *= 1 + 0.7 * proximity;
	} else if (stageLum > LIGHT_STAGE) {
		// Light stage → a light device bleeds into it. There's no "bright rim" against white; the
		// edge instead comes from the dark contrast panel the metal mirrors. Deepen that panel
		// (the near-black softbox) so the silhouette gains a defining dark reflection. 1×→1.8×.
		const lightest = Math.max(faceLum, backLum);
		const proximity = 1 - smoothstep(0, PROXIMITY_SPAN, Math.abs(lightest - stageLum));
		const panel = rig.env.softboxes.find((s) => relativeLuminance(s.color) < 0.08);
		if (panel) panel.intensity *= 1 + 0.8 * proximity;
	}

	// ── I4 no crush / no wash ─────────────────────────────────────────────────────────────
	// Near-black face: raise the fill + ambient floor so the shadow side reads as lit dark metal
	// with form, not a dead black blob. `darkLift` is 1 at #000 and 0 by luma 0.18.
	const darkLift = 1 - smoothstep(0, 0.18, faceLum);
	rig.fill.intensity *= 1 + 0.4 * darkLift;
	rig.ambient.intensity *= 1 + 0.5 * darkLift;

	// Near-white face: trim the key + env a touch so the broad face reads as clean white with a
	// hint of gradient, rather than clipping its hue flat. `whiteTrim` is 0 below luma 0.82, 1 at #fff.
	const whiteTrim = smoothstep(0.82, 1, faceLum);
	rig.key.intensity *= 1 - 0.18 * whiteTrim;
	rig.env.intensity *= 1 - 0.12 * whiteTrim;

	return rig;
}
