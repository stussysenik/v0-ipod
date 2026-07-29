import manifestData from "@/scripts/color-manifest.json";

import { contrastRatio, relativeLuminance } from "./color-engine";
import { hexToLab, labToHexClamped } from "./color-proximity";

export interface AuthenticCaseColor {
	label: string;
	hex: string;
	family: string;
	generation: string;
}

export interface AuthenticFinish {
	id: string;
	label: string;
	generation: string;
	year: number;
	hex: string;
	wheelVariant: "light" | "dark";
	notes: string;
}

/**
 * Physical construction of the case front — drives the PBR parameter set:
 * - `polycarbonate`: 1G–5G/U2 era. Dielectric plastic, glossy clearcoat, no brush.
 * - `anodized-aluminum`: 6G/7G/RED. Dyed metal, low metalness, brushed roughness.
 * (The polished-steel back is shared by every generation; it is not a finish.)
 */
export type FinishMaterialClass = "polycarbonate" | "anodized-aluminum";

/**
 * Construction history, encoded: Apple switched the Classic line from
 * polycarbonate fronts to anodized aluminum with the 6G (2007). The U2
 * edition was 4G/5G-era polycarbonate; (PRODUCT)RED is anodized.
 */
const MATERIAL_CLASS_BY_FINISH_ID: Record<string, FinishMaterialClass> = {
	"white-1g": "polycarbonate",
	"white-4g": "polycarbonate",
	"white-5g": "polycarbonate",
	"black-5g": "polycarbonate",
	"u2-special": "polycarbonate",
	"silver-6g": "anodized-aluminum",
	"black-6g": "anodized-aluminum",
	"charcoal-7g": "anodized-aluminum",
	"black-7g": "anodized-aluminum",
	"product-red": "anodized-aluminum",
};

export function getFinishMaterialClass(finishId: string): FinishMaterialClass {
	return MATERIAL_CLASS_BY_FINISH_ID[finishId] ?? "anodized-aluminum";
}

export interface SurfaceToken {
	hex: string;
	role: string;
	family: string;
}

export interface TextToken {
	hex: string;
	role: string;
	against: string;
	opacity?: number;
}

export interface GreyFamilyDefinition {
	label: string;
	oklchHue: number;
	oklchChroma: number;
	description: string;
}

export interface OklchPaletteDefinition {
	lightness: number;
	chroma: number;
	steps: number;
	hueOffset: number;
}

export interface ManifestFavorite {
	label: string;
	hex: string;
}

export interface ColorManifest {
	authenticCaseColors: AuthenticCaseColor[];
	authenticFinishes: AuthenticFinish[];
	surfaceTokens: Record<string, SurfaceToken>;
	textTokens: Record<string, TextToken>;
	greyFamilies: Record<string, GreyFamilyDefinition>;
	greyLightnessStops: number[];
	oklchPalettes: {
		case: OklchPaletteDefinition;
		background: OklchPaletteDefinition;
	};
	/**
	 * Backdrop favourites only. Case favourites are house colours and live with
	 * the other house colours in `lib/case-color-presets.ts` — the manifest
	 * attests hardware, and a house colour has nothing to attest.
	 */
	curatedFavorites: {
		background: ManifestFavorite[];
	};
}

export const colorManifest = manifestData as ColorManifest;

export const AUTHENTIC_CASE_COLORS = colorManifest.authenticCaseColors.map((color) => ({
	...color,
	value: color.hex,
}));

export interface AuthenticFinishGroup {
	generation: string;
	finishes: (AuthenticFinish & { value: string })[];
}

/**
 * Return authentic iPod finishes grouped by generation for the case color picker.
 * Each group has a generation label and an array of finishes with `value` (= hex).
 */
export function getAuthenticFinishes(): AuthenticFinishGroup[] {
	const groups = new Map<string, (AuthenticFinish & { value: string })[]>();
	for (const finish of colorManifest.authenticFinishes) {
		const existing = groups.get(finish.generation) ?? [];
		existing.push({ ...finish, value: finish.hex });
		groups.set(finish.generation, existing);
	}
	return [...groups.entries()].map(([generation, finishes]) => ({
		generation,
		finishes,
	}));
}

