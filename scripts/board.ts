#!/usr/bin/env bun
/**
 * The board: the arc, the active OpenSpec changes, and where the build stands.
 *
 * Every number printed here is DERIVED from openspec/changes/<change>/tasks.md
 * at read time. Nothing is stored twice, so nothing can drift — the failure this
 * replaces is a hand-maintained ledger disagreeing with its own checkboxes
 * (commit b236da6, "resolve checkbox drift 5/24 -> 22/24").
 *
 * tasks/state.json holds only what cannot be derived: the act ordering, what is
 * blocked, what is next, what a gate printed when it was last observed, and what
 * must carry to a later session.
 *
 * `--check` runs in the commit gate (`pnpm validate`). It exits non-zero on the
 * drift classes a derived board can still carry:
 *
 *   1. a change fully checked and still sitting in changes/ instead of archive/
 *   2. a state entry naming a change that is not active
 *   3. a change directory missing proposal.md or tasks.md
 *   4. openspec/changes edited in the working tree without tasks/state.json
 *      moving with it, or a state date older than the last commit that touched
 *      openspec/changes — the board going stale is the whole failure mode, so it
 *      is a gate rather than a habit
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CHANGES_DIR = resolve(REPO_ROOT, "openspec/changes");
const STATE_FILE = resolve(REPO_ROOT, "tasks/state.json");

/** iPod announced 23 October 2001. The arc lands on the 25th. */
const ANNIVERSARY = "2026-10-23";

interface Change {
	name: string;
	done: number;
	total: number;
}

/** One act of the arc. `change` is null while an act has no change proposed yet. */
interface Act {
	act: number;
	claim: string;
	change: string | null;
	note?: string;
}

interface State {
	updated: string;
	focus: string;
	blocked: boolean;
	blocked_reason: string | null;
	arc?: Act[];
	next: string[];
	gates: Record<string, string>;
	carry: string[];
}

/** A task line is `- [ ]` or `- [x]` at any indent. Anything else is prose. */
const TASK_LINE = /^\s*-\s\[( |x|X)\]/;

function readChanges(): Change[] {
	if (!existsSync(CHANGES_DIR)) return [];
	return readdirSync(CHANGES_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory() && e.name !== "archive")
		.map((e) => {
			const tasksPath = join(CHANGES_DIR, e.name, "tasks.md");
			if (!existsSync(tasksPath)) return { name: e.name, done: 0, total: 0 };
			const lines = readFileSync(tasksPath, "utf8").split("\n").filter((l) => TASK_LINE.test(l));
			const done = lines.filter((l) => /\[(x|X)\]/.test(l)).length;
			return { name: e.name, done, total: lines.length };
		})
		.sort((a, b) => b.done / (b.total || 1) - a.done / (a.total || 1));
}

function readState(): State | null {
	if (!existsSync(STATE_FILE)) return null;
	return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
}

function bar(done: number, total: number, width = 24): string {
	if (total === 0) return "-".repeat(width);
	const filled = Math.round((done / total) * width);
	return "#".repeat(filled) + "-".repeat(width - filled);
}

/** Whole days from today to the anniversary, floored at 0. */
function daysToAnniversary(): number {
	const today = new Date();
	const target = new Date(`${ANNIVERSARY}T00:00:00Z`);
	const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.max(0, Math.round((target.getTime() - utcToday) / 86_400_000));
}

/** Empty array when git is unavailable, so the board still prints outside a checkout. */
function git(...args: string[]): string[] {
	const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
	if (r.status !== 0 || typeof r.stdout !== "string") return [];
	return r.stdout.split("\n").filter((l) => l.trim().length > 0);
}

