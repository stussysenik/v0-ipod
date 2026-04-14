#!/usr/bin/env bun
/**
 * Phase 1 push entry point.
 *
 *   1. Validate FIGMA_TOKEN
 *   2. Build Storybook (storybook-static/)
 *   3. Hand off to Story.to.Design via its CLI/webhook, or the fallback
 *      REST pusher once we own one.
 *
 * Story.to.Design does not currently expose a headless CLI with stable
 * semantics, so this script is a **guarded dispatcher**: it refuses to run
 * without FIGMA_TOKEN, it builds Storybook unconditionally, and it then
 * prints the exact manual steps an operator would take in Story.to.Design's
 * plugin UI. Any future REST-based pusher should replace the manual block
 * and keep the same pre-flight contract.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONFIG = resolve(REPO_ROOT, "figma.config.json");
const STORYBOOK_OUT = resolve(REPO_ROOT, "storybook-static");

function exit(message: string, code = 1): never {
	// eslint-disable-next-line no-console
	console.error(`[figma:push] ${message}`);
	process.exit(code);
}

function run(cmd: string, args: string[]): void {
	const result = spawnSync(cmd, args, {
		stdio: "inherit",
		cwd: REPO_ROOT,
	});
	if (result.status !== 0) {
		exit(`${cmd} ${args.join(" ")} exited with status ${result.status}`);
	}
}

function main(): void {
	if (!process.env.FIGMA_TOKEN) {
		exit("FIGMA_TOKEN is not set. See ENGINEERING_SETUP.md → Figma Dev-Mode Bridge.");
	}

	const cfg = JSON.parse(readFileSync(CONFIG, "utf8")) as {
		figma: { fileKey: string };
	};
	if (!cfg.figma.fileKey || cfg.figma.fileKey === "PLACEHOLDER_FILE_KEY") {
		exit(
			"figma.config.json has no file key — set it per docs/figma/runbook.md step 1.3.",
		);
	}

	// eslint-disable-next-line no-console
	console.log("[figma:push] building Storybook");
	run("bun", ["run", "storybook:build"]);

	if (!existsSync(STORYBOOK_OUT)) {
		exit("storybook-static/ missing after build — see above output");
	}

	// eslint-disable-next-line no-console
	console.log("\n[figma:push] Storybook build OK");
	// eslint-disable-next-line no-console
	console.log(`[figma:push] canonical file: ${cfg.figma.fileKey}`);
	// eslint-disable-next-line no-console
	console.log(
		"\n[figma:push] Story.to.Design does not expose a headless CLI with stable semantics.\n" +
			"[figma:push] Complete the push by running Story.to.Design in the canonical Figma file:\n" +
			"[figma:push]   1. Open the canonical file in Figma\n" +
			"[figma:push]   2. Plugins → Story.to.Design → connect to local storybook-static/\n" +
			"[figma:push]   3. Import all `satori` and `raster` stories\n" +
			"[figma:push]   4. Run `bun run figma:record-frames` to capture the node IDs\n" +
			"[figma:push]   5. Run `bun run figma:backfill-design-links` to update parameters.design\n",
	);
}

main();
