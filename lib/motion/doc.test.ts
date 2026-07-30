import { describe, expect, it } from "vitest";

import { EASINGS } from "../theatre/easings";
import {
	createMotionSampler,
	easeName,
	motionDocHash,
	resolveEase,
	sampleMotionDoc,
	type MotionDoc,
} from "./doc";

/**
 * The motion format's invariants.
 *
 * Three of these guard defects the closed system actually shipped: easings that
 * could only be named (so "a little not right" had no adjustment), one shared
 * keyframe grid across every axis (so motion could only ever arrive all at once),
 * and a hash that would have invalidated cached export frames on a rename.
 */

function doc(tracks: MotionDoc["tracks"], id = "test"): MotionDoc {
	return { id, label: "Test", tracks, loopable: true, naturalCycleSeconds: 6 };
}

/** A plain two-keyframe ramp from 0 to 1 with the given curve. */
function ramp(easing?: MotionDoc["tracks"][string]["keyframes"][number]["easing"]) {
	return { keyframes: [{ at: 0, value: 0, easing }, { at: 1, value: 1 }] };
}

describe("easing at the format boundary", () => {
	it("clamps X into [0,1] and leaves Y free — X is time, Y is expression", () => {
		expect(resolveEase([1.4, 0, 0.6, 1])).toEqual([1, 0, 0.6, 1]);
		expect(resolveEase([-0.3, 0, 0.6, 1])).toEqual([0, 0, 0.6, 1]);
		// Y is untouched in both directions: this is overshoot, and it is a feature.
		expect(resolveEase([0.34, 1.56, 0.64, 1])).toEqual([0.34, 1.56, 0.64, 1]);
		expect(resolveEase([0.36, 0, 0.66, -0.56])).toEqual([0.36, 0, 0.66, -0.56]);
	});

	it("a Y control point outside [0,1] overshoots the keyframe range", () => {
		const sampler = createMotionSampler(doc({ azimuth: ramp([0.34, 1.56, 0.64, 1]) }));
		let peak = 0;
		for (let i = 0; i <= 200; i++) {
			peak = Math.max(peak, sampler.sample("azimuth", i / 200));
		}
		expect(peak).toBeGreaterThan(1.0001);
	});

	it("a clamped X curve stays monotonic in time", () => {
		const sampler = createMotionSampler(doc({ azimuth: ramp([1.4, 0, 0.6, 1]) }));
		let previous = Number.NEGATIVE_INFINITY;
		// A cycle is half-open: phase 1 is the next cycle's 0, so sample [0,1).
		for (let i = 0; i < 200; i++) {
			const value = sampler.sample("azimuth", i / 200);
			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
			previous = value;
		}
	});

	it("treats phase 1 as the next cycle's phase 0", () => {
		const sampler = createMotionSampler(doc({ azimuth: ramp("linear") }));
		expect(sampler.sample("azimuth", 1)).toBe(sampler.sample("azimuth", 0));
		expect(sampler.sample("azimuth", 1.25)).toBeCloseTo(sampler.sample("azimuth", 0.25), 12);
	});

	it("a named curve and its literal tuple are the same value", () => {
		const named = createMotionSampler(doc({ a: ramp("easeOutCubic") }));
		const literal = createMotionSampler(doc({ a: ramp(EASINGS.easeOutCubic) }));
		for (let i = 0; i <= 50; i++) {
			const phase = i / 50;
			expect(named.sample("a", phase)).toBeCloseTo(literal.sample("a", phase), 12);
		}
	});

	it("names a curve that matches the vocabulary and reports the rest as custom", () => {
		expect(easeName(EASINGS.easeOutCubic)).toBe("easeOutCubic");
		expect(easeName("easeInOutSine")).toBe("easeInOutSine");
		expect(easeName([0.11, 0.42, 0.73, 0.19])).toBeNull();
	});
});

