#!/usr/bin/env bun
/**
 * Smoke-test the FIGMA_TOKEN scopes against the canonical file.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONFIG = resolve(REPO_ROOT, "figma.config.json");

interface FigmaConfig {
	figma: { fileKey: string };
}

function exit(message: string, code = 1): never {
	// eslint-disable-next-line no-console
	console.error(`[figma:check-token] ${message}`);
	process.exit(code);
}

async function main(): Promise<void> {
	const token = process.env.FIGMA_TOKEN;
	if (!token) {
		exit("FIGMA_TOKEN is not set. See ENGINEERING_SETUP.md → Figma Dev-Mode Bridge.");
	}
	if (!/^figd_[A-Za-z0-9_-]+$/.test(token)) {
		exit("FIGMA_TOKEN does not look like a Figma personal access token (figd_*).");
	}

	const cfg = JSON.parse(readFileSync(CONFIG, "utf8")) as FigmaConfig;
	const key = cfg.figma.fileKey;
	if (!key || key === "PLACEHOLDER_FILE_KEY") {
		exit(
			"figma.config.json has no file key. Follow docs/figma/runbook.md step 1.3 before checking the token.",
		);
	}

	const response = await fetch(`https://api.figma.com/v1/files/${key}?depth=1`, {
		headers: { "X-Figma-Token": token },
	});
	if (response.status === 403) {
		exit("Token rejected with 403 — scopes or file access are insufficient.");
	}
	if (response.status === 404) {
		exit("File not found — check figma.config.json fileKey.");
	}
	if (!response.ok) {
		exit(`Unexpected status ${response.status}`);
	}
	// eslint-disable-next-line no-console
	console.log("[figma:check-token] OK");
}

main().catch((err) => exit((err as Error).message));
