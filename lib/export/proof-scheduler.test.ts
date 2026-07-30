import { describe, expect, it, vi } from "vitest";

import type { ExportSnapshot } from "./export-fingerprint";
import { createProofStore } from "./proof-cache";
import { createProofRenderQueue } from "./proof-render-queue";
import { createProofScheduler } from "./proof-scheduler";
import type { TimelineProofPlan } from "./timeline-proof";

/** Let the detached queue thunk (render → put → onStored) settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Drain a chain of single-flight renders — the queue starts one only as the last settles. */
async function settle(): Promise<void> {
	for (let i = 0; i < 20; i++) await flush();
}

function snapshot(title: string, azimuth = 10): ExportSnapshot {
	return {
		pose: { azimuth, elevation: 5, reach: 2, target: [0, 0, 0] },
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
		motion: {
			docId: "orbit",
			docHash: "aaaa1111",
			repeat: 1,
			durationSec: 5,
			timeMap: { kind: "loop" },
		},
	};
}

/**
 * A timeline plan with distinct per-frame poses, so the ORDER and the POSE of each render is
 * observable. Built by hand rather than via `planTimelineProof`: this file tests the walk, and
 * `timeline-proof.test.ts` tests the derivation.
 */
function plan(key: string, positions: readonly number[]): TimelineProofPlan {
	return {
		key,
		frames: positions.map((position, index) => ({
			key: `${key}:${index}`,
			position,
			pose: { azimuth: 100 + index * 100, elevation: 5, reach: 2, target: [0, 0, 0] },
		})),
	};
}

function harness(opts?: { exporting?: boolean; block?: boolean }) {
	const store = createProofStore({ max: 30 });
	const queue = createProofRenderQueue();
	const rendered: ExportSnapshot[] = [];
	let release = (): void => {};
	const gate = opts?.block ? new Promise<void>((r) => (release = r)) : null;
	const render = vi.fn(async (snapshot: ExportSnapshot) => {
		rendered.push(snapshot);
		if (gate) await gate;
		return new Blob(["png"]);
	});
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
	return {
		store,
		queue,
		render,
		rendered,
		onStored,
		scheduler,
		release: () => release(),
		/** The azimuths rendered, in order — the anchor is 10, frame N is 100 + 100N. */
		azimuths: () => rendered.map((s) => s.pose.azimuth),
		setExporting: (v: boolean) => (exporting = v),
	};
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

/**
 * §5.5 — the timeline walk. The plan is data; this is the ONE queue that renders it, so a
 * timeline warm still yields to a real export bake and still never runs two renders at once.
 */
describe("createProofScheduler — timeline plan", () => {
	it("warms every planned frame at its own pose once the plan key is stable", async () => {
		const h = harness();
		const snap = snapshot("a");
		const p = plan("T", [0, 0.5]);

		h.scheduler.tick("A", snap, p);
		await settle();
		expect(h.azimuths()).toEqual([]); // first sighting — the plan is not yet stable

		h.scheduler.tick("A", snap, p);
		await settle();
		// Anchor first, then one render per planned position, each at the frame's own pose.
		expect(h.azimuths()).toEqual([10, 100, 200]);
	});

	it("stores each frame under its own key, carrying the pose that produced it", async () => {
		const h = harness();
		const snap = snapshot("a");
		const p = plan("T", [0, 0.5]);
		h.scheduler.tick("A", snap, p);
		h.scheduler.tick("A", snap, p);
		await settle();

		// Provenance has to name the frame's pose, not the anchor's — a record that claimed the
		// hero pose produced a mid-clip frame would restore the wrong camera on re-open.
		expect(h.store.peek("T:0")?.snapshot.pose.azimuth).toBe(100);
		expect(h.store.peek("T:1")?.snapshot.pose.azimuth).toBe(200);
		expect(h.store.peek("A")?.snapshot.pose.azimuth).toBe(10);
		expect(h.onStored).toHaveBeenCalledWith("T:1");
	});

	it("resets timeline stability on a document change while the anchor key holds", async () => {
		const h = harness();
		const snap = snapshot("a");

		h.scheduler.tick("A", snap, plan("T1", [0, 0.5]));
		h.scheduler.tick("A", snap, plan("T1", [0, 0.5]));
		await settle();
		expect(h.render).toHaveBeenCalledTimes(3);

		// Switching documents keeps `proofFingerprint` and moves `timelineFingerprint` (§5.7).
		// Gating the walk on the ANCHOR's stability would therefore warm a whole set on the
		// first tick of every document — a catalogue browse or a curve drag would burst renders.
		h.scheduler.tick("A", snap, plan("T2", [0, 0.5]));
		await settle();
		expect(h.render).toHaveBeenCalledTimes(3);

		h.scheduler.tick("A", snap, plan("T2", [0, 0.5]));
		await settle();
		expect(h.render).toHaveBeenCalledTimes(5);
	});

	it("skips a planned frame already in the cache", async () => {
		const h = harness();
		const snap = snapshot("a");
		const p = plan("T", [0, 0.5]);
		await h.store.put({ fingerprint: "T:0", snapshot: snap, blob: new Blob(["x"]), createdAt: 1 });

		h.scheduler.tick("A", snap, p);
		h.scheduler.tick("A", snap, p);
		await settle();
		expect(h.azimuths()).toEqual([10, 200]);
	});

	it("lets a new anchor overtake pending timeline frames", async () => {
		const h = harness({ block: true });
		const a = snapshot("a", 10);
		const p = plan("T", [0, 0.5]);

		h.scheduler.tick("A", a, p);
		h.scheduler.tick("A", a, p); // anchor A starts and blocks; both frames pend
		await flush();
		expect(h.azimuths()).toEqual([10]);

		const b = snapshot("b", 11);
		h.scheduler.tick("B", b);
		h.scheduler.tick("B", b); // a real anchor, enqueued behind two best-effort frames

		h.release();
		await settle();
		// B jumps the queue: the frame the user is looking at outranks a speculative strip.
		expect(h.azimuths()).toEqual([10, 11, 100, 200]);
	});

	it("does not warm timeline frames during a real export bake", async () => {
		const h = harness({ exporting: true });
		const snap = snapshot("a");
		const p = plan("T", [0, 0.5]);
		h.scheduler.tick("A", snap, p);
		h.scheduler.tick("A", snap, p);
		await settle();
		expect(h.render).not.toHaveBeenCalled();
	});
});
