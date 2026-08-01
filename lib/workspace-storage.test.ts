import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
	WORKSPACE_STORAGE_KEYS,
	WORKSPACE_KEY_MAP,
	STORAGE_CLASSES,
	resetWorkspace,
	restoreWorkspace,
	readRestorePoint,
	pendingReset,
	storedWorkspaceKeys,
	isDeclaredKey,
	STUDIO_STORAGE_KEY,
	WORKSPACE_RESTORE_KEY,
	type RestorePoint,
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

	it("clears settings when scope is 'all', except the restore point it just wrote", () => {
		seedAll();

		resetWorkspace("all");

		for (const entry of WORKSPACE_STORAGE_KEYS) {
			expect(map.has(entry.key)).toBe(entry.class === "restore");
		}
	});

	it("returns the list of keys removed", () => {
		seedAll();

		const removed = resetWorkspace();
		const expected = WORKSPACE_STORAGE_KEYS.filter(
			(e) => e.class !== "settings" && e.class !== "restore",
		).map((e) => e.key);

		expect(new Set(removed)).toEqual(new Set(expected));
	});

	it("handles empty storage without error", () => {
		const removed = resetWorkspace();
		expect(removed).toEqual([]);
	});

	// The confirmation names a count. It reads pendingReset; the reset walks pendingReset.
	// One filter, so the number shown and the number cleared cannot disagree.
	it("clears exactly the keys the confirmation would name", () => {
		seedAll();
		const planned = pendingReset();

		const removed = resetWorkspace();

		expect(new Set(removed)).toEqual(new Set(planned));
	});

	it("reports only the declared keys that hold a value", () => {
		map.set(STUDIO_STORAGE_KEY, "{}");
		expect(storedWorkspaceKeys()).toEqual([STUDIO_STORAGE_KEY]);
	});

	// Nothing to clear means nothing was destroyed, so there is no version to write. A
	// restore point produced by an empty reset would be an undo back to the same state.
	it("writes no restore point when there is nothing to clear", () => {
		resetWorkspace();
		expect(readRestorePoint()).toBeNull();
	});

	it("names the scope in the restore point it writes", () => {
		seedAll();
		resetWorkspace("all");
		expect(readRestorePoint()?.scope).toBe("all");
	});

	it("captures every stored key before clearing", () => {
		seedAll();
		const before = new Map(map);

		resetWorkspace("all");

		const point = readRestorePoint();
		expect(point).not.toBeNull();
		for (const [key, value] of before) {
			expect(point?.entries[key]).toBe(value);
		}
	});
});

describe("restoreWorkspace", () => {
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
			if (entry.class === "restore") continue;
			map.set(entry.key, JSON.stringify({ value: entry.key }));
		}
	}

	it("puts the pre-reset workspace back byte for byte", () => {
		seedAll();
		const before = new Map(map);

		resetWorkspace("all");
		restoreWorkspace();

		for (const [key, value] of before) {
			expect(map.get(key)).toBe(value);
		}
	});

	// The image is exact: a key that arrived after the reset is not part of the version
	// being restored, so restoring removes it rather than leaving a stowaway.
	it("removes a declared key the restore point does not hold", () => {
		seedAll();
		resetWorkspace("all");
		map.set(STUDIO_STORAGE_KEY, JSON.stringify({ value: "written after the reset" }));
		map.delete(WORKSPACE_RESTORE_KEY);
		map.set(
			WORKSPACE_RESTORE_KEY,
			JSON.stringify({ scope: "all", entries: {} } satisfies RestorePoint),
		);

		restoreWorkspace();

		expect(map.has(STUDIO_STORAGE_KEY)).toBe(false);
	});

	/**
	 * The reset chain: two resets, two versions. The restore key is declared like any other,
	 * so the second capture nests the first — undoing twice reaches the state before the
	 * first reset rather than dead-ending at the state between them.
	 */
	it("walks back through two resets", () => {
		seedAll();
		const original = new Map(map);

		resetWorkspace("all");
		map.set(STUDIO_STORAGE_KEY, JSON.stringify({ value: "second era" }));
		const between = new Map(map);
		resetWorkspace("all");

		restoreWorkspace();
		for (const [key, value] of between) {
			expect(map.get(key)).toBe(value);
		}

		restoreWorkspace();
		for (const [key, value] of original) {
			expect(map.get(key)).toBe(value);
		}
	});

	it("restores nothing when no reset has run", () => {
		seedAll();
		expect(restoreWorkspace()).toEqual([]);
	});

	// A reset that cannot write its undo does not clear: the throw is the guarantee, so the
	// workspace has to be intact after it.
	it("aborts the reset when the restore point cannot be written", () => {
		seedAll();
		const before = new Map(map);
		const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
			throw new Error("QuotaExceededError");
		});

		expect(() => resetWorkspace()).toThrow(/restore point/);
		expect(map).toEqual(before);

		setItem.mockRestore();
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
