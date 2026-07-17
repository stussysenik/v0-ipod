import { relativeLuminance } from "./color-manifest";

/**
 * finish-material-table — the *data* model of how each device part responds to light
 * as a function of its finish luminance. Framework-free (no three, no React): a pure
 * closed-form table so the response can be reasoned about, unit-tested headlessly, and
 * shared by the live materials and the export path.
 *
 * WHY THIS EXISTS — the "black reads as void" failure:
 *
 *   The face, wheel ring and select button are near-dielectric plastic dyed to the
 *   finish colour. Their visible sheen is `albedo × environment × envMapIntensity`. On a
 *   black finish the albedo term collapses, so a flat `envMapIntensity` (the old 0.16/0.18
 *   constants) returns almost nothing and the click wheel — the product's icon — sinks
 *   into the housing as a flat silhouette. Real hardware doesn't do that: even at #111 the
 *   acrylic wheel, the polycarbonate face and the touch ring separate by *specular
 *   signature*, each catching the studio a little differently.
 *
 *   The fix is finish-aware, not a global lift. As a finish darkens, this table
 *   (a) raises env response so every part clears a visible floor with margin, and
 *   (b) sharpens roughness so the darks read as slick reflective plastic that *catches*
 *   the environment rather than a matte void — while holding a fixed roughness gap
 *   between the three parts so the wheel stays legible as its own part at any luminance.
 *
 *   pseudocode  partParams(finish, part):
 *       boost   = darkBoost(luminance(finish))          // 0 at light finishes → ~1 at black
 *       env     = part.envBase + boost * part.envLift    // ≥ floor everywhere, lifted on darks
 *       rough   = part.roughLight - boost * DARK_SHARPEN  // shared sharpen → gap preserved
 *       return { env, rough, clearcoat, clearcoatRoughness, metalness }
 *
 * §3.2 wires these params into the `three-d-ipod.tsx` materials (replacing the hardcoded
 * per-part constants); this module and its tests fix the response as verifiable data first.
 */

/** The four separable parts the table drives. */
export type FinishPart = "face" | "ring" | "wheel" | "glyphs";

export interface PartMaterialParams {
	metalness: number;
	roughness: number;
	clearcoat: number;
	clearcoatRoughness: number;
	envMapIntensity: number;
}

/**
 * The minimum environment response every part returns, at every finish — the
 * "no finish renders as an unresponsive void" floor. Set above the legacy flat
 * 0.16/0.18 constants so a black finish clears it with real margin, not by a hair.
 */
export const ENV_RESPONSE_FLOOR = 0.2;

/**
 * The minimum roughness gap held between adjacent parts (wheel ‹ ring ‹ face). A
 * distinct roughness is a distinct specular signature, so the wheel keeps reading as
 * a separate part from the face even when both share a near-black colour.
 */
export const SEPARATION_EPSILON = 0.06;

/**
 * Luminance at/above which a finish gets no dark lift (a mid/light finish already
 * returns plenty of env from its albedo). Below it, the lift ramps linearly to full
 * at true black. ~0.35 puts silver/white at zero boost and every dark case in the ramp.
 */
export const DARK_REFERENCE_LUMINANCE = 0.35;

/** How much roughness the darkest finishes shed (shared across parts → the gap is preserved). */
const DARK_SHARPEN = 0.08;

/** 0 at/above the reference luminance, ramping to 1 at true black. */
export function darkBoost(luminance: number): number {
	const t = (DARK_REFERENCE_LUMINANCE - luminance) / DARK_REFERENCE_LUMINANCE;
	return Math.min(Math.max(t, 0), 1);
}

/**
 * Per-part signatures. Roughness at light finishes is ordered slickest → roughest so the
 * wheel (a smooth moulded acrylic dish) reads slicker than the touch ring, which reads
 * slicker than the brushed anodized face. The gaps are ≥ SEPARATION_EPSILON and, because
 * every part sheds the same DARK_SHARPEN on darks, stay ≥ SEPARATION_EPSILON at every
 * luminance. `envLift` is how much env response the part gains as the finish → black.
 */
interface PartSignature {
	metalness: number;
	roughLight: number;
	clearcoat: number;
	clearcoatRoughness: number;
	envBase: number;
	envLift: number;
}

const SIGNATURES: Record<FinishPart, PartSignature> = {
	// Anodized aluminium front panel — the roughest of the three specular parts (brushed).
	face: { metalness: 0.08, roughLight: 0.52, clearcoat: 0.1, clearcoatRoughness: 0.5, envBase: 0.22, envLift: 0.55 },
	// Touch ring — a smooth moulded panel, slicker than the face, with a thin clearcoat sheen.
	ring: { metalness: 0.0, roughLight: 0.44, clearcoat: 0.15, clearcoatRoughness: 0.6, envBase: 0.26, envLift: 0.65 },
	// Select button / wheel dish — the slickest part, a discrete moulded disc that catches most.
	wheel: { metalness: 0.0, roughLight: 0.36, clearcoat: 0.22, clearcoatRoughness: 0.5, envBase: 0.3, envLift: 0.75 },
	// Screen-printed glyph ink — diffuse, near-matte; holds a contrast floor, not a highlight.
	glyphs: { metalness: 0.0, roughLight: 0.8, clearcoat: 0.0, clearcoatRoughness: 1.0, envBase: 0.2, envLift: 0.3 },
};

/** Resolve one part's material params for a finish hex — the pure per-part table lookup. */
export function resolveFinishMaterial(finishHex: string, part: FinishPart): PartMaterialParams {
	const sig = SIGNATURES[part];
	const boost = darkBoost(relativeLuminance(finishHex));
	return {
		metalness: sig.metalness,
		// Sharpen on darks so the slick plastic catches the env; never below a hair of tooth.
		roughness: Math.max(sig.roughLight - boost * DARK_SHARPEN, 0.02),
		clearcoat: sig.clearcoat,
		clearcoatRoughness: sig.clearcoatRoughness,
		// Lift env response as the finish darkens so every part clears the floor with margin.
		envMapIntensity: sig.envBase + boost * sig.envLift,
	};
}

/** Resolve the full per-part table for a finish hex in one call (what §3.2 wiring reads). */
export function resolveFinishTable(finishHex: string): Record<FinishPart, PartMaterialParams> {
	return {
		face: resolveFinishMaterial(finishHex, "face"),
		ring: resolveFinishMaterial(finishHex, "ring"),
		wheel: resolveFinishMaterial(finishHex, "wheel"),
		glyphs: resolveFinishMaterial(finishHex, "glyphs"),
	};
}

/** The specular-separation ordering, slickest → roughest, that the invariant preserves. */
export const SEPARATION_ORDER: readonly FinishPart[] = ["wheel", "ring", "face"] as const;
