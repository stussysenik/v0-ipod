import manifestData from "@/scripts/color-manifest.json";

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
	curatedFavorites: {
		case: ManifestFavorite[];
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

// iPod Classic 6th Generation Colors
// Based on reference image: Silver & Black variants
export const DEFAULT_SHELL_COLOR = "#F2F2F2"; // White iPod case — 1st gen light theme
export const DEFAULT_BACKDROP_COLOR = "#FFFFFF"; // Stage background

// Authentic iPod 6G colors
export const IPOD_6G_BLACK = "#1b1818"; // Black case — warm undertone
export const IPOD_6G_SILVER = "#C8C9CB"; // Silver case
export const IPOD_6G_BACKGROUND = "#FFFFFF"; // White background

// Click wheel colors
export const WHEEL_DARK_SURFACE = "#1c1a1b"; // Black iPod wheel — warm
export const WHEEL_DARK_LABEL = "#FFFFFF"; // Black iPod labels
export const WHEEL_LIGHT_SURFACE = "#F5F5F7"; // Silver iPod wheel
export const WHEEL_LIGHT_LABEL = "#8E8E93"; // Silver iPod labels

export const CASE_OKLCH_CONFIG = colorManifest.oklchPalettes.case;
export const BACKGROUND_OKLCH_CONFIG = colorManifest.oklchPalettes.background;

export const CASE_CURATED_FAVORITES = colorManifest.curatedFavorites.case.map((favorite) => ({
	label: favorite.label,
	value: favorite.hex,
}));

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

/*
 * Measured wheel colorways ported as data from the `moonbit-version` branch
 * (`ipod/color.mbt`, silver-assembly work). That branch shares no git history
 * with this repo, so its knowledge crosses over as constants — never a merge.
 * These are the authentic molded-plastic colors, banded by case luminance;
 * `deriveWheelColors` above remains the continuous derivation for arbitrary
 * case colors, and these anchors let tests pin the authentic finishes.
 */
export const WHEEL_LUMINANCE_BANDS = {
	/** below this relative luminance: authentic 6G black wheel shader */
	dark: 0.18,
	/** below this (and above `dark`): charcoal/gunmetal wheel */
	mid: 0.45,
} as const;

export const WHEEL_COLORWAY_DARK: DerivedWheelColors = {
	gradient: { from: "#1C1C1E", via: "#202022", to: "#252527" },
	border: "#2C2C2E",
	labelColor: "#FFFFFF",
	centerBorder: "#3A3A3C",
	centerGradient: { from: "#1C1C1E", via: "#202022", to: "#252527" },
};

export const WHEEL_COLORWAY_MID: DerivedWheelColors = {
	gradient: { from: "#4A4A4E", via: "#424246", to: "#3A3A3E" },
	border: "#555558",
	labelColor: "#E0E0E0",
	centerBorder: "#505054",
	centerGradient: { from: "#4E4E52", via: "#46464A", to: "#3E3E42" },
};

/** iPod 6G Silver assembly — the light-case wheel colorway. */
export const WHEEL_COLORWAY_LIGHT: DerivedWheelColors = {
	gradient: { from: "#F5F5F7", via: "#E8E8EA", to: "#DCDCDC" },
	border: "#D1D1D6",
	labelColor: "#8E8E93",
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
 * Approximate relative luminance from hex (sRGB linearized).
 */
export function relativeLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

	// Labels: white for dark wheels, dark grey for light wheels
	const labelColor =
		wheelMidL < 0.38 ? "#FFFFFF" : wheelMidL < 0.6 ? "#B0B0B0" : "#787880";

	return {
		gradient: {
			from: hslToHex(h, s, wheelTopL),
			via: hslToHex(h, s, wheelMidL),
			to: hslToHex(h, s, wheelBottomL),
		},
		border: hslToHex(h, s * 0.7, borderL),
		labelColor,
		centerBorder: hslToHex(h, s * 0.7, centerBorderL),
		centerGradient: {
			from: hslToHex(h, s, centerTopL),
			via: hslToHex(h, s, centerMidL),
			to: hslToHex(h, s, centerBottomL),
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
