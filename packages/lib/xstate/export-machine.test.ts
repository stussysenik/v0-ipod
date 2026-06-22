import { describe, expect, it } from "vitest";
import { createActor } from "xstate";

import { exportMachine, exportJobOf, exportProgressOf } from "./export-machine";

/*
 * Spec: 3d-export-reliability — "Export lifecycle SHALL be governed by a
 * central XState machine (idle → preparing → rendering → encoding → saving →
 * idle | error) that derives the veil/progress UI, forbids concurrent exports,
 * and always returns to idle."
 *
 * The machine is pure lifecycle: side effects (recorder, downloads, clock
 * restore) stay in the stage, which sends events at each pipeline milestone.
 */
function startActor() {
	const actor = createActor(exportMachine);
	actor.start();
	return actor;
}

describe("export machine", () => {
	it("walks the full clip lifecycle: idle → preparing → rendering → encoding → saving → idle", () => {
		const actor = startActor();
		expect(actor.getSnapshot().value).toBe("idle");

		actor.send({ type: "EXPORT", job: "clip:orbit", progress: 0 });
		expect(actor.getSnapshot().value).toBe("preparing");
		expect(exportJobOf(actor.getSnapshot())).toBe("clip:orbit");
		expect(exportProgressOf(actor.getSnapshot())).toBe(0);

		actor.send({ type: "PREPARED" });
		expect(actor.getSnapshot().value).toBe("rendering");

		actor.send({ type: "PROGRESS", encoded: 30, total: 120 });
		expect(actor.getSnapshot().value).toBe("rendering");
		expect(exportProgressOf(actor.getSnapshot())).toBeCloseTo(0.25, 6);

		// Final frame submitted → encoder flush phase.
		actor.send({ type: "PROGRESS", encoded: 120, total: 120 });
		expect(actor.getSnapshot().value).toBe("encoding");
		expect(exportProgressOf(actor.getSnapshot())).toBe(1);

		actor.send({ type: "ENCODED" });
		expect(actor.getSnapshot().value).toBe("saving");

		actor.send({ type: "SAVED" });
		expect(actor.getSnapshot().value).toBe("idle");
		expect(exportJobOf(actor.getSnapshot())).toBeNull();
		expect(exportProgressOf(actor.getSnapshot())).toBeNull();
	});

	it("supports the still path: indeterminate progress, no encode-progress events", () => {
		const actor = startActor();
		actor.send({ type: "EXPORT", job: "png:hero", progress: null });
		expect(actor.getSnapshot().value).toBe("preparing");
		expect(exportProgressOf(actor.getSnapshot())).toBeNull();

		actor.send({ type: "PREPARED" });
		actor.send({ type: "ENCODED" }); // captureHighRes resolved
		expect(actor.getSnapshot().value).toBe("saving");
		actor.send({ type: "SAVED" });
		expect(actor.getSnapshot().value).toBe("idle");
	});

	it("blocks re-entrant exports with no side effects (machine guard)", () => {
		const actor = startActor();
		actor.send({ type: "EXPORT", job: "clip:orbit", progress: 0 });
		actor.send({ type: "PREPARED" });
		actor.send({ type: "PROGRESS", encoded: 10, total: 120 });

		const before = actor.getSnapshot();
		actor.send({ type: "EXPORT", job: "png:front", progress: null });
		const after = actor.getSnapshot();

		expect(after.value).toBe(before.value);
		expect(exportJobOf(after)).toBe("clip:orbit");
		expect(exportProgressOf(after)).toBe(exportProgressOf(before));
	});

	it("records the failure and reaches error from any active state", () => {
		for (const advance of [0, 1, 2, 3] as const) {
			const actor = startActor();
			actor.send({ type: "EXPORT", job: "clip:turntable", progress: 0 });
			if (advance >= 1) actor.send({ type: "PREPARED" });
			if (advance >= 2) actor.send({ type: "PROGRESS", encoded: 120, total: 120 });
			if (advance >= 3) actor.send({ type: "ENCODED" });

			actor.send({ type: "FAIL", error: "encoder exploded" });
			const snapshot = actor.getSnapshot();
			expect(snapshot.value).toBe("error");
			expect(snapshot.context.error).toBe("encoder exploded");

			// RESET always returns to a clean idle (scene restore happens in the stage).
			actor.send({ type: "RESET" });
			const reset = actor.getSnapshot();
			expect(reset.value).toBe("idle");
			expect(exportJobOf(reset)).toBeNull();
			expect(reset.context.error).toBeNull();
		}
	});

	it("treats RESET mid-flight as cancellation back to a clean idle", () => {
		const actor = startActor();
		actor.send({ type: "EXPORT", job: "clip:orbit", progress: 0 });
		actor.send({ type: "PREPARED" });
		actor.send({ type: "RESET" });
		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("idle");
		expect(exportJobOf(snapshot)).toBeNull();
		expect(exportProgressOf(snapshot)).toBeNull();
	});

	it("ignores stale pipeline events once idle (late callbacks cannot corrupt state)", () => {
		const actor = startActor();
		actor.send({ type: "EXPORT", job: "clip:orbit", progress: 0 });
		actor.send({ type: "RESET" });

		actor.send({ type: "PROGRESS", encoded: 60, total: 120 });
		actor.send({ type: "ENCODED" });
		actor.send({ type: "SAVED" });

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("idle");
		expect(exportProgressOf(snapshot)).toBeNull();
	});
});
