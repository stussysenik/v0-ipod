/**
 * IndexedDB persistence backend for the proof cache.
 *
 * Implements `ProofPersistence` so proof frames survive reloads — valid by construction
 * because the key is the deterministic fingerprint (a persisted hit after reload is still
 * the right frame). PNG blobs store natively in IndexedDB, so no base64 bloat.
 *
 * Everything is guarded: if IndexedDB is missing (SSR, private mode) or throws (quota),
 * the factory returns `null` and the store falls back to memory-only. The feature never
 * crashes on storage.
 */

import { FINGERPRINT_VERSION } from "./export-fingerprint";
import type { ProofEntry, ProofPersistence } from "./proof-cache";

const DB_NAME = "ipod-proof-cache";
// Bump the store name with the fingerprint version so a schema change starts a clean store.
const STORE = `proofs_v${FINGERPRINT_VERSION}`;
const MAX_PERSISTED = 60;

interface PersistedRow {
	fingerprint: string;
	snapshot: ProofEntry["snapshot"];
	blob: Blob;
	createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				const os = db.createObjectStore(STORE, { keyPath: "fingerprint" });
				os.createIndex("createdAt", "createdAt");
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
	return db.transaction(STORE, mode).objectStore(STORE);
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

/** Evict oldest rows (by createdAt) until at most MAX_PERSISTED remain. */
async function prune(db: IDBDatabase): Promise<void> {
	const store = tx(db, "readwrite");
	const count = await promisify(store.count());
	if (count <= MAX_PERSISTED) return;
	let toDrop = count - MAX_PERSISTED;
	await new Promise<void>((resolve, reject) => {
		const cursorReq = store.index("createdAt").openCursor(); // oldest first
		cursorReq.onsuccess = () => {
			const cursor = cursorReq.result;
			if (!cursor || toDrop <= 0) return resolve();
			cursor.delete();
			toDrop--;
			cursor.continue();
		};
		cursorReq.onerror = () => reject(cursorReq.error);
	});
}

/**
 * Build the IndexedDB-backed persistence, or `null` if unavailable. The DB handle is opened
 * lazily and cached; any failure along the way collapses to `null`/no-op so the caller
 * silently degrades to memory-only.
 */
export function createIdbProofPersistence(): ProofPersistence | null {
	if (typeof indexedDB === "undefined") return null;

	let dbPromise: Promise<IDBDatabase> | null = null;
	const db = (): Promise<IDBDatabase> => {
		if (!dbPromise) dbPromise = openDb();
		return dbPromise;
	};

	return {
		async load(fingerprint) {
			try {
				const handle = await db();
				const row = await promisify(tx(handle, "readonly").get(fingerprint) as IDBRequest<PersistedRow | undefined>);
				if (!row) return undefined;
				return { fingerprint: row.fingerprint, snapshot: row.snapshot, blob: row.blob, createdAt: row.createdAt };
			} catch {
				return undefined;
			}
		},
		async save(entry) {
			try {
				const handle = await db();
				const row: PersistedRow = {
					fingerprint: entry.fingerprint,
					snapshot: entry.snapshot,
					blob: entry.blob,
					createdAt: entry.createdAt,
				};
				await promisify(tx(handle, "readwrite").put(row));
				await prune(handle);
			} catch {
				// best-effort: a failed persist is survivable, memory still holds the entry
			}
		},
		async delete(fingerprint) {
			try {
				const handle = await db();
				await promisify(tx(handle, "readwrite").delete(fingerprint));
			} catch {
				// ignore
			}
		},
	};
}