/**
 * Named case colours.
 *
 * A constant naming a generation must carry that generation's attested hex, or
 * the name is a claim the value cannot support. `finishHex` reads it from
 * `authenticFinishes` so the two cannot drift: a renamed or removed finish is a
 * load-time throw, not a wrong pixel.
 *
 * `DEFAULT_SHELL_COLOR` is deliberately not one of these. It is the app's
 * neutral starting shell, not a shipped finish, and it says so.
 */
function finishHex(id: string): string {
	const finish = colorManifest.authenticFinishes.find((f) => f.id === id);
	if (!finish) throw new Error(`color-manifest: no attested finish "${id}"`);
	return finish.hex;
}

/** Neutral starting shell. Not attested — the nearest finish is white-4g at ΔE00 1.5. */
export const DEFAULT_SHELL_COLOR = "#F2F2F2";
export const DEFAULT_BACKDROP_COLOR = "#FFFFFF"; // Stage background

/** iPod 5G Black, 2005 — the first black iPod. Warm undertone. */
export const IPOD_5G_BLACK = finishHex("black-5g");
/** iPod Classic 6G Silver, 2007 — anodized aluminium front. */
export const IPOD_6G_SILVER = finishHex("silver-6g");

export const CASE_OKLCH_CONFIG = colorManifest.oklchPalettes.case;
export const BACKGROUND_OKLCH_CONFIG = colorManifest.oklchPalettes.background;

export const BACKGROUND_CURATED_FAVORITES = colorManifest.curatedFavorites.background.map(
	(favorite) => ({
		label: favorite.label,
		value: favorite.hex,
	}),
);

export function getSurfaceToken(name: keyof ColorManifest["surfaceTokens"] | string): string {
	const token = colorManifest.surfaceTokens[name];
	if (!token) {
		console.warn(`[color-manifest] Missing surface token: "${name}"`);
		return "#808080"; // Fallback grey
	}
	return token.hex;
}

export function getTextToken(name: keyof ColorManifest["textTokens"] | string): TextToken {
	return colorManifest.textTokens[name];
}

export function getTextTokenCss(name: keyof ColorManifest["textTokens"] | string): string {
	const token = getTextToken(name);
	if (token.opacity === undefined || token.opacity >= 1) {
		return token.hex;
	}

	const [r, g, b] = hexToRgb(token.hex);
	return `rgba(${r}, ${g}, ${b}, ${token.opacity})`;
}

function hexToRgb(hex: string): [number, number, number] {
	const normalized = hex.replace("#", "");
	const value = Number.parseInt(normalized, 16);
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const rf = r / 255;
	const gf = g / 255;
	const bf = b / 255;
	const max = Math.max(rf, gf, bf);
	const min = Math.min(rf, gf, bf);
	const d = max - min;
	let h = 0;
	const l = (max + min) / 2;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

	if (d !== 0) {
		switch (max) {
			case rf:
				h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
				break;
			case gf:
				h = ((bf - rf) / d + 2) / 6;
				break;
			case bf:
				h = ((rf - gf) / d + 4) / 6;
				break;
		}
	}

	return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number): number => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
	const g = Math.round(hue2rgb(p, q, h) * 255);
	const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface DerivedWheelColors {
	gradient: { from: string; via: string; to: string };
	border: string;
	labelColor: string;
	centerBorder: string;
	centerGradient: { from: string; via: string; to: string };
}

/** WCAG AA-large. The floor the manifest sets for wheel labels on wheel surface. */
export const WHEEL_LABEL_CONTRAST_FLOOR = 3;

