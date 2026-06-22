import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredTypeArtifacts = [
	resolve(repoRoot, ".next/types/app/page.ts"),
	resolve(repoRoot, ".next/types/cache-life.d.ts"),
];

function runNodeScript(scriptPath, args) {
	const result = spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: repoRoot,
		env: process.env,
		stdio: "inherit",
	});

	if (result.error) {
		throw result.error;
	}

	return result.status ?? 1;
}

if (requiredTypeArtifacts.some((artifactPath) => !existsSync(artifactPath))) {
	console.log("[type-check] generating Next.js type artifacts");

	const nextBin = join(dirname(require.resolve("next/package.json")), "dist/bin/next");
	const preflightExitCode = runNodeScript(nextBin, [
		"build",
		"--webpack",
		"--experimental-build-mode",
		"compile",
	]);

	if (preflightExitCode !== 0) {
		process.exit(preflightExitCode);
	}
}

const tscBin = join(dirname(require.resolve("typescript/package.json")), "bin/tsc");

process.exit(runNodeScript(tscBin, ["--noEmit"]));
