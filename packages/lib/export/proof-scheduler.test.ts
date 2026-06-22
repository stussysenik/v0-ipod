import { describe, expect, it, vi } from "vitest";

import type { ExportSnapshot } from "./export-fingerprint";
import { createProofStore } from "./proof-cache";
import { createProofRenderQueue } from "./proof-render-queue";
import { createProofScheduler } from "./proof-scheduler";

/** Let the detached queue thunk (render → put → onStored) settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

function snapshot(title: string): ExportSnapshot {
	return {
		pose: { azimuth: 10, elevation: 5, reach: 2, target: [0, 0, 0] },
		aspect: "story",
		quality: "standard",
		metadata: { title, artist: "a", album: "b", currentTime: 0, duration: 100 },
		marquee: false,
		batteryLevel: 0.5,
		osScreen: "now-playing",
		presentation: {
			skinColor: "#fff",
			bgColor: "#fff",
			ringColor: "#ccc",
			centerColor: "#ddd",
			backColor: "#cfd3d7",
			edgeColor: "#cfd3d7",
			bezelColor: "#0a0a0a",
			hardwarePreset: "classic-2008",
		},
		lighting: { name: "rig" },
		move: "orbit",
		loop: "loop",
		speed: 1,
		durationSec: 5,
	};
}

function harness(opts?: { exporting?: boolean }) {
	const store = createProofStore({ max: 10 });
	const queue = createProofRenderQueue();
	const render = vi.fn(async () => new Blob(["png"]));
	const onStored = vi.fn();
	let exporting = opts?.exporting ?? false;
	const scheduler = createProofScheduler({
		store,
		queue,
		render,
		now: () => 1,
		isExporting: () => exporting,
		onStored,
	});
	return { store, queue, render, onStored, scheduler, setExporting: (v: boolean) => (exporting = v) };
}

describe("createProofScheduler", () => {
	it("does not render until a key is stable across two ticks", async () => {
		const h = harness();
		const snap = snapshot("song");
		h.scheduler.tick("A", snap);
		await flush();
		expect(h.render).not.toHaveBeenCalled(); // first sighting — not yet stable

		h.scheduler.tick("A", snap);
		await flush();
		expect(h.render).toHaveBeenCalledTimes(1); // stable → render
	});

	it("resets stability when the key changes mid-stream", async () => {
		const h = harness();
		h.scheduler.tick("A", snapshot("a"));
		h.scheduler.tick("B", snapshot("b")); // changed → A never rendered
		await flush();
		expect(h.render).not.toHaveBeenCalled();

		h.scheduler.tick("B", snapshot("b")); // B now stable
		await flush();
		expect(h.render).toHaveBeenCalledTimes(1);
	});

	it("yields to a real export bake", async () => {
		const h = harness({ exporting: true });
		h.scheduler.tick("A", snapshot("a"));
		h.scheduler.tick("A", snapshot("a"));
		await flush();
		expect(h.render).not.toHaveBeenCalled();
	});

	it("skips a key already cached in memory", async () => {
		const h = harness();
		await h.store.put({ fingerprint: "A", snapshot: snapshot("a"), blob: new Blob(["x"]), createdAt: 1 });
		h.scheduler.tick("A", snapshot("a"));
		h.scheduler.tick("A", snapshot("a"));
		await flush();
		expect(h.render).not.toHaveBeenCalled();
	});

	it("stores the rendered frame and notifies", async () => {
		const h = harness();
		const snap = snapshot("a");
		h.scheduler.tick("A", snap);
		h.scheduler.tick("A", snap);
		await flush();
		expect(h.store.peek("A")?.snapshot).toBe(snap);
		expect(h.onStored).toHaveBeenCalledWith("A");
	});

	it("does not double-render while a key is in flight", async () => {
		const h = harness();
		const snap = snapshot("a");
		h.scheduler.tick("A", snap);
		h.scheduler.tick("A", snap); // enqueues
		h.scheduler.tick("A", snap); // in-flight → queue dedups
		await flush();
		expect(h.render).toHaveBeenCalledTimes(1);
	});
});