/**
 * The tone a wheel label starts from before the floor is applied.
 *
 * White on a dark wheel is a measurement — the silkscreen is opaque white ink.
 * `#8E8E93` on a light wheel is not: it is Apple's `systemGray`, carried in from
 * the iOS palette, and nothing in the manifest sources it to hardware. It is
 * kept as the anchor because it is the right *character* for the silver wheel's
 * grey silkscreen, and it is only ever a starting point — see `solveWheelLabel`.
 */
export const WHEEL_LABEL_ANCHOR = { dark: "#FFFFFF", light: "#8E8E93" } as const;

/**
 * Solve the wheel label tone against every surface it is drawn on.
 *
 * Starts at the authentic anchor and walks the tone away from the surface only
 * as far as the contrast floor requires, so a combination that already clears
 * the floor keeps its exact shipped value and only failing ones move.
 *
 * The floor is checked against all three gradient stops, not the midpoint. The
 * midpoint-only form this replaced passed every light case while the label was
 * illegible over the shadowed lower third: the derived silver wheel measured
 * 3.09:1 at `via` and 2.79:1 at `to`. A label that clears the floor at one point
 * on a surface it spans is not a label that clears the floor.
 *
 * Neutral by construction: the label is chrome, not a moulded part, so it takes
 * no pigment from the shell.
 */
export function solveWheelLabel(
	surfaces: readonly string[],
	wheelIsDark: boolean,
	/** Must be neutral — only its tone is read. Defaults to the band's anchor. */
	anchor: string = wheelIsDark ? WHEEL_LABEL_ANCHOR.dark : WHEEL_LABEL_ANCHOR.light,
): string {
	const anchorTone = hexToRgb(anchor)[0] / 255;
	const toneToHex = (t: number): string => {
		const v = Math.round(Math.max(0, Math.min(1, t)) * 255);
		return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
	};
	const clears = (candidate: string) =>
		surfaces.every((s) => contrastRatio(candidate, s) >= WHEEL_LABEL_CONTRAST_FLOOR);

	// Away from the surface: brighter on a dark wheel, darker on a light one.
	const step = wheelIsDark ? 0.02 : -0.02;
	let tone = anchorTone;
	for (let i = 0; i < 64; i += 1) {
		const candidate = toneToHex(tone);
		if (clears(candidate)) return candidate;
		const next = tone + step;
		if (next < 0 || next > 1) break;
		tone = next;
	}
	// Floor unreachable in that direction (a mid-luminance wheel): take whichever
	// extreme carries the most contrast rather than returning a failing tone.
	const worst = (candidate: string) => Math.min(...surfaces.map((s) => contrastRatio(candidate, s)));
	return worst("#FFFFFF") >= worst("#000000") ? "#FFFFFF" : "#000000";
}

/*
 * Measured wheel colorways ported as data from the `moonbit-version` branch
 * (`ipod/color.mbt`, silver-assembly work). That branch shares no git history
 * with this repo, so its knowledge crosses over as constants — never a merge.
 * These are the authentic molded-plastic colors, banded by case luminance;
 * `deriveWheelColors` above remains the continuous derivation for arbitrary
 * case colors, and these anchors let tests pin the authentic finishes.
 *
 * The moulded values are untouched. The label is not a moulding — it is solved
 * from the anchor against the colorway's own gradient, which is why the light
 * colorway ships `#7a7a7a` and not the `#8E8E93` anchor: the anchor measured
 * 2.38:1 over the wheel's lower third against a 3:1 floor the manifest sets for
 * itself. Both dark and mid colorways clear the floor at their anchor untouched.
 */
export const WHEEL_LUMINANCE_BANDS = {
	/** below this relative luminance: authentic 6G black wheel shader */
	dark: 0.18,
	/** below this (and above `dark`): charcoal/gunmetal wheel */
	mid: 0.45,
} as const;

const DARK_GRADIENT = { from: "#1C1C1E", via: "#202022", to: "#252527" } as const;
const MID_GRADIENT = { from: "#4A4A4E", via: "#424246", to: "#3A3A3E" } as const;
const LIGHT_GRADIENT = { from: "#F5F5F7", via: "#E8E8EA", to: "#DCDCDC" } as const;

