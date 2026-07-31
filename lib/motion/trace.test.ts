import { describe, expect, it } from "vitest";

import { CATALOGUE_DOCS } from "./catalogue";
import type { MotionDoc } from "./doc";
import { motionTrace, TRACE_SAMPLES } from "./trace";
import { orderedTrackKeys } from "./track-edit";

const ORBIT = CATALOGUE_DOCS.orbit;
const TURNTABLE = CATALOGUE_DOCS.turntable;

/** A two-keyframe rise on an overshooting curve — the case that forces sampled normalisation. */
const OVERSHOOT: MotionDoc = {
	id: "overshoot",
	label: "Overshoot",
	naturalCycleSeconds: 4,
	loopable: false,
	tracks: {
		azimuth: {
			keyframes: [
				{ at: 0, value: 0, easing: "easeInOutBack" },
				{ at: 1, value: 10 },
			],
		},
	},
};

/** Every keyframe at zero: a held axis, or one dialled to gain 0. */
const HELD: MotionDoc = {
	id: "held",
	label: "Held",
	naturalCycleSeconds: 4,
	loopable: true,
	tracks: {
		azimuth: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 0 }, { at: 1, value: 0 }] },
		elevation: { keyframes: [{ at: 0, value: 0 }, { at: 1, value: 12 }] },
	},
};

describe("the trace frame — x is phase, y is normalised, both fill the box", () => {
	it("spans the cycle exactly, from 0 to 1", () => {
		// The polyline has to reach both edges or the picture implies motion that stops short.
		const trace = motionTrace(TURNTABLE);
		for (const line of trace.lines) {
			expect(line.points[0][0]).toBe(0);
			expect(line.points[line.points.length - 1][0]).toBe(1);
		}
	});

	it("keeps every y inside the frame, on every shipped move", () => {
		for (const doc of Object.values(CATALOGUE_DOCS)) {
			for (const line of motionTrace(doc).lines) {
				for (const [, y] of line.points) {
					expect(y).toBeGreaterThanOrEqual(0);
					expect(y).toBeLessThanOrEqual(1);
				}
			}
		}
	});

	it("gives every line the same point count, so a playhead maps by index", () => {
		const trace = motionTrace(ORBIT);
		expect(trace.samples).toBe(TRACE_SAMPLES);
		for (const line of trace.lines) expect(line.points).toHaveLength(TRACE_SAMPLES);
	});

	it("clamps to the two points a line needs", () => {
		// `i / (count - 1)` divides by zero at one sample, and a single point is not a line.
		expect(motionTrace(ORBIT, 1).samples).toBe(2);
		expect(motionTrace(ORBIT, 0).lines[0].points).toHaveLength(2);
	});
});

describe("the trace shape — what the picture claims about the move", () => {
	it("draws a full turn as a rise that reaches the top, not a sawtooth", () => {
		// Phase 1 IS phase 0, so sampling the closing point at 1 would read the opening value
		// and drop the ramp off a cliff the camera never drives over. Read just shy of the seam.
		const azimuth = motionTrace(TURNTABLE).lines.find((line) => line.key === "azimuth");
		expect(azimuth).toBeDefined();
		const ys = azimuth!.points.map(([, y]) => y);
		for (let i = 1; i < ys.length; i += 1) expect(ys[i]).toBeGreaterThan(ys[i - 1]);
		expect(ys[ys.length - 1]).toBeGreaterThan(0.99);
	});

	it("distinguishes two axes of one move — the whole reason a trace beats a name", () => {
		// Orbit's azimuth is a sine and its elevation a cosine; a picture that drew them alike
		// would be showing the mechanical single-grid motion this change exists to replace.
		const trace = motionTrace(ORBIT);
		const azimuth = trace.lines.find((line) => line.key === "azimuth")!.points;
		const elevation = trace.lines.find((line) => line.key === "elevation")!.points;
		const apart = azimuth.some(([, y], i) => Math.abs(y - elevation[i][1]) > 0.1);
		expect(apart).toBe(true);
	});

	it("normalises by the sampled extent, not by the keyframes", () => {
		// `easeInOutBack` dips below its first keyframe before it climbs. Normalising by the
		// authored 0…10 would draw that dip outside the frame; normalising by what was sampled
		// puts the frame's floor at the dip, which is somewhere after the start.
		const [line] = motionTrace(OVERSHOOT).lines;
		const ys = line.points.map(([, y]) => y);
		expect(Math.min(...ys)).toBe(0);
		expect(Math.max(...ys)).toBe(1);
		expect(ys.indexOf(0)).toBeGreaterThan(0);
	});

	it("draws an axis with no extent down the middle and says it is flat", () => {
		const trace = motionTrace(HELD);
		const azimuth = trace.lines.find((line) => line.key === "azimuth")!;
		const elevation = trace.lines.find((line) => line.key === "elevation")!;
		expect(azimuth.flat).toBe(true);
		for (const [, y] of azimuth.points) expect(y).toBe(0.5);
		expect(elevation.flat).toBe(false);
	});

	it("orders lines the way the Tracks rows are ordered", () => {
		// One order for the picture and the list, or the eye has to re-map between them.
		const trace = motionTrace(ORBIT);
		expect(trace.lines.map((line) => line.key)).toEqual(orderedTrackKeys(ORBIT.tracks));
	});

	it("returns no lines for a document with no tracks", () => {
		const empty: MotionDoc = { ...ORBIT, tracks: {} };
		expect(motionTrace(empty).lines).toEqual([]);
		expect(motionTrace(empty).samples).toBe(TRACE_SAMPLES);
	});
});

describe("determinism — the property that lets a caller memoise this", () => {
	it("returns the same numbers on every call", () => {
		// No clock, no random: the trace is a pure function of the document, which is what
		// makes it safe to cache against `motionDocHash` rather than recompute per frame.
		expect(motionTrace(ORBIT)).toEqual(motionTrace(ORBIT));
		expect(motionTrace(TURNTABLE, 12)).toEqual(motionTrace(TURNTABLE, 12));
	});
});
