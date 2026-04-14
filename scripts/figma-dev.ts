#!/usr/bin/env bun
/**
 * `bun run figma:dev` — single entry point that starts the Next.js dev
 * server and the Figma HMR server under one process with colour-labelled
 * output. SIGINT shuts both children cleanly within two seconds.
 *
 * Gated behind FIGMA_HMR=1 per the spec.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");

function prefix(label: string, color: string) {
	const prefixStr = `${color}[${label}]\x1b[0m`;
	return (chunk: Buffer) => {
		const text = chunk.toString();
		for (const line of text.split(/\r?\n/)) {
			if (line.length > 0) {
				process.stdout.write(`${prefixStr} ${line}\n`);
			}
		}
	};
}

function start(label: string, color: string, command: string, args: string[]): ChildProcess {
	const child = spawn(command, args, {
		cwd: REPO_ROOT,
		env: { ...process.env, FORCE_COLOR: "1" },
	});
	child.stdout?.on("data", prefix(label, color));
	child.stderr?.on("data", prefix(label, color));
	child.on("exit", (code) => {
		if (code !== 0) {
			// eslint-disable-next-line no-console
			console.error(`${color}[${label}]\x1b[0m exited with code ${code}`);
			process.exit(code ?? 1);
		}
	});
	return child;
}

function main(): void {
	if (process.env.FIGMA_HMR !== "1") {
		// eslint-disable-next-line no-console
		console.error(
			"[figma:dev] FIGMA_HMR is not set. See docs/figma/runbook.md Phase 2.",
		);
		process.exit(1);
	}

	const next = start("next", "\x1b[35m", "bun", ["run", "dev"]);
	const hmr = start("hmr", "\x1b[36m", "bun", ["run", "scripts/figma-hmr-server.ts"]);

	const shutdown = () => {
		// eslint-disable-next-line no-console
		console.log("\n[figma:dev] shutting down");
		next.kill("SIGINT");
		hmr.kill("SIGINT");
		setTimeout(() => process.exit(0), 1500);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

main();
