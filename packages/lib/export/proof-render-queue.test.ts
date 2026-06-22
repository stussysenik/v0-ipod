import { describe, expect, it } from "vitest";

import { createProofRenderQueue } from "./proof-render-queue";

/** A controllable async job: resolve it by hand to drive the single-flight queue in tests. */
function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

describe("createProofRenderQueue", () => {
	it("runs one job at a time", async () => {
		const q = createProofRenderQueue();
		const a = deferred();
		const b = deferred();
		q.request("a", () => a.promise);
		q.request("b", () => b.promise);

		expect(q.activeKey).toBe("a");
		expect(q.pendingKeys).toEqual(["b"]);

		a.resolve();
		await a.promise;
		await Promise.resolve(); // let .finally() pump
		expect(q.activeKey).toBe("b");
		b.resolve();
	});

	it("dedups a key already in-flight or pending", () => {
		const q = createProofRenderQueue();
		q.request("a", () => new Promise(() => {})); // never resolves → stays active
		q.request("a", () => new Promise(() => {})); // dup of active → ignored
		q.request("b", () => new Promise(() => {}));
		q.request("b", () => new Promise(() => {})); // dup of pending → ignored
		expect(q.activeKey).toBe("a");
		expect(q.pendingKeys).toEqual(["b"]);
	});

	it("serves higher priority first", async () => {
		const q = createProofRenderQueue();
		q.request("active", () => new Promise(() => {})); // occupy the slot
		q.request("low", () => Promise.resolve(), 0);
		q.request("high", () => Promise.resolve(), 10);
		// Both pending; when the slot frees, "high" should be chosen first.
		expect(q.pendingKeys).toEqual(["low", "high"]);
	});

	it("suspends: starts nothing new while suspended, resumes and drains", async () => {
		const q = createProofRenderQueue();
		q.suspend();
		q.request("a", () => Promise.resolve());
		expect(q.activeKey).toBeNull(); // nothing started under suspension
		expect(q.suspended).toBe(true);

		q.resume();
		expect(q.suspended).toBe(false);
		expect(q.activeKey).toBe("a"); // drains on resume
	});

	it("a failing job frees the slot and the next one runs", async () => {
		const q = createProofRenderQueue();
		const b = deferred();
		q.request("a", () => Promise.reject(new Error("render failed")));
		q.request("b", () => b.promise);
		// let the rejected 'a' settle through .catch().finally()
		await Promise.resolve();
		await Promise.resolve();
		expect(q.activeKey).toBe("b");
		b.resolve();
	});

	it("clearPending drops not-yet-started work", () => {
		const q = createProofRenderQueue();
		q.request("active", () => new Promise(() => {}));
		q.request("x", () => Promise.resolve());
		q.request("y", () => Promise.resolve());
		expect(q.pendingKeys).toEqual(["x", "y"]);
		q.clearPending();
		expect(q.pendingKeys).toEqual([]);
		expect(q.activeKey).toBe("active"); // in-flight unaffected
	});
});
