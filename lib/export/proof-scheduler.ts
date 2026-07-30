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
 *
 * A timeline plan rides the SAME policy and the SAME queue at a lower priority — there is no
 * second scheduler and no second queue, so a strip warm can never outrank the frame the user is
 * looking at and can never run beside another render. Its stability is tracked on the PLAN key,
 * not the anchor key: switching documents moves `timelineFingerprint` and leaves
 * `proofFingerprint` alone, so anchor stability says nothing about whether the motion settled.
 */

import type { ExportSnapshot, FingerprintPose } from "./export-fingerprint";
import type { ProofRenderQueue } from "./proof-render-queue";
import type { ProofStore } from "./proof-cache";
import type { TimelineProofPlan } from "./timeline-proof";

/** The anchor is what the panel shows; a timeline frame is best-effort behind it. */
const ANCHOR_PRIORITY = 1;
const TIMELINE_PRIORITY = 0;

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
	 * `snapshot` is the full export identity rendered + retained for provenance. `plan` is the
	 * timeline set for the motion currently composed — omit it and nothing but the anchor warms.
	 */
	tick: (proofKey: string, snapshot: ExportSnapshot, plan?: TimelineProofPlan) => void;
}

export function createProofScheduler(deps: ProofSchedulerDeps): ProofScheduler {
	let lastKey: string | null = null;
	let lastPlanKey: string | null = null;

	/**
	 * Warm one key. The anchor and every timeline frame share this body, which is why a frame
	 * cannot acquire a second render path or a second store convention. `snapshot` is the setup
	 * that produced THIS frame — a timeline frame carries its own pose, so the stored record
	 * restores the camera it actually proves rather than the hero it was derived from.
	 */
	function warm(key: string, snapshot: ExportSnapshot, priority: number): void {
		// Already-known (cached in memory) → nothing to do. The queue dedups in-flight keys.
		if (deps.store.peek(key)) return;
		deps.queue.request(
			key,
			async () => {
				// Read-through: a persisted (reload-warm) hit costs no render.
				const existing = await deps.store.get(key);
				if (existing) {
					deps.onStored?.(key);
					return;
				}
				const blob = await deps.render(snapshot);
				if (!blob) return;
				await deps.store.put({ fingerprint: key, snapshot, blob, createdAt: deps.now() });
				deps.onStored?.(key);
			},
			priority,
		);
	}

	return {
		tick(proofKey, snapshot, plan) {
			// Require one full idle interval of stability: the key must match the previous
			// tick before we commit a render. A still-changing key (active drag) never renders.
			// Both keys advance even while an export owns the camera, so stability accumulated
			// during a bake is not thrown away when it ends.
			const anchorStable = proofKey === lastKey;
			lastKey = proofKey;
			const planStable = plan !== undefined && plan.key === lastPlanKey;
			lastPlanKey = plan?.key ?? null;
			// Yield the camera entirely to a real export bake.
			if (deps.isExporting()) return;

			if (anchorStable) warm(proofKey, snapshot, ANCHOR_PRIORITY);
			if (!planStable || plan === undefined) return;
			for (const frame of plan.frames) {
				const pose: FingerprintPose = frame.pose;
				warm(frame.key, { ...snapshot, pose }, TIMELINE_PRIORITY);
			}
		},
	};
}