function print(changes: Change[], state: State | null): void {
	const out: string[] = [];
	const done = changes.reduce((n, c) => n + c.done, 0);
	const total = changes.reduce((n, c) => n + c.total, 0);
	const byName = new Map(changes.map((c) => [c.name, c]));

	out.push("");
	out.push(
		`  BOARD  ${changes.length} active changes  ${done}/${total} tasks  ` +
			`${daysToAnniversary()} days to ${ANNIVERSARY}`,
	);

	if (state?.arc && state.arc.length > 0) {
		out.push("");
		out.push("  ARC  (each act depends on the one above it)");
		const claimWidth = Math.max(...state.arc.map((a) => a.claim.length));
		const indent = " ".repeat(4 + 3 + claimWidth + 2 + 7 + 2);
		for (const a of state.arc) {
			const c = a.change ? byName.get(a.change) : undefined;
			const progress = c
				? `${String(c.done).padStart(3)}/${String(c.total).padEnd(3)}`
				: "  -/-  ";
			out.push(
				`    ${a.act}  ${a.claim.padEnd(claimWidth)}  ${progress}  ` +
					`${a.change ?? "(no change proposed)"}`,
			);
			if (a.note) out.push(`${indent}${a.note}`);
		}
	}

	out.push("");
	const width = Math.max(...changes.map((c) => c.name.length), 0);
	for (const c of changes) {
		const pct = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
		out.push(
			`  ${c.name.padEnd(width)}  ${bar(c.done, c.total)}  ` +
				`${String(c.done).padStart(3)}/${String(c.total).padEnd(3)}  ${String(pct).padStart(3)}%`,
		);
	}

	if (state) {
		out.push("");
		out.push(`  FOCUS   ${state.focus}`);
		if (state.blocked) out.push(`  BLOCKED ${state.blocked_reason ?? "(no reason recorded)"}`);
		if (state.next.length > 0) {
			out.push("");
			out.push("  NEXT");
			for (const n of state.next) out.push(`    - ${n}`);
		}
		const gates = Object.entries(state.gates);
		if (gates.length > 0) {
			out.push("");
			out.push("  GATES  (as last observed, not re-run here)");
			for (const [name, result] of gates) out.push(`    ${name.padEnd(28)} ${result}`);
		}
		if (state.carry.length > 0) {
			out.push("");
			out.push("  CARRY");
			for (const c of state.carry) out.push(`    - ${c}`);
		}
		out.push("");
		out.push(`  updated ${state.updated}`);
	}
	out.push("");
	// eslint-disable-next-line no-console
	console.log(out.join("\n"));
}

/**
 * The board is stale when openspec/changes moved and tasks/state.json did not.
 * Measured against git rather than file mtime: a fresh clone rewrites every mtime
 * to checkout time, which would make staleness a property of when you cloned.
 */
function stale(state: State): string[] {
	const problems: string[] = [];

	const dirty = git("status", "--porcelain", "--", "openspec/changes", "tasks/state.json");
	const changesTouched = dirty.some(
		(l) => l.includes("openspec/changes/") && !l.includes("openspec/changes/archive/"),
	);
	const stateTouched = dirty.some((l) => l.includes("tasks/state.json"));
	if (changesTouched && !stateTouched) {
		problems.push(
			"openspec/changes is modified but tasks/state.json is not — update the board in the same commit as the work",
		);
	}

	const [lastCommit] = git("log", "-1", "--format=%cs", "--", "openspec/changes");
	if (lastCommit && lastCommit > state.updated) {
		problems.push(
			`tasks/state.json says updated ${state.updated}; openspec/changes was last committed ${lastCommit}`,
		);
	}

	return problems;
}

/** Drift a derived board can still carry. See the header for the four classes. */
function check(changes: Change[], state: State | null): number {
	const names = new Set(changes.map((c) => c.name));
	const problems: string[] = [];

	for (const c of changes) {
		if (c.total > 0 && c.done === c.total) {
			problems.push(
				`${c.name} is ${c.done}/${c.total} complete and still active — ` +
					`run: openspec archive ${c.name} --yes`,
			);
		}
		for (const required of ["proposal.md", "tasks.md"]) {
			if (!existsSync(join(CHANGES_DIR, c.name, required))) {
				problems.push(`${c.name} has no ${required}`);
			}
		}
	}

	if (state) {
		for (const n of state.next) {
			// A next-item may be free prose; only validate entries that look like a change id.
			const id = n.split(/[\s:]/)[0];
			if (/^[a-z0-9-]+$/.test(id) && id.includes("-") && !names.has(id)) {
				problems.push(`state.json.next references "${id}" which is not an active change`);
			}
		}
		for (const a of state.arc ?? []) {
			if (a.change && !names.has(a.change)) {
				problems.push(
					`state.json.arc act ${a.act} references "${a.change}" which is not an active change — ` +
						"set it to null with a note if the act has shipped",
				);
			}
		}
		problems.push(...stale(state));
	}

	if (problems.length === 0) {
		// eslint-disable-next-line no-console
		console.log("[board] no drift");
		return 0;
	}
	for (const p of problems) {
		// eslint-disable-next-line no-console
		console.error(`[board] ${p}`);
	}
	return 1;
}

function main(): void {
	const changes = readChanges();
	const state = readState();
	if (process.argv.includes("--check")) {
		process.exit(check(changes, state));
	}
	print(changes, state);
}

main();
