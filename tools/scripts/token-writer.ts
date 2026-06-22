/**
 * Figma → code token writer backing Phase 3 round-trip.
 *
 * Receives a TokenChange from the HMR plugin and writes the new value into
 * `app/globals.css` (for `:root` / `.dark` custom properties) or
 * `tailwind.config.ts` (for structural overrides). Every write is prefixed
 * with a `[figma-hmr]` blame marker so git blame can distinguish
 * Figma-originated edits from code-originated ones.
 *
 * The writer is debounced per-variable at 500ms. A slider drag that fires
 * twenty change events in 400ms coalesces into one file write containing
 * the final value.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const GLOBALS_CSS = resolve(REPO_ROOT, "app/globals.css");

const DEBOUNCE_MS = 500;
const BLAME_MARKER = "[figma-hmr]";

export interface TokenChange {
	collection: "Primitives" | "Semantic" | "Component";
	variableName: string; // e.g. "surface.primary"
	modeId: "light" | "dark";
	newValue: string; // hsl(...) or #rrggbb
}

const pending = new Map<string, { change: TokenChange; timer: ReturnType<typeof setTimeout> }>();

function cssCustomProperty(variableName: string): string {
	// "surface.primary" → "--surface-primary"
	return `--${variableName.replace(/\./g, "-")}`;
}

function applyToGlobalsCss(change: TokenChange): void {
	const css = readFileSync(GLOBALS_CSS, "utf8");
	const selector = change.modeId === "dark" ? "\\.dark" : ":root";
	const prop = cssCustomProperty(change.variableName);
	const blockRe = new RegExp(`(${selector}\\s*\\{[\\s\\S]*?)(\\})`);
	const match = css.match(blockRe);
	if (!match) {
		throw new Error(
			`[token-writer] could not locate ${change.modeId} block in app/globals.css`,
		);
	}
	const propRe = new RegExp(`(\\s+${prop.replace(/-/g, "\\-")}\\s*:\\s*)([^;]+)(;)`);
	const existing = match[1].match(propRe);
	if (!existing) {
		throw new Error(
			`[token-writer] variable ${prop} not found in ${change.modeId} block — aborting`,
		);
	}
	const nextBlock = match[1].replace(
		propRe,
		(_all, prefix, _current, suffix) =>
			`${prefix}${normalizeForCss(change.newValue)}${suffix} /* ${BLAME_MARKER} */`,
	);
	const nextCss = css.replace(blockRe, `${nextBlock}${match[2]}`);
	if (nextCss === css) {
		throw new Error(`[token-writer] write produced no change for ${prop}`);
	}
	writeFileSync(GLOBALS_CSS, nextCss, "utf8");
}

function normalizeForCss(value: string): string {
	// Figma may send either `#rrggbb`, `rgba(...)`, or `hsl(h s l)`. The file
	// stores bare `h s l` tuples (the `hsl(var(...))` wrap lives in tailwind).
	// Collapse `hsl(...)` wrappers but leave everything else verbatim.
	const hsl = value.match(/^hsl\((.+)\)$/i);
	if (hsl) return hsl[1];
	return value;
}

export async function writeTokenChange(change: TokenChange): Promise<void> {
	const key = `${change.collection}:${change.variableName}:${change.modeId}`;
	const existing = pending.get(key);
	if (existing) clearTimeout(existing.timer);
	return new Promise((resolveWrite, rejectWrite) => {
		const timer = setTimeout(() => {
			pending.delete(key);
			try {
				if (change.collection === "Component") {
					// Component tokens are owned by tailwind.config.ts, which we do not
					// mutate from the writer: rename-safety there is higher-value than
					// round-trip. Reject so the plugin surfaces an explanation.
					throw new Error(
						"[token-writer] Component tokens are not round-trip writable — open a PR against tailwind.config.ts",
					);
				}
				applyToGlobalsCss(change);
				resolveWrite();
			} catch (err) {
				rejectWrite(err);
			}
		}, DEBOUNCE_MS);
		pending.set(key, { change, timer });
	});
}
