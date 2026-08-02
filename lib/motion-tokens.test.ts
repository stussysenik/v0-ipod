import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { interfaceMotion } from "./motion-tokens";

/**
 * THE MOTION TOKENS — the module itself is proven here: the shipped reading is recorded
 * (§1.2), every entry is named by job and never twice, and the GATE (§1.3) that keeps
 * interface timing inside the module is defined and self-tested in this file, in the
 * same shape as the workspace-storage key gate.
 */

describe("the interface motion tokens", () => {
	it("records the shipped reading: the loved row's fade is the Tailwind default (§1.2)", () => {
		expect(interfaceMotion.fade.durationMs).toBe(150);
		expect(interfaceMotion.fade.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
	});

	it("names every entry for the job it serves, and never twice", () => {
		const names = Object.keys(interfaceMotion);
		expect(new Set(names).size).toBe(names.length);
		for (const [key, job] of Object.entries(interfaceMotion)) {
			expect(job.job).toBe(key);
			expect(job.durationMs).toBeGreaterThan(0);
			expect(job.easing.length).toBeGreaterThan(0);
			expect(job.className.length).toBeGreaterThan(0);
		}
	});

	it("holds the instrument's timing table, so the studio controls read it too", () => {
		expect(interfaceMotion.hover.durationMs).toBe(130);
		expect(interfaceMotion.select.durationMs).toBe(220);
		expect(interfaceMotion.hover.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
		expect(interfaceMotion.select.easing).toBe(interfaceMotion.hover.easing);
	});
});

describe("the interface motion literal gate", () => {
	const SRC_DIRS = ["lib", "components", "hooks", "app"];

	// A duration or easing literal: `duration-*` (incl. arbitrary), `ease-*` (incl.
	// arbitrary), arbitrary `animate-[...]` values — which spell a whole shorthand,
	// duration included — and a bare `cubic-bezier(...)` token.
	//
	// WHAT THE GATE POLICES IS A *STATED* TIME. `animate-in`, `animate-out`, `animate-spin`
	// and `animate-pulse` name an animation and state no duration and no curve; the timing
	// an enter animation actually runs at is the `duration-*` beside it, which this catches.
	// Listing `animate-in` as well made the gate fail on 22 call sites that state no timing
	// at all, while `transition-opacity` — default-by-omission in exactly the same way —
	// passed. One rule now: a value written down has to come from a job.
	const MOTION_LITERAL_RE =
		/\b(?:duration-\d+|duration-\[[^\]]+\]|ease-(?:in-out|in|out|linear)|ease-\[[^\]]+\]|animate-\[[^\]]+\]|cubic-bezier\([^)]*\))/g;

	// Comments may quote timing the code does not use (the stage's archived menu toggle
	// does exactly that); strip both comment forms before scanning. The one place a
	// literal is *meant* to exist is the motion module, which is exempt below.
	function stripComments(source: string): string {
		return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
	}

	// The gate polices interface markup: test files, story files, and their fixtures
	// describe code rather than run it (the bezier suite's own tests say "ease-in" in
	// prose), so they are skipped like the motion module itself is exempt.
	const SKIP_FILE_RE = /\.(test|spec|stories)\.(ts|tsx)$/;

	const EXEMPTED_FILES = new Set(["lib/motion-tokens.ts"]);

	function collectSourceFiles(dir: string): string[] {
		const result: string[] = [];
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const full = join(dir, entry.name);
			if (entry.isDirectory() && entry.name !== "node_modules") {
				result.push(...collectSourceFiles(full));
			} else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
				result.push(full);
			}
		}
		return result;
	}

	it("a duration or easing literal in application source fails, naming file and value", () => {
		const failures: string[] = [];
		const scanned: string[] = [];

		for (const dir of SRC_DIRS) {
			const files = collectSourceFiles(dir);
			scanned.push(...files);
			for (const file of files) {
				if (EXEMPTED_FILES.has(file) || SKIP_FILE_RE.test(file)) continue;
				const content = stripComments(readFileSync(file, "utf8"));
				let match: RegExpExecArray | null;
				while ((match = MOTION_LITERAL_RE.exec(content)) !== null) {
					failures.push(`${file}: ${match[0]}`);
				}
			}
		}

		expect(scanned.length).toBeGreaterThan(0);

		if (failures.length > 0) {
			throw new Error(
				`Interface motion literals found outside the motion module:\n${failures.join("\n")}\n\n` +
					"Every interface transition must read its duration and easing from lib/motion-tokens.ts.",
			);
		}
	});

	it("the gate catches a duration literal (self-test)", () => {
		const fixture = `<button className="transition-all duration-500">Go</button>`;
		const matches = [...fixture.matchAll(MOTION_LITERAL_RE)].map((m) => m[0]);
		expect(matches).toEqual(["duration-500"]);
	});

	it("the gate catches every literal form it exists to catch (self-test)", () => {
		const fixture = [
			"duration-500",
			"duration-[80ms]",
			"ease-in-out",
			"ease-[cubic-bezier(0.16,1,0.3,1)]",
			"animate-[shutterFlash_0.6s_ease-out_forwards]",
			"cubic-bezier(0.16, 1, 0.3, 1)",
		].join(" ");
		const matches = [...fixture.matchAll(MOTION_LITERAL_RE)].map((m) => m[0]);
		expect(matches).toEqual([
			"duration-500",
			"duration-[80ms]",
			"ease-in-out",
			"ease-[cubic-bezier(0.16,1,0.3,1)]",
			"animate-[shutterFlash_0.6s_ease-out_forwards]",
			"cubic-bezier(0.16, 1, 0.3, 1)",
		]);
	});

	it("lets an animation NAME through and still catches the duration beside it", () => {
		// `animate-in duration-500` is the shape a real enter animation takes: the name
		// states nothing, the duration states 500ms, and only the second is the gate's job.
		const matches = [...`animate-in fade-in duration-500`.matchAll(MOTION_LITERAL_RE)].map(
			(m) => m[0],
		);
		expect(matches).toEqual(["duration-500"]);
	});

	it("the gate lets named animations and non-timing tokens through (self-test)", () => {
		const fixture = [
			"animate-spin",
			"animate-pulse",
			"animate-in",
			"animate-out",
			"transition-opacity",
			"transition-colors",
			"delay-100",
			"fill-mode-both",
			"data-marquee-cycle-duration-ms",
			"easeInOutSine",
		].join(" ");
		expect([...fixture.matchAll(MOTION_LITERAL_RE)]).toHaveLength(0);
	});

	it("the gate ignores timing quoted inside comments (self-test)", () => {
		const fixture = `/* archived: transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) */\n// ease-out disabled\nconst x = 1;`;
		expect([...stripComments(fixture).matchAll(MOTION_LITERAL_RE)]).toHaveLength(0);
	});
});
