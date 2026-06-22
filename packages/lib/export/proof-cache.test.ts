import { describe, expect, it } from "vitest";

import {
	createProofStore,
	ProofLru,
	type ProofEntry,
	type ProofPersistence,
} from "./proof-cache";

function entry(fp: string, createdAt = 0): ProofEntry {
	return {
		fingerprint: fp,
		snapshot: {} as ProofEntry["snapshot"],
		blob: new Blob([fp], { type: "image/png" }),
		createdAt,
	};
}

describe("ProofLru", () => {
	it("evicts the least-recently-used past capacity", () => {
		const lru = new ProofLru(2);
		expect(lru.set(entry("a"))).toEqual([]);
		expect(lru.set(entry("b"))).toEqual([]);
		const evicted = lru.set(entry("c")); // over cap → "a" (oldest) goes
		expect(evicted).toEqual(["a"]);
		expect(lru.has("a")).toBe(false);
		expect(lru.keys()).toEqual(["b", "c"]);
	});

	it("get() bumps recency so the touched key survives", () => {
		const lru = new ProofLru(2);
		lru.set(entry("a"));
		lru.set(entry("b"));
		lru.get("a"); // a is now most-recent
		const evicted = lru.set(entry("c")); // b is now oldest
		expect(evicted).toEqual(["b"]);
		expect(lru.has("a")).toBe(true);
		expect(lru.has("c")).toBe(true);
	});

	it("peek() does NOT bump recency", () => {
		const lru = new ProofLru(2);
		lru.set(entry("a"));
		lru.set(entry("b"));
		lru.peek("a"); // read-only, no bump
		const evicted = lru.set(entry("c")); // a is still oldest
		expect(evicted).toEqual(["a"]);
	});

	it("rejects a capacity below 1", () => {
		expect(() => new ProofLru(0)).toThrow();
	});
});

describe("createProofStore", () => {
	it("works memory-only with no persistence backend", async () => {
		const store = createProofStore({ max: 4 });
		await store.put(entry("a"));
		expect(store.peek("a")?.fingerprint).toBe("a");
		expect(await store.get("a")).toBeDefined();
		expect(await store.get("missing")).toBeUndefined();
	});

	it("reads through to persistence on a memory miss and warms memory", async () => {
		const backing = new Map<string, ProofEntry>([["cold", entry("cold")]]);
		const persist: ProofPersistence = {
			load: async (fp) => backing.get(fp),
			save: async (e) => void backing.set(e.fingerprint, e),
			delete: async (fp) => void backing.delete(fp),
		};
		const store = createProofStore({ max: 4, persist });

		expect(store.peek("cold")).toBeUndefined(); // not in memory yet
		const got = await store.get("cold"); // falls through to persistence
		expect(got?.fingerprint).toBe("cold");
		expect(store.peek("cold")?.fingerprint).toBe("cold"); // now warmed into memory
	});

	it("write-through saves to persistence and mirrors eviction", async () => {
		const backing = new Map<string, ProofEntry>();
		const persist: ProofPersistence = {
			load: async (fp) => backing.get(fp),
			save: async (e) => void backing.set(e.fingerprint, e),
			delete: async (fp) => void backing.delete(fp),
		};
		const store = createProofStore({ max: 1, persist });

		await store.put(entry("a"));
		await store.put(entry("b")); // evicts "a" from memory AND persistence
		expect(backing.has("a")).toBe(false);
		expect(backing.has("b")).toBe(true);
	});

	it("survives a throwing persistence backend (degrades to memory)", async () => {
		const persist: ProofPersistence = {
			load: async () => {
				throw new Error("idb down");
			},
			save: async () => {
				throw new Error("idb down");
			},
			delete: async () => {
				throw new Error("idb down");
			},
		};
		const store = createProofStore({ max: 4, persist });
		await store.put(entry("a")); // must not throw
		expect(store.peek("a")?.fingerprint).toBe("a"); // memory still works
		expect(await store.get("a")).toBeDefined();
	});
});
