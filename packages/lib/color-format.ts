/**
 * Multi-format colour parsing/formatting for the /3d colour controls.
 *
 * Every colour control in the studio stores a canonical `#RRGGBB` string, but a
 * designer pasting from Figma/CSS has a value in `rgb(...)` or `hsl(...)` just as
 * often as hex. This module is the one place those notations are understood:
 * `parseColor` accepts any of them and returns the canonical hex (or `null` so
 * the caller can reject bad input without mutating state); `formatColor` turns a
 * canonical hex back into a chosen notation for display.
 *
 * It is deliberately pure — no React, no three, no DOM — so it is trivially
 * unit-testable and safe to call inside a render. Canonical output matches
 * `normalizeHexColor` (uppercase `#RRGGBB`) so parsed values are interchangeable
 * with the rest of the colour pipeline.
 */

/** Clamp to an inclusive integer range. */
function clampInt(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round(value)));
}

function channelToHex(value: number): string {
	return clampInt(value, 0, 255).toString(16).padStart(2, "0");
}

/** Canonical `#RRGGBB`, uppercase — the one form the colour pipeline stores. */
export function toCanonicalHex(r: number, g: number, b: number): string {
	return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
}

function parseHex(input: string): string | null {
	const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
	if (!match) return null;
	let clean = match[1];
	if (clean.length === 3) {
		clean = clean
			.split("")
			.map((c) => c + c)
			.join("");
	}
	return `#${clean}`.toUpperCase();
}

function parseRgb(input: string): string | null {
	const match = /^rgba?\(\s*([^)]+?)\s*\)$/i.exec(input.trim());
	if (!match) return null;
	const parts = match[1].split(/[,\s/]+/).filter(Boolean);
	if (parts.length < 3) return null;
	const channels = parts.slice(0, 3).map((p) => {
		// Support percentage channels (rgb(50%, ...)) as well as 0–255.
		if (p.endsWith("%")) {
			const pct = Number.parseFloat(p);
			return Number.isFinite(pct) ? (pct / 100) * 255 : Number.NaN;
		}
		return Number.parseFloat(p);
	});
	if (channels.some((c) => !Number.isFinite(c) || c < 0 || c > 255)) return null;
	return toCanonicalHex(channels[0], channels[1], channels[2]);
}

/** h in [0,360), s/l in [0,1] → r,g,b in [0,255]. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const hp = (((h % 360) + 360) % 360) / 60;
	const x = c * (1 - Math.abs((hp % 2) - 1));
	let r = 0;
	let g = 0;
	let b = 0;
	if (hp < 1) [r, g, b] = [c, x, 0];
	else if (hp < 2) [r, g, b] = [x, c, 0];
	else if (hp < 3) [r, g, b] = [0, c, x];
	else if (hp < 4) [r, g, b] = [0, x, c];
	else if (hp < 5) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	const m = l - c / 2;
	return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** r,g,b in [0,255] → h in [0,360), s/l in [0,1]. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const rN = r / 255;
	const gN = g / 255;
	const bN = b / 255;
	const max = Math.max(rN, gN, bN);
	const min = Math.min(rN, gN, bN);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === rN) h = (gN - bN) / d + (gN < bN ? 6 : 0);
	else if (max === gN) h = (bN - rN) / d + 2;
	else h = (rN - gN) / d + 4;
	return [h * 60, s, l];
}

function parseHsl(input: string): string | null {
	const match = /^hsla?\(\s*([^)]+?)\s*\)$/i.exec(input.trim());
	if (!match) return null;
	const parts = match[1].split(/[,\s/]+/).filter(Boolean);
	if (parts.length < 3) return null;
	const h = Number.parseFloat(parts[0]);
	const s = Number.parseFloat(parts[1]);
	const l = Number.parseFloat(parts[2]);
	if (![h, s, l].every((n) => Number.isFinite(n))) return null;
	if (s < 0 || s > 100 || l < 0 || l > 100) return null;
	const [r, g, b] = hslToRgb(h, s / 100, l / 100);
	return toCanonicalHex(r, g, b);
}

/**
 * Parse hex (`#rgb` / `#rrggbb`), `rgb()`/`rgba()`, or `hsl()`/`hsla()` into a
 * canonical uppercase `#RRGGBB`. Returns `null` for anything unparseable so the
 * caller can reject bad input without mutating state.
 */
export function parseColor(input: string): string | null {
	if (typeof input !== "string") return null;
	const trimmed = input.trim();
	if (!trimmed) return null;
	const lower = trimmed.toLowerCase();
	if (lower.startsWith("rgb")) return parseRgb(trimmed);
	if (lower.startsWith("hsl")) return parseHsl(trimmed);
	return parseHex(trimmed);
}

export type ColorFormat = "hex" | "rgb" | "hsl";

function hexToChannels(hex: string): [number, number, number] | null {
	const canonical = parseHex(hex);
	if (!canonical) return null;
	const r = Number.parseInt(canonical.slice(1, 3), 16);
	const g = Number.parseInt(canonical.slice(3, 5), 16);
	const b = Number.parseInt(canonical.slice(5, 7), 16);
	return [r, g, b];
}

/**
 * Convert a canonical hex into the requested notation for display. Invalid hex
 * falls back to its own (best-effort) canonical form so callers always get a
 * string to show.
 */
export function formatColor(hex: string, format: ColorFormat): string {
	const channels = hexToChannels(hex);
	if (!channels) return hex;
	const [r, g, b] = channels;
	if (format === "rgb") return `rgb(${r}, ${g}, ${b})`;
	if (format === "hsl") {
		const [h, s, l] = rgbToHsl(r, g, b);
		return `hsl(${Math.round(h) % 360}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
	}
	return toCanonicalHex(r, g, b);
}
