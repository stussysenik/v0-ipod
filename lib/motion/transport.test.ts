import { describe, expect, it } from "vitest";

import { createClipPoseSampler, documentClip, findStudioClip } from "../studio-clip-presets";
import type { StudioPose } from "../studio-camera";
import { CATALOGUE_DOCS } from "./catalogue";
import {
	DEFAULT_REPEAT,
	DEFAULT_TURNAROUND,
	createPhaseMap,
	cycleSeconds,
	motionReadout,
	phaseForProgress,
	pingPong,
	poseAtProgress,
	repeatFromSpeed,
	seamState,
} from "./transport";
import { UnitBezier } from "../theatre/unit-bezier";

/**
 * THE TRANSPORT'S READINGS, pinned so a re-tune fails loudly.
 *
 * §3 replaced a hardcoded smootherstep turnaround with an authored cubic bezier and
 * replaced `speed` with an authored `repeat`. Both were measured before shipping and both
 * MOVE THE CAMERA under boomerang — the change is gated on the owner precisely because it
 * is not a no-op. The numbers below are the readings recorded in the change's `tasks.md`
 * §3.4; this file re-measures them from the shipped constants so that changing
 * `DEFAULT_TURNAROUND` breaks a test rather than silently re-timing every boomerang clip.
 *
 * The other half of §3 is a claim of EXACTNESS: `repeat: 0` returns the hero in closed form
 * rather than sampling phase 0. Orbit's dolly is a raised cosine, so those two differ — the
 * test samples the real document to show the difference is real before pinning the closed
 * form.
 */

/** The turnaround that shipped before §3, and the curve the bezier cannot be. */
function smootherstep(x: number): number {
	return x * x * x * (x * (6 * x - 15) + 10);
}

const HERO: StudioPose = { azimuth: 30, elevation: -10, reach: 2.4, target: [0, 0.1, 0] };

/** Dense enough that the maximum of a smooth deviation curve is resolved past 4 decimals. */
const SWEEP = 20000;

describe("seam, cadence and readout", () => {
	it("names the three seam states from the repeat count alone", () => {
		expect(seamState(0)).toBe("held");
		expect(seamState(-1)).toBe("held");
		expect(seamState(Number.NaN)).toBe("held");
		expect(seamState(3)).toBe("seamless");
		expect(seamState(2.5)).toBe("open");
	});

	it("derives the cycle length from the two authored numbers", () => {
		expect(cycleSeconds(6, 3)).toBe(2);
		expect(cycleSeconds(6, 0)).toBeNull();
		expect(cycleSeconds(0, 3)).toBeNull();
	});

	it("reads out the value the controls hold", () => {
		expect(motionReadout(0, 6)).toBe("held");
		expect(motionReadout(3, 6)).toBe("3× · 2.0s · seamless");
		expect(motionReadout(2.5, 5)).toBe("2.50× · 2.0s · open");
	});
});

describe("repeat 0 is amplitude zero, not phase 0", () => {
	const sample = createClipPoseSampler(documentClip(CATALOGUE_DOCS.orbit), HERO);

	it("phase 0 is NOT the hero — the claim the closed form exists to avoid", () => {
		const atZero = sample(0);
		expect(atZero.reach).not.toBe(HERO.reach);
		expect(atZero.elevation).not.toBe(HERO.elevation);
	});

	it("returns the hero exactly, at every progress, for every time map", () => {
		for (const timeMap of [{ kind: "loop" } as const, { kind: "boomerang" } as const]) {
			for (const progress of [0, 0.1, 0.5, 0.734, 0.999]) {
				expect(poseAtProgress(sample, HERO, progress, 0, timeMap)).toEqual(HERO);
			}
		}
	});
});

describe("loop transport", () => {
	it("maps progress onto repeated cycles and closes on every seam", () => {
		const phase = createPhaseMap(3, { kind: "loop" });
		expect(phase(0)).toBe(0);
		expect(phase(1 / 3)).toBeCloseTo(0, 12);
		expect(phase(2 / 3)).toBeCloseTo(0, 12);
		expect(phase(1 / 6)).toBeCloseTo(0.5, 12);
	});

	it("wraps overshoot and negative progress into [0,1)", () => {
		const phase = createPhaseMap(1, { kind: "loop" });
		expect(phase(1.25)).toBeCloseTo(0.25, 12);
		expect(phase(-0.25)).toBeCloseTo(0.75, 12);
		expect(phase(Number.NaN)).toBe(0);
	});
});

