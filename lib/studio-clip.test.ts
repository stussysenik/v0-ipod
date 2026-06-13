import { describe, expect, it } from "vitest";

import {
	clipCyclesForDuration,
	createClipPoseSampler,
	isTheatreClip,
	resolveClipPose,
	STUDIO_CLIPS,
	findStudioClip,
} from "./studio-clip-presets";
import { cyclesForDuration, poseForMove, type StudioPose } from "./studio-camera";

const HERO: StudioPose = { azimuth: 18, elevation: 14, reach: 13, target: [0, 0, 0] };

function azGap(a: number, b: number): number {
	const d = (((a - b) % 360) + 360) % 360;
	return Math.min(d, 360 - d);
}

/**
 * The Clip abstraction unifies the two animation engines behind one interface so
 * the orbit rig and the offline render loop never branch on "procedural vs
 * Theatre". These tests pin that contract: dispatch correctness, hero anchoring,
 * and the seam-closure invariant the whole export pipeline relies on.
 */
describe("studio clip catalogue", () => {
	it("includes every procedural move and every moment card, with unique ids", () => {
		const ids = STUDIO_CLIPS.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain("orbit");
		expect(ids).toContain("turntable");
		expect(ids).toContain("crane");
		expect(ids).toContain("float-bob");
		expect(ids).toContain("grand-turntable");
	});

	it("classifies procedural and theatre clips", () => {
		expect(isTheatreClip(findStudioClip("orbit")!)).toBe(false);
		expect(isTheatreClip(findStudioClip("float-bob")!)).toBe(true);
	});
});

describe("resolveClipPose", () => {
	it("delegates procedural clips to the existing pose generators", () => {
		const clip = findStudioClip("crane")!;
		const a = resolveClipPose(clip, 0.3, HERO);
		const b = poseForMove("crane", 0.3, HERO);
		expect(a.azimuth).toBeCloseTo(b.azimuth, 9);
		expect(a.elevation).toBeCloseTo(b.elevation, 9);
		expect(a.reach).toBeCloseTo(b.reach, 9);
	});

	it("anchors theatre moment cards on the hero at phase 0", () => {
		// Procedural moves legitimately rest at a small baseline offset (e.g. orbit's
		// −2·cos elevation term); moment cards are authored to begin exactly on the
		// composed hero so a clip never pops away on the first frame.
		for (const clip of STUDIO_CLIPS) {
			if (clip.kind !== "theatre") {
				continue;
			}
			const start = resolveClipPose(clip, 0, HERO);
			expect(azGap(start.azimuth, HERO.azimuth)).toBeCloseTo(0, 3);
			expect(start.elevation).toBeCloseTo(HERO.elevation, 3);
			expect(start.reach).toBeCloseTo(HERO.reach, 3);
		}
	});

	it("closes the loop seam for every loopable clip (pose(0) ≈ pose(1))", () => {
		for (const clip of STUDIO_CLIPS) {
			if (!clip.loopable) {
				continue;
			}
			const start = resolveClipPose(clip, 0, HERO);
			const end = resolveClipPose(clip, 1, HERO);
			expect(azGap(end.azimuth, start.azimuth)).toBeCloseTo(0, 3);
			expect(end.elevation).toBeCloseTo(start.elevation, 3);
			expect(end.reach).toBeCloseTo(start.reach, 3);
		}
	});

	it("a cached clip sampler agrees with resolveClipPose", () => {
		const clip = findStudioClip("pendulum")!;
		const sample = createClipPoseSampler(clip, HERO);
		for (const phase of [0, 0.2, 0.5, 0.8]) {
			const cached = sample(phase);
			const direct = resolveClipPose(clip, phase, HERO);
			expect(cached.azimuth).toBeCloseTo(direct.azimuth, 9);
			expect(cached.elevation).toBeCloseTo(direct.elevation, 9);
			expect(cached.reach).toBeCloseTo(direct.reach, 9);
		}
	});

	it("theatre clips actually move the camera mid-cycle", () => {
		const clip = findStudioClip("pendulum")!;
		const mid = resolveClipPose(clip, 0.25, HERO);
		expect(azGap(mid.azimuth, HERO.azimuth)).toBeGreaterThan(5);
	});
});

describe("clipCyclesForDuration", () => {
	it("matches the legacy procedural cadence math for procedural clips", () => {
		const clip = findStudioClip("turntable")!;
		for (const loop of ["loop", "boomerang"] as const) {
			for (const dur of [5, 12, 30, 60]) {
				expect(clipCyclesForDuration(clip, dur, 1, loop)).toBe(
					cyclesForDuration("turntable", dur, 1, loop),
				);
			}
		}
	});

	it("derives cycles from a theatre clip's natural cycle length", () => {
		const clip = findStudioClip("float-bob")!; // 6s natural cycle
		expect(clipCyclesForDuration(clip, 6, 1, "loop")).toBe(1);
		expect(clipCyclesForDuration(clip, 30, 1, "loop")).toBe(5);
	});

	it("never returns fewer than one cycle", () => {
		const clip = findStudioClip("crane-reveal")!;
		expect(clipCyclesForDuration(clip, 0.1, 1, "loop")).toBe(1);
	});
});
