/**
 * A single-flight, suspendable render queue for speculative proof rendering.
 *
 * Constraints it enforces (the reasons it exists):
 *   • ONE render at a time — proof renders share the camera + frameloop with everything
 *     else, so they must never run concurrently.
 *   • Dedup by key — the same fingerprint is never enqueued twice; re-requesting a key
 *     that is pending or in-flight is a no-op.
 *   • Priority — the current fingerprint outranks best-effort neighbor warming.
 *   • Suspendable — while a REAL export bake owns the camera, the queue suspends and starts
 *     nothing new; it resumes when the export finishes.
 *
 * It is driver-agnostic (no timers of its own — the hook owns idle debounce) and side-effect
 * free except for invoking the supplied async `run` thunks, so it is unit-testable in node.
 */

interface QueueItem {
	key: string;
	run: () => Promise<void>;
	priority: number;
}

export interface ProofRenderQueue {
	/** Enqueue a render for `key`. No-op if `key` is already in-flight or pending. */
	request: (key: string, run: () => Promise<void>, priority?: number) => void;
	/** Suspend starting new work (e.g. a real export began). In-flight work still finishes. */
	suspend: () => void;
	/** Resume and drain. */
	resume: () => void;
	/** Drop everything not yet started. */
	clearPending: () => void;
	readonly activeKey: string | null;
	readonly pendingKeys: string[];
	readonly suspended: boolean;
}

export function createProofRenderQueue(): ProofRenderQueue {
	const pending: QueueItem[] = [];
	let active: string | null = null;
	let suspended = false;

	const isKnown = (key: string) => active === key || pending.some((i) => i.key === key);

	function pump(): void {
		if (suspended || active !== null || pending.length === 0) return;
		// Highest priority first; ties keep FIFO order (stable by insertion).
		let bestIdx = 0;
		for (let i = 1; i < pending.length; i++) {
			if (pending[i].priority > pending[bestIdx].priority) bestIdx = i;
		}
		const [item] = pending.splice(bestIdx, 1);
		active = item.key;
		// Run detached; settle (success OR failure) frees the single slot and pumps again.
		void item
			.run()
			.catch(() => {})
			.finally(() => {
				active = null;
				pump();
			});
	}

	return {
		request(key, run, priority = 0) {
			if (isKnown(key)) return;
			pending.push({ key, run, priority });
			pump();
		},
		suspend() {
			suspended = true;
		},
		resume() {
			suspended = false;
			pump();
		},
		clearPending() {
			pending.length = 0;
		},
		get activeKey() {
			return active;
		},
		get pendingKeys() {
			return pending.map((i) => i.key);
		},
		get suspended() {
			return suspended;
		},
	};
}
