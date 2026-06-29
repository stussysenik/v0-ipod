/**
 * Deterministic control-token solver — `UI = f(state)` applied to color.
 *
 * Studio control colors are a *pure function* of the active stage background color.
 * The same stage color always yields the same control palette (snapshot-stable), and
 * every token is guaranteed to clear a contrast floor against the surface it sits on,
 * for any stage the user picks. This is the keystone of the precision-instrument
 * control language: chrome that stays legible and consistent on a user-colorable stage.
 *
 * Color authority: the contrast model is WCAG 2.x relative-luminance contrast (the same
 * math dcal arbitrates with). The neutral ramp and the single accent hue are *fixed*;
 * the solver only resolves lightness/contrast relationships — so a solved palette reads
 * intentional, never mechanical (design decision §4).
 */

export interface ControlTokens {
	/** Resting control surface — stage-tinted neutral, elevated chrome. */
	surface: string;
	/** Subtle resting border on `surface`. */
	hairline: string;
	/** Primary label/value text on `surface` (≥ 4.5:1). */
	label: string;
	/** The single accent — selection fill, focus ring, active chip (≥ 3:1 on surface). */
	accent: string;
	/** Selected solid fill (= accent): real affordance, not a border swap. */
	selectedFill: string;
	/** Label on `selectedFill` (≥ 4.5:1). */
	selectedLabel: string;
	/** Focus ring (= accent). */
	focusRing: string;
}

/** WCAG AA normal-text contrast floor for label/value text. */
export const TEXT_CONTRAST_FLOOR = 4.5;
/** WCAG non-text (UI component) contrast floor for accent / focus ring. */
export const UI_CONTRAST_FLOOR = 3;

// Fixed neutral ramp endpoints (sRGB tone, 0..1) — solve toward these, never past.
export const ANCHOR_TONE_LIGHT = 0.97;
export const ANCHOR_TONE_DARK = 0.17;
// Surface starts as glass: mostly stage, lightly neutralized, so chrome reads as tinted
// by the stage it sits on. The solver pushes further toward the anchor only when the
// text floor isn't met — the mid-luminance fallback (shade away from the stage).
export const SURFACE_BASE_TINT = 0.22;
const SURFACE_TINT_STEP = 0.04;
// Fixed inks. Near-black / near-white, slightly cool to sit with the brand accent.
const INK_DARK = "#10141A";
const INK_LIGHT = "#F4F6F8";
// The single accent hue (HSL). Derived from the canonical brand stage blue #0048FF.
const ACCENT_HUE = 223 / 360;
const ACCENT_SAT = 1;
const ACCENT_BASE_LIGHTNESS = 0.5;

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
	const v = Number.parseInt(hex.replace("#", ""), 16);
	return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function toHex([r, g, b]: Rgb): string {
	const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
	return `#${((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1).toUpperCase()}`;
}

/** WCAG relative luminance from sRGB. */
function luminance([r, g, b]: Rgb): number {
	const lin = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two hex colors (≥ 1). */
export function contrastRatio(a: string, b: string): number {
	const la = luminance(parseHex(a));
	const lb = luminance(parseHex(b));
	const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

/** Linear sRGB channel mix of `from` toward `to` by `t` (0..1). */
function mix(from: Rgb, to: Rgb, t: number): Rgb {
	return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
}

function grey(tone: number): Rgb {
	const v = tone * 255;
	return [v, v, v];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
	const hue = (p: number, q: number, t: number): number => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}

/**
 * Resolve the single accent: fixed hue, lightness solved so it clears `floor` against
 * `surface` *and* can carry a legible label (so `selectedFill` is always labelable). We
 * search away from the brand lightness in the direction that gains surface contrast
 * (deeper on light surfaces, brighter on dark) — "one accent", solved.
 */
function solveAccent(surface: string, surfaceIsLight: boolean, floor: number): string {
	const step = surfaceIsLight ? -0.02 : 0.02;
	let l = ACCENT_BASE_LIGHTNESS;
	let last = toHex(hslToRgb(ACCENT_HUE, ACCENT_SAT, l));
	for (let i = 0; i < 48; i++) {
		const candidate = toHex(hslToRgb(ACCENT_HUE, ACCENT_SAT, l));
		last = candidate;
		const labelable = bestContrast(candidate) >= TEXT_CONTRAST_FLOOR;
		if (contrastRatio(candidate, surface) >= floor && labelable) return candidate;
		const next = Math.max(0, Math.min(1, l + step));
		if (next === l) break;
		l = next;
	}
	return last;
}

/** Best achievable contrast of either fixed ink on `bg`. */
function bestContrast(bg: string): number {
	return Math.max(contrastRatio(INK_LIGHT, bg), contrastRatio(INK_DARK, bg));
}

/** Pick the ink (near-black/near-white) with the most contrast on `bg`. */
function bestInk(bg: string): string {
	return contrastRatio(INK_LIGHT, bg) >= contrastRatio(INK_DARK, bg) ? INK_LIGHT : INK_DARK;
}

/**
 * Solve the full control token set from the active stage background color.
 *
 * Surface is the stage tinted toward a fixed neutral anchor (harmonized "tinted glass").
 * If the primary ink can't clear the text floor on that surface — the mid-luminance
 * case — the solver shades/tints the surface further *away* from the stage toward the
 * anchor until it clears, rather than only swapping ink color (spec fallback).
 */
export function solveControlTokens(stageBackground: string): ControlTokens {
	const stage = parseHex(stageBackground);
	const isLight = luminance(stage) >= 0.5;
	const anchorTone = isLight ? ANCHOR_TONE_LIGHT : ANCHOR_TONE_DARK;
	const anchor = grey(anchorTone);
	const ink = isLight ? INK_DARK : INK_LIGHT;

	// Surface: start subtly stage-tinted; push toward the neutral anchor until the
	// primary ink clears the text floor. Terminates at the anchor, which clears by
	// construction (near-black on #F7F7F7 ≈ 18:1; near-white on #2B2B2B ≈ 13:1).
	let surface = toHex(anchor);
	for (let tint = SURFACE_BASE_TINT; tint <= 1.0001; tint += SURFACE_TINT_STEP) {
		surface = toHex(mix(stage, anchor, Math.min(tint, 1)));
		if (contrastRatio(ink, surface) >= TEXT_CONTRAST_FLOOR) break;
	}

	const label = ink;
	const hairline = toHex(mix(parseHex(surface), parseHex(label), isLight ? 0.16 : 0.22));
	const accent = solveAccent(surface, isLight, UI_CONTRAST_FLOOR);
	const selectedFill = accent;
	const selectedLabel = bestInk(accent);
	const focusRing = accent;

	return { surface, hairline, label, accent, selectedFill, selectedLabel, focusRing };
}

/** CSS custom-property map for the solved tokens (consumed via `style={...}`). */
export function controlTokenVars(tokens: ControlTokens): Record<string, string> {
	return {
		"--studio-surface": tokens.surface,
		"--studio-hairline": tokens.hairline,
		"--studio-label": tokens.label,
		"--studio-accent": tokens.accent,
		"--studio-selected-fill": tokens.selectedFill,
		"--studio-selected-label": tokens.selectedLabel,
		"--studio-focus-ring": tokens.focusRing,
	};
}
