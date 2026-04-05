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
  return Array.from(groups.entries()).map(([generation, finishes]) => ({
    generation,
    finishes,
  }));
}

export const DEFAULT_SHELL_COLOR = colorManifest.surfaceTokens["shell.default"].hex;
export const DEFAULT_BACKDROP_COLOR = colorManifest.surfaceTokens["backdrop.default"].hex;

export const CASE_OKLCH_CONFIG = colorManifest.oklchPalettes.case;
export const BACKGROUND_OKLCH_CONFIG = colorManifest.oklchPalettes.background;

export const CASE_CURATED_FAVORITES = colorManifest.curatedFavorites.case.map(
  (favorite) => ({
    label: favorite.label,
    value: favorite.hex,
  }),
);

export const BACKGROUND_CURATED_FAVORITES = colorManifest.curatedFavorites.background.map(
  (favorite) => ({
    label: favorite.label,
    value: favorite.hex,
  }),
);

export function getSurfaceToken(
  name: keyof ColorManifest["surfaceTokens"] | string,
): string {
  return colorManifest.surfaceTokens[name].hex;
}

export function getTextToken(
  name: keyof ColorManifest["textTokens"] | string,
): TextToken {
  return colorManifest.textTokens[name];
}

export function getTextTokenCss(
  name: keyof ColorManifest["textTokens"] | string,
): string {
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

/**
 * Approximate relative luminance from hex (sRGB linearized).
 * Used as a stand-in for OKLCH lightness — sufficient for the dark/light
 * threshold we need (L < 0.45 = dark wheel).
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface DerivedWheelColors {
  gradient: { from: string; via: string; to: string };
  border: string;
  labelColor: string;
  centerBorder: string;
  centerGradient: { from: string; via: string; to: string };
}

/**
 * Derive click-wheel colors from a case/shell hex color.
 * Dark cases (L < 0.45) get a dark wheel with white labels.
 * Light cases get the default light wheel with grey labels.
 */
export function deriveWheelColors(caseHex: string): DerivedWheelColors {
  const L = relativeLuminance(caseHex);

  if (L < 0.18) {
    // Dark case — black wheel, white labels
    return {
      gradient: { from: "#2A2A2C", via: "#232325", to: "#1C1C1E" },
      border: "#3A3A3C",
      labelColor: "#FFFFFF",
      centerBorder: "#3A3A3C",
      centerGradient: { from: "#2E2E30", via: "#272729", to: "#202022" },
    };
  }

  if (L < 0.45) {
    // Mid-dark (charcoal/gunmetal) — darker wheel, light labels
    return {
      gradient: { from: "#4A4A4E", via: "#424246", to: "#3A3A3E" },
      border: "#555558",
      labelColor: "#E0E0E0",
      centerBorder: "#505054",
      centerGradient: { from: "#4E4E52", via: "#46464A", to: "#3E3E42" },
    };
  }

  // Light case — default light wheel with grey labels (matches existing tokens)
  return {
    gradient: {
      from: getSurfaceToken("wheel.gradient.from"),
      via: getSurfaceToken("wheel.gradient.via"),
      to: getSurfaceToken("wheel.gradient.to"),
    },
    border: getSurfaceToken("wheel.border"),
    labelColor: getSurfaceToken("wheel.label"),
    centerBorder: getSurfaceToken("wheel.center.border"),
    centerGradient: {
      from: getSurfaceToken("wheel.center.from"),
      via: getSurfaceToken("wheel.center.via"),
      to: getSurfaceToken("wheel.center.to"),
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

  // Dark case — slightly lighter surround so it doesn't merge with case
  return {
    top: "#1A1A1C",
    mid: "#222224",
    bottom: "#121214",
  };
}
