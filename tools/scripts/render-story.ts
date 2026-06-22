#!/usr/bin/env bun
/**
 * JSX → SVG renderer backing the Phase 2 HMR loop.
 *
 * Takes a CSF3 story id of the form `<slug>--<export>`, loads the matching
 * module under `stories/`, instantiates the component with the story's args,
 * and runs it through satori with a fixed font stack.
 *
 * Pure function: same story id + identical file content → byte-identical
 * SVG. The HMR server uses this to implement a cache-and-debounce layer.
 *
 * Known constraint: satori does not execute effects or portals. Stories
 * must render meaningful output from their first synchronous render.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import React from "react";

const REPO_ROOT = resolve(import.meta.dir, "..");
const STORIES_DIR = resolve(REPO_ROOT, "stories");

export interface RenderInput {
	storyId: string; // "<slug>--<export>"
	width?: number;
	height?: number;
}

export interface RenderOutput {
	storyId: string;
	svg: string;
	renderedAt: number;
	cacheKey: string;
}

function parseStoryId(id: string): { slug: string; exportName: string } {
	const [slug, ...rest] = id.split("--");
	if (!slug || rest.length === 0) {
		throw new Error(`[render-story] invalid story id "${id}"`);
	}
	return { slug, exportName: rest.join("--") };
}

async function loadStoryModule(slug: string): Promise<Record<string, unknown>> {
	const path = resolve(STORIES_DIR, `${slug}.stories.tsx`);
	if (!existsSync(path)) {
		throw new Error(`[render-story] no story file for slug "${slug}"`);
	}
	// Dynamic import lets us bust the cache per run by appending a query string.
	const mod = (await import(`${path}?t=${Date.now()}`)) as Record<string, unknown>;
	return mod;
}

function resolveArgs(
	meta: { args?: Record<string, unknown>; component?: unknown },
	story: { args?: Record<string, unknown> },
): Record<string, unknown> {
	return { ...(meta.args ?? {}), ...(story.args ?? {}) };
}

function computeCacheKey(storyId: string, args: Record<string, unknown>): string {
	const payload = JSON.stringify({ storyId, args });
	let hash = 0;
	for (let i = 0; i < payload.length; i += 1) {
		hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
	}
	return `${storyId}:${hash.toString(16)}`;
}

async function loadFont(): Promise<ArrayBuffer> {
	// Placeholder for an embedded font. Phase 2 ships with no custom fonts,
	// so we rely on satori's default sans-serif rendering. The buffer is
	// intentionally empty — satori will fall back.
	return new ArrayBuffer(0);
}

export async function renderStory(input: RenderInput): Promise<RenderOutput> {
	const { slug, exportName } = parseStoryId(input.storyId);
	const mod = await loadStoryModule(slug);
	const meta = (mod.default ?? {}) as {
		component?: React.ComponentType<Record<string, unknown>>;
		args?: Record<string, unknown>;
	};
	const story = (mod[exportName] ?? {}) as { args?: Record<string, unknown> };
	if (!meta.component) {
		throw new Error(`[render-story] meta.component missing for "${slug}"`);
	}

	const args = resolveArgs(meta, story);
	const Component = meta.component;
	const element = React.createElement(Component, args);

	const width = input.width ?? 480;
	const height = input.height ?? 320;

	const fontBuffer = await loadFont();
	const svg = await satori(element, {
		width,
		height,
		fonts:
			fontBuffer.byteLength > 0
				? [
						{
							name: "Default",
							data: fontBuffer,
							weight: 400,
							style: "normal",
						},
					]
				: [],
		embedFont: false,
	});

	return {
		storyId: input.storyId,
		svg,
		renderedAt: Date.now(),
		cacheKey: computeCacheKey(input.storyId, args),
	};
}

if (import.meta.main) {
	const id = process.argv[2];
	if (!id) {
		// eslint-disable-next-line no-console
		console.error("usage: bun run scripts/render-story.ts <storyId>");
		process.exit(1);
	}
	renderStory({ storyId: id })
		.then((output) => {
			process.stdout.write(output.svg);
		})
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.error(err);
			process.exit(1);
		});
}
