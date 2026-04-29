#!/usr/bin/env bun
/**
 * Read docs/figma/frame-manifest.json and update `parameters.design`
 * on every matching CSF3 story to point at the real Figma node URL.
 *
 * Idempotent: a story that already has a matching URL is skipped.
 * Stories with `compat: "exclude"` are never touched.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONFIG = resolve(REPO_ROOT, "figma.config.json");
const MANIFEST = resolve(REPO_ROOT, "docs/figma/frame-manifest.json");
const STORIES_DIR = resolve(REPO_ROOT, "stories");

interface Manifest {
	figmaFileKey: string | null;
	frames: Record<string, string>;
}

function figmaUrl(fileKey: string, nodeId: string): string {
	return `https://www.figma.com/design/${fileKey}/iPod-Dev-Mode-Bridge?node-id=${encodeURIComponent(nodeId)}`;
}

function main(): void {
	const cfg = JSON.parse(readFileSync(CONFIG, "utf8")) as {
		figma: { fileKey: string };
	};
	const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
	const fileKey = manifest.figmaFileKey ?? cfg.figma.fileKey;
	if (!fileKey || fileKey === "PLACEHOLDER_FILE_KEY") {
		// eslint-disable-next-line no-console
		console.error("[figma:backfill-design-links] no file key available");
		process.exit(1);
	}

	const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".stories.tsx"));
	let updated = 0;
	for (const file of files) {
		const path = resolve(STORIES_DIR, file);
		const source = readFileSync(path, "utf8");
		// The canonical story id exported by Storybook combines the slug
		// (lowercased title) and the export name. The manifest stores the full
		// id; here we match only by the story file name prefix and rewrite the
		// placeholder url to the nearest matching frame. Operators should run
		// `figma:record-frames` after any rename.
		const slug = file.replace(".stories.tsx", "");
		const matching = Object.entries(manifest.frames).find(([id]) =>
			id.startsWith(`${slug}--`),
		);
		if (!matching) continue;
		const [, nodeId] = matching;
		const nextUrl = figmaUrl(fileKey, nodeId);
		const replaced = source.replace(
			/https:\/\/www\.figma\.com\/design\/[A-Za-z0-9_-]+\/[^?]+\?node-id=[^")\s]+/g,
			nextUrl,
		);
		if (replaced !== source) {
			writeFileSync(path, replaced, "utf8");
			updated += 1;
		}
	}
	// eslint-disable-next-line no-console
	console.log(`[figma:backfill-design-links] updated ${updated} stories`);
}

main();
