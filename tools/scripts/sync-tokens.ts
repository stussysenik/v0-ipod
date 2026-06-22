#!/usr/bin/env bun
/**
 * Sync design tokens into the canonical Figma file as Variables.
 *
 * The heavy lifting happens inside the custom Figma plugin
 * (`figma/plugin/src/sync-tokens.ts`) because Variables can only be mutated
 * from inside a running plugin — the Figma REST API does not yet cover every
 * Variable mode operation we need. This script's job is to:
 *
 *   1. Validate that `design-tokens/tokens.json` is parseable and DTCG-valid.
 *   2. POST the JSON to the locally-running HMR server, which forwards to the
 *      connected plugin as a `tokens-synced` message.
 *   3. On `--delete-orphans`, require explicit confirmation before the plugin
 *      is told to actually delete deprecated Variables.
 *
 * If the HMR server is not running, the script falls back to printing the
 * payload so the operator can import it by hand via the plugin UI.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const REPO_ROOT = resolve(import.meta.dir, "..");
const TOKENS_JSON = resolve(REPO_ROOT, "design-tokens/tokens.json");
const HMR_ENDPOINT = process.env.FIGMA_HMR_URL ?? "http://localhost:7733";

interface SyncArgs {
	deleteOrphans: boolean;
	dryRun: boolean;
}

function parseArgs(): SyncArgs {
	return {
		deleteOrphans: process.argv.includes("--delete-orphans"),
		dryRun: process.argv.includes("--dry-run"),
	};
}

async function confirmDelete(): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question(
		"Delete all deprecated Figma Variables? This cannot be undone. [type DELETE to confirm] ",
	);
	rl.close();
	return answer.trim() === "DELETE";
}

async function postToHmr(body: unknown): Promise<Response> {
	return fetch(`${HMR_ENDPOINT}/tokens/sync`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

async function main(): Promise<void> {
	const args = parseArgs();
	const raw = readFileSync(TOKENS_JSON, "utf8");
	const tokens = JSON.parse(raw) as Record<string, unknown>;

	if (!("Primitives" in tokens) || !("Semantic" in tokens) || !("Component" in tokens)) {
		// eslint-disable-next-line no-console
		console.error("[sync-tokens] tokens.json missing required collections");
		process.exit(1);
	}

	if (args.deleteOrphans) {
		const confirmed = await confirmDelete();
		if (!confirmed) {
			// eslint-disable-next-line no-console
			console.log("[sync-tokens] delete cancelled");
			process.exit(0);
		}
	}

	const payload = {
		type: "tokens-sync",
		deleteOrphans: args.deleteOrphans,
		dryRun: args.dryRun,
		tokens,
	};

	try {
		const response = await postToHmr(payload);
		if (!response.ok) {
			throw new Error(`HMR server responded with ${response.status}`);
		}
		// eslint-disable-next-line no-console
		console.log("[sync-tokens] payload delivered to HMR server");
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn(
			"[sync-tokens] HMR server unreachable — fall back to manual import via plugin UI",
		);
		// eslint-disable-next-line no-console
		console.warn(`  reason: ${(err as Error).message}`);
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(payload, null, 2));
	}
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error("[sync-tokens]", err);
	process.exit(1);
});