const stopsOf = (g: { from: string; via: string; to: string }) => [g.from, g.via, g.to];

export const WHEEL_COLORWAY_DARK: DerivedWheelColors = {
	gradient: { ...DARK_GRADIENT },
	border: "#2C2C2E",
	labelColor: solveWheelLabel(stopsOf(DARK_GRADIENT), true),
	centerBorder: "#3A3A3C",
	centerGradient: { ...DARK_GRADIENT },
};

export const WHEEL_COLORWAY_MID: DerivedWheelColors = {
	gradient: { ...MID_GRADIENT },
	border: "#555558",
	// #E0E0E0 is the recorded charcoal-wheel silkscreen and clears the floor at
	// 6.68:1 untouched; it is passed as the anchor so the solver cannot round it
	// up to white for a floor it already meets.
	labelColor: solveWheelLabel(stopsOf(MID_GRADIENT), true, "#E0E0E0"),
	centerBorder: "#505054",
	centerGradient: { from: "#4E4E52", via: "#46464A", to: "#3E3E42" },
};

/** iPod 6G Silver assembly — the light-case wheel colorway. */
export const WHEEL_COLORWAY_LIGHT: DerivedWheelColors = {
	gradient: { ...LIGHT_GRADIENT },
	border: "#D1D1D6",
	labelColor: solveWheelLabel(stopsOf(LIGHT_GRADIENT), false),
	centerBorder: "#D1D1D6",
	centerGradient: { from: "#FFFFFF", via: "#F0F0F2", to: "#E5E5EA" },
};

/** Pick the authentic banded wheel colorway for a case's relative luminance. */
export function wheelColorwayForLuminance(luminance: number): DerivedWheelColors {
	if (luminance < WHEEL_LUMINANCE_BANDS.dark) return WHEEL_COLORWAY_DARK;
	if (luminance < WHEEL_LUMINANCE_BANDS.mid) return WHEEL_COLORWAY_MID;
	return WHEEL_COLORWAY_LIGHT;
}

/**
 * WCAG relative luminance, re-exported from the single authority in
 * lib/color-engine.ts. Kept exported here because the manifest's own consumers
 * (`wheelColorwayForLuminance`, `finish-material-table`) read it as part of the
 * manifest's surface — but there is one implementation, not two.
 *
 * The question it answers here: how light is this case colour, so the wheel
 * colorway and the dark-albedo specular boost can respond to it.
 */
export { relativeLuminance };

/**
 * Derive click-wheel colors from the case/shell hex color.
 *
 * The wheel is the same material as the case, just recessed. It shares
 * the same hue and saturation — only lightness is adjusted to simulate
 * the physical recession where less light reaches the surface.
 *
 * Gradient models light hitting the top of the wheel and shadow pooling
 * at the bottom (consistent top-left studio key light).
 */
