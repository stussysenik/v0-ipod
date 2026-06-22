#!/usr/bin/env bun
/**
 * CI freshness check: ensures packages/tokens/tokens.json matches a fresh
 * extract. Fails if the on-disk file is stale relative to tailwind.config.ts
 * or app/globals.css.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const TOKENS_JSON = resolve(REPO_ROOT, "packages/tokens/tokens.json");

function main(): void {
	const committed = readFileSync(TOKENS_JSON, "utf8");
	const result = spawnSync("bun", ["run", "scripts/extract-tokens.ts", "--stdout"], {
		encoding: "utf8",
		cwd: REPO_ROOT,
	});
	if (result.status !== 0) {
		// eslint-disable-next-line no-console
		console.error("[check-tokens-fresh] extract failed");
		// eslint-disable-next-line no-console
		console.error(result.stderr);
		process.exit(1);
	}
	const fresh = result.stdout;
	if (committed.trim() !== fresh.trim()) {
		// eslint-disable-next-line no-console
		console.error(
			"[check-tokens-fresh] packages/tokens/tokens.json is stale. Run `bun run tokens:extract`.",
		);
		process.exit(1);
	}
	// eslint-disable-next-line no-console
	console.log("[check-tokens-fresh] tokens are fresh");
}

main();
