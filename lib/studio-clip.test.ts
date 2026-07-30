import { describe, expect, it } from "vitest";

import {
	createClipPoseSampler,
	documentClip,
	isTheatreClip,
	resolveClipPose,
	STUDIO_CLIPS,
	findStudioClip,
} from "./studio-clip-presets";
import { CATALOGUE_DOCS } from "./motion/catalogue";
import { poseForMove, type StudioPose } from "./studio-camera";

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

/**
 * The document branch is what lets a SAVED motion be flown by the same picker, preview and
 * export loop as a shipped move — one code path, no "custom motion" mode. It is additive:
 * the procedural branch still owns the shipped catalogue until §2.9 is ruled on.
 */
describe("document clips", () => {
	it("adds the document's offsets to the hero, so a move is portable across framings", () => {
		const clip = documentClip(CATALOGUE_DOCS.orbit);
		const other: StudioPose = { azimuth: -70, elevation: 3, reach: 9, target: [1, 2, 3] };
		const fromHero = resolveClipPose(clip, 0.3, HERO);
		const fromOther = resolveClipPose(clip, 0.3, other);
		// The OFFSET is identical from either framing; only the anchor differs.
		expect(fromOther.azimuth - other.azimuth).toBeCloseTo(fromHero.azimuth - HERO.azimuth, 12);
		expect(fromOther.elevation - other.elevation).toBeCloseTo(
			fromHero.elevation - HERO.elevation,
			12,
		);
		expect(fromOther.reach - other.reach).toBeCloseTo(fromHero.reach - HERO.reach, 12);
	});

	it("reproduces the ported catalogue within the recorded port floor", () => {
		// The port itself is measured in lib/motion/catalogue.test.ts; this pins that the
		// CLIP wrapper does not add error of its own on top of it.
		const clip = documentClip(CATALOGUE_DOCS.turntable);
		for (const phase of [0, 0.2, 0.5, 0.8]) {
			const viaDoc = resolveClipPose(clip, phase, HERO);
			const viaGenerator = poseForMove("turntable", phase, HERO);
			expect(azGap(viaDoc.azimuth, viaGenerator.azimuth)).toBeLessThan(0.25);
			expect(Math.abs(viaDoc.elevation - viaGenerator.elevation)).toBeLessThan(0.25);
			expect(Math.abs(viaDoc.reach - viaGenerator.reach)).toBeLessThan(0.01);
		}
	});

	it("a cached document sampler agrees with resolveClipPose", () => {
		const clip = documentClip(CATALOGUE_DOCS.crane);
		const sample = createClipPoseSampler(clip, HERO);
		for (const phase of [0, 0.25, 0.6, 0.9]) {
			expect(sample(phase)).toEqual(resolveClipPose(clip, phase, HERO));
		}
	});
});