describe("the authored turnaround", () => {
	it("is the readable tuple that shipped, not the family optimum", () => {
		expect(DEFAULT_TURNAROUND).toEqual([0.5, 0, 0.5, 1]);
	});

	it("closes the boomerang on the hero seam and reverses at the half cycle", () => {
		const phase = createPhaseMap(1, { kind: "boomerang" });
		expect(phase(0)).toBe(0);
		expect(phase(0.5)).toBeCloseTo(1, 9);
		// Symmetric about the reversal: the way out retraces the way in.
		expect(phase(0.25)).toBeCloseTo(phase(0.75), 9);
		expect(phaseForProgress(0.1, 1, { kind: "boomerang" })).toBeCloseTo(phase(0.9), 9);
	});

	it("is 8.6642e-3 of a cycle away from the smootherstep it replaced", () => {
		const [c1x, c1y, c2x, c2y] = DEFAULT_TURNAROUND;
		const bezier = new UnitBezier(c1x, c1y, c2x, c2y);
		let worst = 0;
		for (let i = 0; i <= SWEEP; i++) {
			const t = i / SWEEP;
			worst = Math.max(worst, Math.abs(bezier.solve(t) - smootherstep(t)));
		}
		// A cubic bezier cannot be a quintic: this is a degree mismatch, not a fitting
		// failure, and 8.6642e-3 is the floor of the zero-end-slope family.
		expect(worst).toBeCloseTo(8.6642e-3, 6);
	});

	it.each([
		["turntable", "azimuth", 3.1191, 3] as const,
		["sweep", "elevation", 1.3675, 3] as const,
		["crane", "elevation", 1.3356, 3] as const,
		["crane", "reach", 5.834e-2, 4] as const,
	])("moves %s %s by %f — above the 0.25° port floor", (docId, axis, reading, digits) => {
		// The PROCEDURAL clip, not the ported document: an untouched preset still flies its
		// generator (`motionClipFor`), so this measures what §3 changed for a user today.
		// Measuring on the port instead shifts every reading by that track's port residual —
		// turntable azimuth is unmoved (its port is exact), crane elevation moves most.
		const sample = createClipPoseSampler(findStudioClip(docId)!, HERO);
		const authored = createPhaseMap(1, { kind: "boomerang" });
		const read = (pose: StudioPose) => pose[axis as "azimuth" | "elevation" | "reach"];
		let worst = 0;
		for (let i = 0; i < SWEEP; i++) {
			const progress = i / SWEEP;
			const deviation = Math.abs(
				read(sample(authored(progress))) - read(sample(pingPong(progress, smootherstep))),
			);
			worst = Math.max(worst, deviation);
		}
		expect(worst).toBeCloseTo(reading, digits);
	});

	it("leaves loop clips bit-identical — only the turnaround changed", () => {
		const sample = createClipPoseSampler(documentClip(CATALOGUE_DOCS.turntable), HERO);
		const loop = createPhaseMap(2, { kind: "loop" });
		for (let i = 0; i < 1000; i++) {
			const progress = i / 1000;
			expect(sample(loop(progress))).toEqual(sample((progress * 2) % 1));
		}
	});
});

describe("speed → repeat, the one-way conversion", () => {
	it("reads the count that was actually being flown", () => {
		// 12s clip, 6s natural cycle, speed 1 → the look was flying two cycles.
		expect(repeatFromSpeed(12, 1, 6)).toBe(2);
		expect(repeatFromSpeed(12, 2, 6)).toBe(4);
	});

	it("halves a boomerang once, here, and never again", () => {
		// One authored round-trip covers twice the path the derived count measured.
		expect(repeatFromSpeed(24, 1, 6, "boomerang")).toBe(2);
		expect(repeatFromSpeed(24, 1, 6, "loop")).toBe(4);
	});

	it("never converts to a held clip — hold is a repeat the user authors", () => {
		expect(repeatFromSpeed(5, 0.1, 6)).toBe(1);
	});

	it("falls back rather than guessing when the natural cycle is unknown", () => {
		expect(repeatFromSpeed(12, 1, Number.NaN)).toBe(DEFAULT_REPEAT);
		expect(repeatFromSpeed(12, 1, 0)).toBe(DEFAULT_REPEAT);
	});
});