export function deriveWheelColors(caseHex: string): DerivedWheelColors {
	const [r, g, b] = hexToRgb(caseHex);
	const [h, s, caseL] = rgbToHsl(r, g, b);

	// The pigment, in the space where "same pigment" is a statement about two
	// numbers: chroma and hue. Lightness is the only thing recession changes.
	const caseLab = hexToLab(caseHex);
	const caseChroma = Math.sqrt(caseLab.a * caseLab.a + caseLab.b * caseLab.b);
	const caseHueRad = Math.atan2(caseLab.b, caseLab.a);

	/**
	 * Resolve one step of the lightness ladder while holding the pigment.
	 *
	 * The ladder itself is still computed in HSL, so the tuned offsets below keep
	 * their meaning. Only the *colour* is rebuilt: take the intended lightness the
	 * HSL step lands on, then restate it at the case's own chroma and hue. Holding
	 * HSL `s` instead — the previous behaviour — preserves a ratio rather than a
	 * chroma, so a light off-neutral shell produced a visibly more saturated wheel.
	 * Measured drift on the 5G white shell (#F5F5F0): ΔE00-undertone 4.86 before,
	 * under 0.1 after.
	 */
	const at = (targetL: number, chromaScale = 1): string => {
		const lStar = hexToLab(hslToHex(h, s, targetL)).l;
		const chroma = caseChroma * chromaScale;
		return labToHexClamped({
			l: lStar,
			a: chroma * Math.cos(caseHueRad),
			b: chroma * Math.sin(caseHueRad),
		});
	};

	// Wheel surface lightness: recessed surface catches ~8-12% less light.
	// Extremely dark cases (black anodized) need the wheel slightly lighter
	// so it doesn't merge into the void; very light cases need it darker.
	let wheelMidL: number;
	if (caseL < 0.1) {
		wheelMidL = caseL + 0.055;
	} else if (caseL < 0.3) {
		wheelMidL = caseL + 0.035;
	} else if (caseL < 0.5) {
		wheelMidL = caseL - 0.02;
	} else if (caseL < 0.75) {
		wheelMidL = caseL - 0.07;
	} else {
		wheelMidL = caseL - 0.1;
	}

	// Gradient: top catches ambient light (+2-3%), bottom pools shadow (-3-4%)
	const wheelTopL = Math.min(wheelMidL + 0.025, 1);
	const wheelBottomL = Math.max(wheelMidL - 0.035, 0);

	// Border: subtle transition, always mid-tone between case top and wheel edge
	const borderL = Math.max(wheelTopL - 0.015, 0.02);

	// Center button: same material, deeper recession (~5-7% darker than wheel)
	const centerMidL = Math.max(wheelMidL - 0.06, 0.015);
	const centerTopL = Math.min(centerMidL + 0.02, 1);
	const centerBottomL = Math.max(centerMidL - 0.03, 0);
	const centerBorderL = Math.min(centerTopL + 0.01, 1);

	const gradient = {
		from: at(wheelTopL),
		via: at(wheelMidL),
		to: at(wheelBottomL),
	};

	// Labels: white on dark wheels, grey on light ones — the authentic character.
	// The tone is then solved rather than fixed, because the three hardcoded values
	// this replaced did not clear the contrast floor the manifest itself sets for
	// them: on the derived silver wheel, #787880 on #A7A7A7 measured 1.82:1
	// against a 3:1 AA-large floor, i.e. the labels on the most-picked light case
	// were not legible. Solving keeps Apple's look and makes it readable.
	//
	// Solved against the whole gradient, not `via`. Against `via` alone every
	// light case passed at the midpoint and failed in the shadowed lower third
	// (silver: 3.09:1 at `via`, 2.79:1 at `to`) — the label spans the surface, so
	// the floor has to hold across it. Dark wheels are unaffected: white already
	// clears every stop, so no dark case moves.
	const labelColor = solveWheelLabel([gradient.from, gradient.via, gradient.to], wheelMidL < 0.38);

	return {
		gradient,
		border: at(borderL, 0.7),
		labelColor,
		centerBorder: at(centerBorderL, 0.7),
		centerGradient: {
			from: at(centerTopL),
			via: at(centerMidL),
			to: at(centerBottomL),
		},
	};
}

/**
 * Derive screen surround darkness from case color.
 * Dark cases get a slightly lighter surround for contrast;
 * Light cases keep the existing dark surround.
 */
export function deriveScreenSurround(caseHex: string): {
	top: string;
	mid: string;
	bottom: string;
} {
	const L = relativeLuminance(caseHex);

	if (L >= 0.45) {
		// Light case — default dark surround
		return {
			top: getSurfaceToken("screen.surround.top"),
			mid: getSurfaceToken("screen.surround.mid"),
			bottom: getSurfaceToken("screen.surround.bottom"),
		};
	}

	// Dark case — lighter surround matching progress bar visual weight
	return {
		top: "#5A5A5D",
		mid: "#6A6A6E",
		bottom: "#505054",
	};
}
