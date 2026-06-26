/**
 * Theme tokens → CSS custom properties.
 *
 * The keep-out stage reads `--ipod-*` variables for color and type. A feed's theme
 * tokens are the *only* thing a white-label instance overrides, so the mapping from
 * token name to CSS variable must be deterministic and framework-neutral (this is
 * consumed by both the React stage and the Lit shadow root).
 */

import type { ThemeTokens } from "./schema";

/** Variable prefix. `accent` → `--ipod-accent`, `fontSans` → `--ipod-font-sans`. */
export const THEME_VAR_PREFIX = "--ipod-";

/** camelCase token name → kebab-case CSS variable tail. */
function tokenToVarName(token: string): string {
	const kebab = token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
	return `${THEME_VAR_PREFIX}${kebab}`;
}

/**
 * Convert theme tokens to a `{ "--ipod-accent": "#0048FF", … }` declaration map,
 * suitable to spread onto a React `style` prop or serialize into a `style` string.
 * Empty/whitespace values are dropped so a partial theme falls back to stage defaults.
 */
export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const [token, value] of Object.entries(theme)) {
		if (typeof value === "string" && value.trim() !== "") {
			vars[tokenToVarName(token)] = value;
		}
	}
	return vars;
}

/** Same mapping, serialized to an inline `style` attribute string (for Lit/SSR). */
export function themeToCssText(theme: ThemeTokens): string {
	return Object.entries(themeToCssVars(theme))
		.map(([name, value]) => `${name}: ${value};`)
		.join(" ");
}
