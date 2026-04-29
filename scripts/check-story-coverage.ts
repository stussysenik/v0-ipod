#!/usr/bin/env bun
/**
 * CI parity check: every in-scope component under `components/` has a
 * matching story file under `stories/`, and every story declares a valid
 * `parameters.compat` value.
 *
 * In-scope is defined by `docs/figma/component-audit.md` — components listed
 * in the `satori` or `raster` tables. The audit file is the source of truth.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const STORIES_DIR = resolve(REPO_ROOT, "stories");

const IN_SCOPE_COMPONENTS = [
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

const VALID_COMPAT = new Set(["satori", "raster", "exclude"]);

function storyFileFor(componentPath: string): string {
	const slug = basename(componentPath).replace(".tsx", "");
	return resolve(STORIES_DIR, `${slug}.stories.tsx`);
}

function extractCompat(source: string): string | null {
	// Match `compatParameters("satori")` or `compat: "satori"`
	const call = source.match(/compatParameters\(\s*"(satori|raster|exclude)"/);
	if (call) return call[1];
	const inline = source.match(/compat:\s*"(satori|raster|exclude)"/);
	if (inline) return inline[1];
	return null;
}

function main(): void {
	const errors: string[] = [];
	for (const component of IN_SCOPE_COMPONENTS) {
		const story = storyFileFor(component);
		if (!existsSync(story)) {
			errors.push(
				`missing story: ${component} → expected ${story.replace(
					REPO_ROOT + "/",
					"",
				)}\n  fix: bun run scaffold:component ${basename(component, ".tsx")}`,
			);
			continue;
		}
		const source = readFileSync(story, "utf8");
		const compat = extractCompat(source);
		if (!compat) {
			errors.push(
				`missing compat: ${story.replace(REPO_ROOT + "/", "")} must declare parameters.compat`,
			);
			continue;
		}
		if (!VALID_COMPAT.has(compat)) {
			errors.push(
				`invalid compat "${compat}" in ${story.replace(REPO_ROOT + "/", "")}`,
			);
		}
	}

	// Catch accidental duplicate stories or stories without corresponding
	// components (e.g., orphans after a rename).
	const storyFiles = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".stories.tsx"));
	const expected = new Set(
		IN_SCOPE_COMPONENTS.map((c) => basename(c).replace(".tsx", ".stories.tsx")),
	);
	// Allow extra stories for compositions (e.g. now-playing)
	const allowed = new Set([
		...expected,
		"now-playing.stories.tsx",
		"ipod-classic.stories.tsx",
		"image-upload.stories.tsx",
	]);
	for (const f of storyFiles) {
		if (!allowed.has(f)) {
			errors.push(
				`orphan story: stories/${f} has no matching in-scope component. Remove or add to IN_SCOPE_COMPONENTS.`,
			);
		}
	}

	if (errors.length > 0) {
		// eslint-disable-next-line no-console
		console.error("[check-story-coverage] failures:");
		for (const e of errors) {
			// eslint-disable-next-line no-console
			console.error(`  - ${e}`);
		}
		process.exit(1);
	}
	// eslint-disable-next-line no-console
	console.log(
		`[check-story-coverage] ${IN_SCOPE_COMPONENTS.length} in-scope components covered`,
	);
}

main();
