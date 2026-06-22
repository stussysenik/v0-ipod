/**
 * The speculative pre-compute brain — decides WHEN a proof frame should be rendered.
 *
 * It is deliberately timer-free and side-effect-free except for the injected `render`/store
 * calls, so the whole "should we render now?" policy is unit-testable in node. The React
 * hook (`use-proof-cache`) owns the actual idle clock and calls `tick` on an interval.
 *
 * The policy, in one breath: render the current proof key only once it has been STABLE for a
 * full idle interval (two identical consecutive ticks), is not already cached, and no real
 * export is in flight. Stability is what turns a drag-storm of intermediate poses into a
 * single render of the angle the user actually settled on.
 */

import type { ExportSnapshot } from "./export-fingerprint";
import type { ProofRenderQueue } from "./proof-render-queue";
import type { ProofStore } from "./proof-cache";

export interface ProofSchedulerDeps {
	store: ProofStore;
	queue: ProofRenderQueue;
	/** Render the anchor proof frame for a snapshot. Returns the PNG blob, or null on failure. */
	render: (snapshot: ExportSnapshot) => Promise<Blob | null>;
	/** Monotonic-ish wall clock for `createdAt` (injected so tests stay deterministic). */
	now: () => number;
	/** True while a real export bake owns the camera — the scheduler must yield to it. */
	isExporting: () => boolean;
	/** Notified after a frame lands in the store, so the panel can re-read the cache. */
	onStored?: (fingerprint: string) => void;
}

export interface ProofScheduler {
	/**
	 * Drive one idle tick. `proofKey` is `proofFingerprint(snapshot)` (the cache key);
	 * `snapshot` is the full export identity rendered + retained for provenance.
	 */
	tick: (proofKey: string, snapshot: ExportSnapshot) => void;
}

export function createProofScheduler(deps: ProofSchedulerDeps): ProofScheduler {
	let lastKey: string | null = null;

	return {
		tick(proofKey, snapshot) {
			// Require one full idle interval of stability: the key must match the previous
			// tick before we commit a render. A still-changing key (active drag) never renders.
			const stable = proofKey === lastKey;
			lastKey = proofKey;
			if (!stable) return;
			// Yield the camera entirely to a real export bake.
			if (deps.isExporting()) return;
			// Already-known (cached in memory) → nothing to do. The queue dedups in-flight keys.
			if (deps.store.peek(proofKey)) return;

			deps.queue.request(proofKey, async () => {
				// Read-through: a persisted (reload-warm) hit costs no render.
				const existing = await deps.store.get(proofKey);
				if (existing) {
					deps.onStored?.(proofKey);
					return;
				}
				const blob = await deps.render(snapshot);
				if (!blob) return;
				await deps.store.put({
					fingerprint: proofKey,
					snapshot,
					blob,
					createdAt: deps.now(),
				});
				deps.onStored?.(proofKey);
			});
		},
	};
}
