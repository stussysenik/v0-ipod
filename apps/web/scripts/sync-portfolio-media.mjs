#!/usr/bin/env node
/**
 * Sync portfolio media manifest.
 *
 * Scans `public/portfolio/photos` and `public/portfolio/videos`, then writes
 * `lib/portfolio/media-manifest.json`. The Photos/Videos iPod screens read that
 * manifest — so the workflow is simply: drop files into those folders, run
 * `npm run media:sync` (or it runs automatically before `dev`/`build`), and the
 * screens populate. No code edits required.
 *
 * Title inference: the filename (sans extension) is humanized. To set an
 * explicit order/title, prefix files like `01 - Street, Tokyo.jpg`.
 */

import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Script lives in apps/web/scripts → ROOT is apps/web (public/ lives here),
// REPO_ROOT is the monorepo root (lib now lives in packages/lib).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(ROOT, "..", "..");
const PHOTO_DIR = join(ROOT, "public/portfolio/photos");
const VIDEO_DIR = join(ROOT, "public/portfolio/videos");
const OUT = join(REPO_ROOT, "packages/lib/portfolio/media-manifest.json");

const PHOTO_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".heic"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const slugify = (name) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const humanize = (name) =>
	name
		// strip a leading "01 - " / "01_" ordering prefix
		.replace(/^\d+\s*[-_.]\s*/, "")
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());

function scan(dir, allowed) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => !f.startsWith(".") && allowed.has(extname(f).toLowerCase()))
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const photos = scan(PHOTO_DIR, PHOTO_EXT).map((file) => {
	const stem = basename(file, extname(file));
	return {
		id: slugify(stem) || slugify(file),
		title: humanize(stem),
		src: `/portfolio/photos/${file}`,
	};
});

const videos = scan(VIDEO_DIR, VIDEO_EXT).map((file) => {
	const stem = basename(file, extname(file));
	return {
		id: slugify(stem) || slugify(file),
		title: humanize(stem),
		src: `/portfolio/videos/${file}`,
	};
});

writeFileSync(OUT, `${JSON.stringify({ photos, videos }, null, 2)}\n`);
console.log(`media:sync → ${photos.length} photo(s), ${videos.length} video(s) → ${OUT}`);
