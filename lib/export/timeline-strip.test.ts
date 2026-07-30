import { describe, expect, it } from "vitest";

import { DEFAULT_PROOF_POSITIONS } from "@/lib/motion/doc";

import type { FingerprintPose } from "./export-fingerprint";
import { nearestFrameIndex, timelineStripCells } from "./timeline-strip";
import type { TimelineProofFrame } from "./timeline-proof";

/**
 * THE STRIP READS THE PLAN, IT DOES NOT RE-DERIVE IT.
 *
 * Every assertion here is about the three things a filmstrip adds on top of the plan: the time
 * it states, the cell the playhead is nearest, and readiness resolved per KEY. Poses are never
 * touched — `timeline-proof.test.ts` owns whether the plan proves the right frames.
 */

const POSE: FingerprintPose = { azimuth: 0, elevation: 0, reach: 2, target: [0, 0, 0] };

/** Frames as the plan emits them: `timelineFrameKey(setKey, index)` order-carrying keys. */
function framesAt(positions: readonly number[]): TimelineProofFrame[] {
	return positions.map((position, index) => ({
		key: `set:${index}`,
		position,
		pose: POSE,
	}));
}

const READY_NONE = () => false;
const READY_ALL = () => true;

describe("timelineStripCells", () => {
	it("states the clip time each frame proves, at the transport's precision", () => {
		const cells = timelineStripCells(framesAt(DEFAULT_PROOF_POSITIONS), {
			durationSec: 5,
			playhead: 0,
			ready: READY_ALL,
		});
		expect(cells.map((cell) => cell.label)).toEqual(["0.0s", "1.3s", "2.5s", "3.8s", "5.0s"]);
	});

	it("scales the labels with the clip length", () => {
		const cells = timelineStripCells(framesAt(DEFAULT_PROOF_POSITIONS), {
			durationSec: 30,
			playhead: 0,
			ready: READY_ALL,
		});
		expect(cells.map((cell) => cell.label)).toEqual([
			"0.0s",
			"7.5s",
			"15.0s",
			"22.5s",
			"30.0s",
		]);
	});

	/**
	 * `proofPositions` heals but does not sort, and the frame key carries its index — a strip
	 * that sorted would show a cell's label above another cell's cached frame.
	 */
	it("keeps the document's order rather than sorting by position", () => {
		const cells = timelineStripCells(framesAt([0.5, 0, 0.25]), {
			durationSec: 4,
			playhead: 1,
			ready: READY_ALL,
		});
		expect(cells.map((cell) => cell.position)).toEqual([0.5, 0, 0.25]);
		expect(cells.map((cell) => cell.key)).toEqual(["set:0", "set:1", "set:2"]);
		expect(cells.map((cell) => cell.label)).toEqual(["2.0s", "0.0s", "1.0s"]);
	});

	/** Readiness is a property of the KEY, so an out-of-order set cannot mark the wrong cell. */
	it("resolves readiness per key, not per index", () => {
		const cells = timelineStripCells(framesAt([0.5, 0, 0.25]), {
			durationSec: 4,
			playhead: 0,
			ready: (key) => key === "set:2",
		});
		expect(cells.map((cell) => cell.ready)).toEqual([false, false, true]);
	});

	it("marks exactly one cell nearest, and none when the set is empty", () => {
		const cells = timelineStripCells(framesAt(DEFAULT_PROOF_POSITIONS), {
			durationSec: 5,
			playhead: 0.6,
			ready: READY_NONE,
		});
		expect(cells.filter((cell) => cell.nearest)).toHaveLength(1);
		expect(cells.findIndex((cell) => cell.nearest)).toBe(2); // 0.5 is nearer than 0.75
		expect(
			timelineStripCells([], { durationSec: 5, playhead: 0.6, ready: READY_NONE }),
		).toEqual([]);
	});

	/** A miss is "computing", never "absent" — the cell still exists and still carries its time. */
	it("keeps a missing frame's row and its label", () => {
		const cells = timelineStripCells(framesAt([0.25]), {
			durationSec: 8,
			playhead: 0,
			ready: READY_NONE,
		});
		expect(cells).toEqual([
			{ key: "set:0", position: 0.25, label: "2.0s", ready: false, nearest: true },
		]);
	});
});

describe("nearestFrameIndex", () => {
	it("is -1 for an empty set", () => {
		expect(nearestFrameIndex([], 0.5)).toBe(-1);
	});

	it("resolves a tie to the lower index", () => {
		// 0.375 sits exactly between 0.25 and 0.5.
		expect(nearestFrameIndex(framesAt(DEFAULT_PROOF_POSITIONS), 0.375)).toBe(1);
	});

	it("tracks the playhead across the whole clip", () => {
		const frames = framesAt(DEFAULT_PROOF_POSITIONS);
		expect(nearestFrameIndex(frames, 0)).toBe(0);
		expect(nearestFrameIndex(frames, 0.2)).toBe(1);
		expect(nearestFrameIndex(frames, 0.49)).toBe(2);
		expect(nearestFrameIndex(frames, 0.8)).toBe(3);
		expect(nearestFrameIndex(frames, 0.9999)).toBe(4);
	});

	/** Distance, not index proportion: authored positions need not be evenly spaced. */
	it("measures distance rather than assuming even spacing", () => {
		const frames = framesAt([0, 0.05, 0.1, 0.95]);
		// Three proofs crowd the opening and one sits at the end: at 0.5 the nearest is the
		// third cell (0.4 away), not the last one, even though the last is the only cell after it.
		expect(nearestFrameIndex(frames, 0.5)).toBe(2);
		expect(nearestFrameIndex(frames, 0.6)).toBe(3);
		expect(nearestFrameIndex(frames, 0.07)).toBe(1);
	});
});
