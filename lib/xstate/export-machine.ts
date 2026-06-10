import { assign, setup, type SnapshotFrom } from "xstate";

/*
 * Central export lifecycle machine (spec: 3d-export-reliability, design D7).
 * Adapted from feat/architecture-evolution's central machine: the workbench
 * model stays in `ipodWorkbenchReducer` (no duplication); only the export
 * lifecycle is promoted to a statechart, because that's where ad-hoc string
 * unions kept letting impossible states slip through (stuck veils, double
 * exports, late callbacks mutating a finished export).
 *
 *   idle → preparing → rendering → encoding → saving → idle
 *                    ↘ ─ ─ ─ ─ ─ FAIL ─ ─ ─ ─ ─ ↘ error → (RESET) → idle
 *
 * The machine is pure lifecycle — all side effects (recorder, blob download,
 * clock pin/restore) live in the stage, which reports milestones as events.
 * XState guarantees the invariants the spec demands: re-entrancy is impossible
 * (EXPORT only handled in idle), and stale async callbacks after a reset are
 * ignored (PROGRESS/ENCODED/SAVED mean nothing in idle).
 */

/** What's being exported — mirrors the veil's `Ipod3DExportState` minus "idle". */
export type ExportJobId = `png:${string}` | `clip:${string}`;

export interface ExportMachineContext {
	job: ExportJobId | null;
	/** 0–1 encode progress; null = indeterminate (stills show a scanning bar). */
	progress: number | null;
	error: string | null;
}

export type ExportMachineEvent =
	| { type: "EXPORT"; job: ExportJobId; progress: number | null }
	| { type: "PREPARED" }
	| { type: "PROGRESS"; encoded: number; total: number }
	| { type: "ENCODED" }
	| { type: "SAVED" }
	| { type: "FAIL"; error: string }
	| { type: "RESET" };

const IDLE_CONTEXT: ExportMachineContext = { job: null, progress: null, error: null };

export const exportMachine = setup({
	types: {
		context: {} as ExportMachineContext,
		events: {} as ExportMachineEvent,
	},
	actions: {
		clearContext: assign(() => IDLE_CONTEXT),
		assignProgress: assign({
			progress: ({ event }) =>
				event.type === "PROGRESS" && event.total > 0
					? Math.min(1, Math.max(0, event.encoded / event.total))
					: null,
		}),
		recordFailure: assign({
			error: ({ event }) => (event.type === "FAIL" ? event.error : null),
		}),
	},
	guards: {
		/** Last frame handed to the encoder — the flush (encode tail) begins. */
		isFinalFrame: ({ event }) =>
			event.type === "PROGRESS" && event.total > 0 && event.encoded >= event.total,
	},
}).createMachine({
	id: "ipod3dExport",
	initial: "idle",
	context: IDLE_CONTEXT,
	states: {
		idle: {
			on: {
				EXPORT: {
					target: "preparing",
					actions: assign({
						job: ({ event }) => event.job,
						progress: ({ event }) => event.progress,
						error: () => null,
					}),
				},
			},
		},
		preparing: {
			on: {
				PREPARED: { target: "rendering" },
				FAIL: { target: "error", actions: "recordFailure" },
				RESET: { target: "idle", actions: "clearContext" },
			},
		},
		rendering: {
			on: {
				PROGRESS: [
					{ guard: "isFinalFrame", target: "encoding", actions: "assignProgress" },
					{ actions: "assignProgress" },
				],
				ENCODED: { target: "saving" },
				FAIL: { target: "error", actions: "recordFailure" },
				RESET: { target: "idle", actions: "clearContext" },
			},
		},
		encoding: {
			on: {
				PROGRESS: { actions: "assignProgress" },
				ENCODED: { target: "saving" },
				FAIL: { target: "error", actions: "recordFailure" },
				RESET: { target: "idle", actions: "clearContext" },
			},
		},
		saving: {
			on: {
				SAVED: { target: "idle", actions: "clearContext" },
				FAIL: { target: "error", actions: "recordFailure" },
				RESET: { target: "idle", actions: "clearContext" },
			},
		},
		error: {
			on: {
				RESET: { target: "idle", actions: "clearContext" },
			},
		},
	},
});

export type ExportMachineSnapshot = SnapshotFrom<typeof exportMachine>;

/** The active job, or null when idle/errored — drives the veil's headline. */
export function exportJobOf(snapshot: ExportMachineSnapshot): ExportJobId | null {
	return snapshot.context.job;
}

/** Encode progress for the veil bar; null = indeterminate scan. */
export function exportProgressOf(snapshot: ExportMachineSnapshot): number | null {
	return snapshot.context.progress;
}
