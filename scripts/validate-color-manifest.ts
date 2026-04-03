/**
 * Color Manifest Validator
 *
 * Validates the canonical color manifest against:
 * 1. Structural integrity (all tokens present, hex format valid)
 * 2. WCAG 2.1 contrast ratios (AA and AA-large)
 * 3. Perceptual distance rules (deltaE approximation using CIE76)
 *
 * For authoritative CIEDE2000 analysis, use dcal-audit.
 *
 * Usage: npx tsx scripts/validate-color-manifest.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ── Hex parsing ──

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

function parseHex(hex: string): [number, number, number] {
  const match = hex.match(HEX_RE);
  if (!match) throw new Error(`Invalid hex color: ${hex}`);
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// ── sRGB linearization (IEC 61966-2-1) ──

function sRGBLinearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// ── Relative luminance (WCAG 2.1) ──

function relativeLuminance(hex: string, opacity = 1): number {
  const [r, g, b] = parseHex(hex);
  const L = 0.2126 * sRGBLinearize(r) + 0.7152 * sRGBLinearize(g) + 0.0722 * sRGBLinearize(b);
  // For semi-transparent foreground on white (#FFFFFF, L=1)
  if (opacity < 1) {
    return L * opacity + 1 * (1 - opacity);
  }
  return L;
}

// ── Contrast ratio (WCAG 2.1) ──

function contrastRatio(hex1: string, hex2: string, opacity1 = 1): number {
  const L1 = relativeLuminance(hex1, opacity1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── CIE XYZ conversion (D65 illuminant) ──

function srgbToXyz(hex: string): [number, number, number] {
  const [r, g, b] = parseHex(hex);
  const rl = sRGBLinearize(r);
  const gl = sRGBLinearize(g);
  const bl = sRGBLinearize(b);
  // sRGB to XYZ matrix (D65)
  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
  return [x, y, z];
}

// ── CIE Lab conversion (D65 reference white) ──

const D65_WHITE: [number, number, number] = [0.95047, 1.0, 1.08883];

function xyzToLab(xyz: [number, number, number]): [number, number, number] {
  const [x, y, z] = xyz;
  const [xn, yn, zn] = D65_WHITE;

  const f = (t: number): number => {
    const delta = 6 / 29;
    return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
  };

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b];
}

function hexToLab(hex: string): [number, number, number] {
  return xyzToLab(srgbToXyz(hex));
}

// ── CIE76 deltaE (simple Euclidean) ──
// Note: For authoritative CIEDE2000, use dcal-audit

function deltaE76(hex1: string, hex2: string): number {
  const [L1, a1, b1] = hexToLab(hex1);
  const [L2, a2, b2] = hexToLab(hex2);
  return Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

// ── Manifest types ──

interface ContrastPair {
  description: string;
  fg: string;
  bg: string;
  minRatio: number;
  level: string;
}

interface PerceptualRule {
  description: string;
  a: string;
  b: string;
  metric: string;
  minValue?: number;
  maxValue?: number;
}

interface SurfaceToken {
  hex: string;
  role: string;
  family: string;
}

interface TextToken {
  hex: string;
  role: string;
  against: string;
  opacity?: number;
}

interface Manifest {
  authenticCaseColors: Array<{ label: string; hex: string; family: string; generation: string }>;
  surfaceTokens: Record<string, SurfaceToken>;
  textTokens: Record<string, TextToken>;
  relationships: {
    contrastPairs: ContrastPair[];
    perceptualRules: PerceptualRule[];
    greyRampRules: {
      adjacentStopMinDeltaE00: number;
      undertoneVsNeutralMinDeltaE00: number;
      undertoneVsNeutralMaxDeltaE00: number;
      authenticCaseMaxDeltaE00FromReference: number;
    };
  };
}

// ── Validation ──

interface ValidationResult {
  pass: boolean;
  category: string;
  description: string;
  actual: string;
  threshold: string;
}

function validateManifest(manifest: Manifest): ValidationResult[] {
  const results: ValidationResult[] = [];

  // 1. Structural: Validate all hex values
  for (const [key, token] of Object.entries(manifest.surfaceTokens)) {
    const valid = HEX_RE.test(token.hex);
    results.push({
      pass: valid,
      category: "structure",
      description: `Surface token ${key} has valid hex`,
      actual: token.hex,
      threshold: "valid #RRGGBB",
    });
  }

  for (const [key, token] of Object.entries(manifest.textTokens)) {
    const valid = HEX_RE.test(token.hex);
    results.push({
      pass: valid,
      category: "structure",
      description: `Text token ${key} has valid hex`,
      actual: token.hex,
      threshold: "valid #RRGGBB",
    });
  }

  for (const color of manifest.authenticCaseColors) {
    const valid = HEX_RE.test(color.hex);
    results.push({
      pass: valid,
      category: "structure",
      description: `Authentic case color "${color.label}" has valid hex`,
      actual: color.hex,
      threshold: "valid #RRGGBB",
    });
  }

  // 2. Contrast: WCAG 2.1 contrast ratios
  for (const pair of manifest.relationships.contrastPairs) {
    // Look up fg in both text and surface tokens
    const fgToken = manifest.textTokens[pair.fg] ?? manifest.surfaceTokens[pair.fg];
    const bgToken = manifest.surfaceTokens[pair.bg] ?? manifest.textTokens[pair.bg];

    if (!fgToken || !bgToken) {
      results.push({
        pass: false,
        category: "contrast",
        description: pair.description,
        actual: `Missing token: fg=${pair.fg} bg=${pair.bg}`,
        threshold: `>= ${pair.minRatio}:1`,
      });
      continue;
    }

    const opacity = "opacity" in fgToken ? (fgToken as TextToken).opacity : undefined;
    const ratio = contrastRatio(fgToken.hex, bgToken.hex, opacity);
    const pass = ratio >= pair.minRatio;

    results.push({
      pass,
      category: "contrast",
      description: `${pair.description} (${pair.level})`,
      actual: `${ratio.toFixed(2)}:1`,
      threshold: `>= ${pair.minRatio}:1`,
    });
  }

  // 3. Perceptual: deltaE and contrast rules between surfaces
  for (const rule of manifest.relationships.perceptualRules) {
    const tokenA = manifest.surfaceTokens[rule.a];
    const tokenB = manifest.surfaceTokens[rule.b];

    if (!tokenA || !tokenB) {
      results.push({
        pass: false,
        category: "perceptual",
        description: rule.description,
        actual: `Missing token: a=${rule.a} b=${rule.b}`,
        threshold: rule.minValue ? `>= ${rule.minValue}` : `<= ${rule.maxValue}`,
      });
      continue;
    }

    if (rule.metric === "deltaE00") {
      // Use CIE76 as approximation; dcal-audit provides authoritative CIEDE2000
      const dE = deltaE76(tokenA.hex, tokenB.hex);
      let pass: boolean;
      let threshold: string;

      if (rule.minValue !== undefined) {
        pass = dE >= rule.minValue;
        threshold = `dE76 >= ${rule.minValue}`;
      } else if (rule.maxValue !== undefined) {
        pass = dE <= rule.maxValue;
        threshold = `dE76 <= ${rule.maxValue}`;
      } else {
        pass = true;
        threshold = "no threshold";
      }

      results.push({
        pass,
        category: "perceptual",
        description: `${rule.description} (CIE76 approx, dcal-audit for CIEDE2000)`,
        actual: `dE76 = ${dE.toFixed(2)}`,
        threshold,
      });
    } else if (rule.metric === "contrastRatio") {
      const ratio = contrastRatio(tokenA.hex, tokenB.hex);
      const pass = rule.minValue !== undefined ? ratio >= rule.minValue : true;

      results.push({
        pass,
        category: "perceptual",
        description: rule.description,
        actual: `${ratio.toFixed(2)}:1`,
        threshold: rule.minValue ? `>= ${rule.minValue}:1` : "no threshold",
      });
    }
  }

  return results;
}

// ── Main ──

function main() {
  const manifestPath = resolve(__dirname, "color-manifest.json");
  const raw = readFileSync(manifestPath, "utf-8");
  const manifest: Manifest = JSON.parse(raw);

  console.log("iPod Classic Color Manifest Validator");
  console.log("=====================================\n");

  const results = validateManifest(manifest);
  const failures = results.filter((r) => !r.pass);
  const passes = results.filter((r) => r.pass);

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catFails = catResults.filter((r) => !r.pass);

    console.log(`\n## ${cat.toUpperCase()} (${catResults.length - catFails.length}/${catResults.length} pass)`);
    console.log("─".repeat(60));

    for (const r of catResults) {
      const icon = r.pass ? "  PASS" : "  FAIL";
      console.log(`${icon}  ${r.description}`);
      if (!r.pass) {
        console.log(`        actual: ${r.actual}`);
        console.log(`        threshold: ${r.threshold}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL: ${passes.length}/${results.length} pass, ${failures.length} fail`);

  if (failures.length > 0) {
    console.log("\nNote: CIE76 is used as an approximation.");
    console.log("Run dcal-audit for authoritative CIEDE2000 analysis.");
    process.exit(1);
  } else {
    console.log("\nAll color validation checks passed.");
    process.exit(0);
  }
}

main();