describe("tracks are independent", () => {
	it("each axis interpolates on its own grid without constraining the others", () => {
		const sampled = sampleMotionDoc(
			doc({
				azimuth: {
					keyframes: [
						{ at: 0, value: 0 },
						{ at: 0.25, value: 20 },
						{ at: 0.5, value: 0 },
						{ at: 0.75, value: -20 },
						{ at: 1, value: 0 },
					],
				},
				elevation: {
					keyframes: [
						{ at: 0, value: 0 },
						{ at: 1, value: 10 },
					],
				},
			}),
			0.25,
		);
		expect(sampled.azimuth).toBeCloseTo(20, 6);
		// Two keyframes, so elevation is still climbing where azimuth has already peaked.
		expect(sampled.elevation).toBeGreaterThan(0);
		expect(sampled.elevation).toBeLessThan(10);
	});

	it("an absent track samples as zero offset rather than throwing", () => {
		expect(createMotionSampler(doc({ a: ramp() })).sample("nope", 0.4)).toBe(0);
	});
});

describe("per-track phase offset", () => {
	const shifted = doc({
		azimuth: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 10 }, { at: 1, value: 0 }], phase: 0.15 },
		elevation: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 4 }, { at: 1, value: 0 }] },
	});
	const unshifted = doc({
		azimuth: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 10 }, { at: 1, value: 0 }] },
		elevation: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 4 }, { at: 1, value: 0 }] },
	});

	it("shifts only its own track — every other track is bit-identical", () => {
		const a = createMotionSampler(shifted);
		const b = createMotionSampler(unshifted);
		for (let i = 0; i <= 100; i++) {
			const phase = i / 100;
			expect(a.sample("elevation", phase)).toBe(b.sample("elevation", phase));
		}
	});

	it("reads the shifted track at (phase + offset) mod 1", () => {
		const a = createMotionSampler(shifted);
		const b = createMotionSampler(unshifted);
		for (const phase of [0, 0.2, 0.5, 0.9, 0.95]) {
			expect(a.sample("azimuth", phase)).toBeCloseTo(b.sample("azimuth", (phase + 0.15) % 1), 12);
		}
	});

	it("wraps negative offsets into range instead of clamping to the first keyframe", () => {
		const back = createMotionSampler(
			doc({ a: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 10 }, { at: 1, value: 0 }], phase: -0.25 } }),
		);
		const forward = createMotionSampler(
			doc({ a: { keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 10 }, { at: 1, value: 0 }], phase: 0.75 } }),
		);
		for (let i = 0; i <= 20; i++) {
			expect(back.sample("a", i / 20)).toBeCloseTo(forward.sample("a", i / 20), 12);
		}
	});

	it("keeps the loop seam: a phase-shifted loopable track still closes on itself", () => {
		const sampler = createMotionSampler(shifted);
		expect(sampler.sample("azimuth", 0)).toBeCloseTo(sampler.sample("azimuth", 0.999999), 4);
	});
});

describe("document identity", () => {
	const base = doc({ a: ramp("easeOutCubic") });

	it("is stable across equal documents and insensitive to track and keyframe order", () => {
		expect(motionDocHash(base)).toBe(motionDocHash(doc({ a: ramp("easeOutCubic") })));

		const ordered = doc({
			a: { keyframes: [{ at: 0, value: 0 }, { at: 1, value: 1 }] },
			b: { keyframes: [{ at: 0, value: 0 }, { at: 1, value: 2 }] },
		});
		const reordered = doc({
			b: { keyframes: [{ at: 1, value: 2 }, { at: 0, value: 0 }] },
			a: { keyframes: [{ at: 1, value: 1 }, { at: 0, value: 0 }] },
		});
		expect(motionDocHash(reordered)).toBe(motionDocHash(ordered));
	});

	it("ignores label and hint — renaming a motion must not invalidate rendered frames", () => {
		expect(motionDocHash({ ...base, label: "Something else", hint: "new" })).toBe(
			motionDocHash(base),
		);
	});

	it("treats a named curve and its literal tuple as one identity", () => {
		expect(motionDocHash(doc({ a: ramp(EASINGS.easeOutCubic) }))).toBe(motionDocHash(base));
	});

	it("changes when anything that moves the camera changes", () => {
		expect(motionDocHash(doc({ a: ramp("linear") }))).not.toBe(motionDocHash(base));
		expect(
			motionDocHash(doc({ a: { ...ramp("easeOutCubic"), phase: 0.2 } })),
		).not.toBe(motionDocHash(base));
		expect(motionDocHash({ ...base, loopable: false })).not.toBe(motionDocHash(base));
		expect(
			motionDocHash(doc({ a: { keyframes: [{ at: 0, value: 0 }, { at: 1, value: 2 }] } })),
		).not.toBe(motionDocHash(base));
	});
});
