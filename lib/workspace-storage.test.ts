import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
	WORKSPACE_STORAGE_KEYS,
	WORKSPACE_KEY_MAP,
	STORAGE_CLASSES,
	resetWorkspace,
	isDeclaredKey,
} from "./workspace-storage";

describe("workspace-storage", () => {
	it("every entry has an owner", () => {
		for (const entry of WORKSPACE_STORAGE_KEYS) {
			expect(entry.owner).toBeTruthy();
		}
	});

	it("every entry has a valid class", () => {
		for (const entry of WORKSPACE_STORAGE_KEYS) {
			expect(STORAGE_CLASSES).toContain(entry.class);
		}
	});

	it("no duplicate key strings", () => {
		const keys = WORKSPACE_STORAGE_KEYS.map((e) => e.key);
		const unique = new Set(keys);
		expect(unique.size).toBe(keys.length);
	});

	it("WORKSPACE_KEY_MAP covers all keys", () => {
		for (const entry of WORKSPACE_STORAGE_KEYS) {
			expect(WORKSPACE_KEY_MAP[entry.key]).toBe(entry);
		}
	});
});

describe("resetWorkspace", () => {
	let map: Map<string, string>;

	beforeAll(() => {
		map = new Map();
		const storage: Storage = {
			getItem: (k: string) => map.get(k) ?? null,
			setItem: (k: string, v: string) => void map.set(k, v),
			removeItem: (k: string) => void map.delete(k),
			clear: () => map.clear(),
			key: (_: number) => null,
			get length() { return map.size; },
		};
		vi.stubGlobal("localStorage", storage);
	});

	afterAll(() => vi.unstubAllGlobals());

	beforeEach(() => map.clear());

	function seedAll() {
		for (const entry of WORKSPACE_STORAGE_KEYS) {
			map.set(entry.key, JSON.stringify({ value: entry.key }));
		}
	}

	it("clears content and cache keys under default scope", () => {
		seedAll();
		const contentAndCache = WORKSPACE_STORAGE_KEYS.filter(
			(e) => e.class === "content" || e.class === "cache",
		);
		const settings = WORKSPACE_STORAGE_KEYS.filter((e) => e.class === "settings");
		const legacy = WORKSPACE_STORAGE_KEYS.filter((e) => e.class === "legacy");

		const removed = resetWorkspace();

		for (const entry of contentAndCache) {
			expect(map.has(entry.key)).toBe(false);
		}
		for (const entry of settings) {
			expect(map.has(entry.key)).toBe(true);
		}
		for (const entry of legacy) {
			expect(map.has(entry.key)).toBe(false);
		}
		expect(new Set(removed)).toEqual(new Set([
			...contentAndCache.map((e) => e.key),
			...legacy.map((e) => e.key),
		]));
	});

	it("clears settings when scope is 'all'", () => {
		seedAll();

		resetWorkspace("all");

		for (const entry of WORKSPACE_STORAGE_KEYS) {
			expect(map.has(entry.key)).toBe(false);
		}
	});

	it("returns the list of keys removed", () => {
		seedAll();

		const removed = resetWorkspace();
		const expected = WORKSPACE_STORAGE_KEYS.filter(
			(e) => e.class !== "settings",
		).map((e) => e.key);

		expect(new Set(removed)).toEqual(new Set(expected));
	});

	it("handles empty storage without error", () => {
		const removed = resetWorkspace();
		expect(removed).toEqual([]);
	});
});

describe("localStorage key gate", () => {
	const SRC_DIRS = ["lib", "components", "hooks", "app"];

	const KEY_LITERAL_RE = /localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"\s*\)/g;

	const EXEMPTED_FILES = new Set([
		"lib/workspace-storage.ts",
		"lib/workspace-storage.test.ts",
	]);

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

	it("every localStorage key literal is declared in the registry", () => {
		const failures: string[] = [];
		const scanned: string[] = [];

		for (const dir of SRC_DIRS) {
			const files = collectSourceFiles(dir);
			scanned.push(...files);
			for (const file of files) {
				if (EXEMPTED_FILES.has(file)) continue;
				const content = readFileSync(file, "utf8");
				let match: RegExpExecArray | null;
				while ((match = KEY_LITERAL_RE.exec(content)) !== null) {
					const key = match[1]!;
					if (!isDeclaredKey(key)) {
						failures.push(`${file}: undeclared key "${key}"`);
					}
				}
			}
		}

		expect(scanned.length).toBeGreaterThan(0);

		if (failures.length > 0) {
			throw new Error(
				`Undeclared localStorage key literals found:\n${failures.join("\n")}\n\n` +
					"Every localStorage key must be declared in lib/workspace-storage.ts and imported at the call site.",
			);
		}
	});

	it("the gate detects an undeclared key (self-test)", () => {
		const fixture = `const x = localStorage.getItem("__test_undeclared_key__");`;
		const matches = [...fixture.matchAll(KEY_LITERAL_RE)];

		expect(matches).toHaveLength(1);
		const captured = matches[0]![1]!;
		expect(captured).toBe("__test_undeclared_key__");
		expect(isDeclaredKey(captured)).toBe(false);
	});
});
