#!/usr/bin/env bun
/**
 * Walk the canonical Figma file and write a `storyId → nodeId` map into
 * docs/figma/frame-manifest.json. The script reads the Figma REST API so
 * it works without the custom plugin running.
 *
 * Every frame whose `pluginData.storyId` matches a CSF3 story in
 * stories/** is recorded. Frames with a plugin-data story id that does NOT
 * match any known story are surfaced as orphans for the operator to either
 * re-bind or delete manually.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONFIG = resolve(REPO_ROOT, "figma.config.json");
const STORIES_DIR = resolve(REPO_ROOT, "stories");
const MANIFEST = resolve(REPO_ROOT, "docs/figma/frame-manifest.json");

interface FigmaNode {
	id: string;
	name: string;
	type: string;
	pluginData?: Record<string, Record<string, string>>;
	children?: FigmaNode[];
}

interface FigmaFileResponse {
	document: FigmaNode;
}

function exit(message: string, code = 1): never {
	// eslint-disable-next-line no-console
	console.error(`[figma:record-frames] ${message}`);
	process.exit(code);
}

function listStoryIds(): Set<string> {
	const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".stories.tsx"));
	// Story ids follow the pattern `<slug>--<export>`, derived at Storybook
	// runtime. Without running Storybook, we approximate by using the filename
	// slug; the HMR plugin writes the authoritative story id on push and that
	// value is what the manifest actually stores. This list is only used to
	// flag orphans.
	return new Set(files.map((f) => basename(f, ".stories.tsx")));
}

async function fetchFile(token: string, fileKey: string): Promise<FigmaFileResponse> {
	const response = await fetch(
		`https://api.figma.com/v1/files/${fileKey}?plugin_data=shared`,
		{ headers: { "X-Figma-Token": token } },
	);
	if (!response.ok) {
		throw new Error(`Figma API ${response.status}`);
	}
	return response.json() as Promise<FigmaFileResponse>;
}

function collectFrames(node: FigmaNode, out: Array<{ id: string; storyId: string }>): void {
	if (node.type === "FRAME" && node.pluginData) {
		const shared = Object.values(node.pluginData)[0];
		const storyId = shared?.storyId;
		if (storyId) {
			out.push({ id: node.id, storyId });
		}
	}
	for (const child of node.children ?? []) {
		collectFrames(child, out);
	}
}

async function main(): Promise<void> {
	const token = process.env.FIGMA_TOKEN;
	if (!token) exit("FIGMA_TOKEN is not set");
	const cfg = JSON.parse(readFileSync(CONFIG, "utf8")) as {
		figma: { fileKey: string };
	};
	const key = cfg.figma.fileKey;
	if (!key || key === "PLACEHOLDER_FILE_KEY") {
		exit("figma.config.json has no file key");
	}

	const file = await fetchFile(token, key);
	const frames: Array<{ id: string; storyId: string }> = [];
	collectFrames(file.document, frames);

	const known = listStoryIds();
	const byStory: Record<string, string> = {};
	const orphans: Array<{ id: string; storyId: string }> = [];
	for (const frame of frames) {
		byStory[frame.storyId] = frame.id;
		const slug = frame.storyId.split("--")[0];
		if (!known.has(slug)) {
			orphans.push(frame);
		}
	}

	const manifest = {
		$schema: "./frame-manifest.schema.json",
		generatedAt: new Date().toISOString(),
		figmaFileKey: key,
		frames: byStory,
	};
	writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
	// eslint-disable-next-line no-console
	console.log(`[figma:record-frames] wrote ${Object.keys(byStory).length} frames`);
	if (orphans.length > 0) {
		// eslint-disable-next-line no-console
		console.warn(
			`[figma:record-frames] ${orphans.length} orphan frames (storyId without a matching story file):`,
		);
		for (const orphan of orphans) {
			// eslint-disable-next-line no-console
			console.warn(`  - ${orphan.storyId} → ${orphan.id}`);
		}
	}
}

main().catch((err) => exit((err as Error).message));
