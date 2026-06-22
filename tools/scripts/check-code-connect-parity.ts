#!/usr/bin/env bun
/**
 * CI parity check: every in-scope component has a matching `.figma.tsx`
 * Code Connect mapping under `figma/code-connect/`. Prevents silent drift
 * when a new component lands without its mapping.
 */

import { readdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CODE_CONNECT_DIR = resolve(REPO_ROOT, "figma/code-connect");

const IN_SCOPE_COMPONENTS = [
	"components/ipod/ipod-classic.tsx",
	"components/ipod/ipod-device-shell.tsx",
	"components/ipod/ipod-screen.tsx",
	"components/ipod/click-wheel.tsx",
	"components/ipod/editable-text.tsx",
	"components/ipod/editable-duration.tsx",
	"components/ipod/editable-time.tsx",
	"components/ipod/editable-track-number.tsx",
	"components/ipod/progress-bar.tsx",
	"components/ipod/screen-battery.tsx",
	"components/ipod/star-rating.tsx",
	"components/ipod/hex-color-input.tsx",
	"components/ipod/grey-palette-picker.tsx",
	"components/ipod/revision-spec-card.tsx",
	"components/ui/marquee-text.tsx",
	"components/ui/icon-button.tsx",
	"components/ui/checkbox.tsx",
	"components/ui/carbon-checkbox.tsx",
	"components/ui/switch.tsx",
	"components/ui/theme-toggle.tsx",
	"components/build-version-badge.tsx",
] as const;

function mappingFor(componentPath: string): string {
	const slug = basename(componentPath).replace(".tsx", "");
	return resolve(CODE_CONNECT_DIR, `${slug}.figma.tsx`);
}

function main(): void {
	const errors: string[] = [];
	for (const component of IN_SCOPE_COMPONENTS) {
		const mapping = mappingFor(component);
		if (!existsSync(mapping)) {
			errors.push(
				`missing mapping: ${component} → expected ${mapping.replace(
					REPO_ROOT + "/",
					"",
				)}\n  fix: bun run scaffold:component ${basename(component, ".tsx")}`,
			);
		}
	}

	const mappings = readdirSync(CODE_CONNECT_DIR).filter((f) => f.endsWith(".figma.tsx"));
	const expected = new Set(
		IN_SCOPE_COMPONENTS.map((c) => basename(c).replace(".tsx", ".figma.tsx")),
	);
	for (const f of mappings) {
		if (!expected.has(f)) {
			errors.push(
				`orphan mapping: figma/code-connect/${f} has no matching in-scope component.`,
			);
		}
	}

	if (errors.length > 0) {
		// eslint-disable-next-line no-console
		console.error("[check-code-connect-parity] failures:");
		for (const e of errors) {
			// eslint-disable-next-line no-console
			console.error(`  - ${e}`);
		}
		process.exit(1);
	}
	// eslint-disable-next-line no-console
	console.log(`[check-code-connect-parity] ${IN_SCOPE_COMPONENTS.length} mappings in parity`);
}

main();
