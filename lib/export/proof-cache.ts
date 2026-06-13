/**
 * The proof cache — `fingerprint → offline proof frame`.
 *
 * Two layers, composed:
 *   • `ProofLru` — a pure, synchronous least-recently-used map. The hot path. Fully
 *     deterministic (recency = access order), so it is unit-testable in node with no DOM.
 *   • `createProofStore` — wraps the LRU with read-through to an optional async persistence
 *     backend (IndexedDB in the browser). A miss in memory falls through to the backend
 *     before a render is ever scheduled, so a reload-warm hit costs nothing.
 *
 * Because the key is the deterministic fingerprint, a hit is provably the export's anchor
 * frame — persistence across reloads is correct by construction, not a guess.
 */

import type { ExportSnapshot, ProofInputs } from "./export-fingerprint";

export interface ProofEntry {
	fingerprint: string;
	/** The setup that produced the frame — retained so provenance can restore it. */
	snapshot: ExportSnapshot | ProofInputs;
	/** The rendered anchor frame (PNG). */
	blob: Blob;
	createdAt: number;
}

/**
 * Pure LRU keyed by fingerprint. Recency is `Map` insertion order: `get` re-inserts to mark
 * most-recently-used, and `set` past capacity evicts the oldest key. No timers, no clock.
 */
export class ProofLru {
	private readonly map = new Map<string, ProofEntry>();

	constructor(private readonly max: number) {
		if (max < 1) throw new Error("ProofLru max must be >= 1");
	}

	get size(): number {
		return this.map.size;
	}

	has(fingerprint: string): boolean {
		return this.map.has(fingerprint);
	}

	/** Read WITHOUT bumping recency — for the panel's per-frame synchronous read. */
	peek(fingerprint: string): ProofEntry | undefined {
		return this.map.get(fingerprint);
	}

	get(fingerprint: string): ProofEntry | undefined {
		const entry = this.map.get(fingerprint);
		if (!entry) return undefined;
		// Bump recency: delete + re-set moves it to the newest position.
		this.map.delete(fingerprint);
		this.map.set(fingerprint, entry);
		return entry;
	}

	/** Insert/update; returns the fingerprints evicted to stay within `max`. */
	set(entry: ProofEntry): string[] {
		this.map.delete(entry.fingerprint);
		this.map.set(entry.fingerprint, entry);
		const evicted: string[] = [];
		while (this.map.size > this.max) {
			const oldest = this.map.keys().next().value as string | undefined;
			if (oldest === undefined) break;
			this.map.delete(oldest);
			evicted.push(oldest);
		}
		return evicted;
	}

	delete(fingerprint: string): void {
		this.map.delete(fingerprint);
	}

	/** Keys oldest → newest. */
	keys(): string[] {
		return [...this.map.keys()];
	}
}

/** Async persistence backend contract (IndexedDB implements this in the browser). */
export interface ProofPersistence {
	load: (fingerprint: string) => Promise<ProofEntry | undefined>;
	save: (entry: ProofEntry) => Promise<void>;
	delete: (fingerprint: string) => Promise<void>;
}

export interface ProofStore {
	/** Synchronous memory hit — the panel reads this every frame, must not be async. */
	peek: (fingerprint: string) => ProofEntry | undefined;
	/** Read-through: memory, then persistence. Warms memory on a persisted hit. */
	get: (fingerprint: string) => Promise<ProofEntry | undefined>;
	/** Write-through: memory + persistence; evicts from both within bounds. */
	put: (entry: ProofEntry) => Promise<void>;
	has: (fingerprint: string) => boolean;
}

/**
 * Compose an LRU with an optional persistence backend. When `persist` is omitted (or
 * IndexedDB is unavailable), the store is memory-only and every method still works.
 */
export function createProofStore(options: {
	max: number;
	persist?: ProofPersistence | null;
}): ProofStore {
	const lru = new ProofLru(options.max);
	const persist = options.persist ?? null;

	return {
		peek(fingerprint) {
			return lru.peek(fingerprint);
		},
		has(fingerprint) {
			return lru.has(fingerprint);
		},
		async get(fingerprint) {
			const hot = lru.get(fingerprint);
			if (hot) return hot;
			if (!persist) return undefined;
			const cold = await persist.load(fingerprint).catch(() => undefined);
			if (cold) lru.set(cold); // warm memory
			return cold;
		},
		async put(entry) {
			const evicted = lru.set(entry);
			if (persist) {
				await persist.save(entry).catch(() => {});
				// Mirror memory eviction into persistence (best-effort; bounded there too).
				await Promise.all(evicted.map((fp) => persist.delete(fp).catch(() => {})));
			}
		},
	};
}
