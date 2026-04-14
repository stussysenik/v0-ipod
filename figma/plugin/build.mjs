#!/usr/bin/env bun
import { build, context } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const here = dirname(new URL(import.meta.url).pathname);
const srcDir = resolve(here, "src");
const distDir = resolve(here, "dist");
mkdirSync(distDir, { recursive: true });

const watch = process.argv.includes("--watch");

const codeOptions = {
	entryPoints: [resolve(srcDir, "code.ts")],
	outfile: resolve(distDir, "code.js"),
	bundle: true,
	format: "iife",
	target: "es2020",
	logLevel: "info",
};

const uiOptions = {
	entryPoints: [resolve(srcDir, "ui.ts")],
	outfile: resolve(distDir, "ui.js"),
	bundle: true,
	format: "iife",
	target: "es2020",
	logLevel: "info",
};

async function run() {
	if (watch) {
		const codeCtx = await context(codeOptions);
		const uiCtx = await context(uiOptions);
		await Promise.all([codeCtx.watch(), uiCtx.watch()]);
		copyFileSync(resolve(srcDir, "ui.html"), resolve(distDir, "ui.html"));
		console.log("[plugin] watching");
		return;
	}
	await build(codeOptions);
	await build(uiOptions);
	copyFileSync(resolve(srcDir, "ui.html"), resolve(distDir, "ui.html"));
	console.log("[plugin] built to", distDir);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
