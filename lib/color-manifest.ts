import manifestData from "@/scripts/color-manifest.json";

export interface AuthenticCaseColor {
  label: string;
  hex: string;
  family: string;
  generation: string;
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
