import { describe, expect, it } from "vitest";

import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { CATALOGUE_DOCS } from "@/lib/motion/catalogue";
import { DEFAULT_PROOF_POSITIONS, type MotionDoc, type MotionTrack } from "@/lib/motion/doc";
import { motionClipFor } from "@/lib/motion/motion-shelf";
import type { MotionState } from "@/lib/motion/motion-state";
import { createPhaseMap, poseAtProgress } from "@/lib/motion/transport";
import { createClipPoseSampler, type StudioClip } from "@/lib/studio-clip-presets";
import type { StudioPose } from "@/lib/studio-camera";

import { proofFingerprint, timelineFingerprint, type FingerprintPose } from "./export-fingerprint";
import { selectExportSnapshot, selectProofPositions, type ProofExportOptions } from "./proof-inputs";
import { planTimelineProof, posesAtPositions } from "./timeline-proof";

/**
 * THE WYSIWYG CLAIM, MADE CHECKABLE.
 *
 * Export pixels are already proven to be a pure function of their inputs (theatre parity),
 * so the checkable content of "the proof frame at position p is the export's frame at p" is
 * that the POSE at p is the same value the export's frame loop produces. This file simulates
 * that loop — `total` frames, `progress = i / total` — and asserts exact equality against
 * `posesAtPositions`. Asserting "same math" in a comment is what this replaces.
 *
 * The second claim is the cache split (§5.7): motion is deliberately absent from the anchor
 * key, so switching documents must reuse the anchor proof unchanged and recompute only the
 * timeline. That is a pure key test — no renderer involved.
 */

const POSE: FingerprintPose = { azimuth: 33.3, elevation: -12.5, reach: 2.41, target: [0, 0.1, 0] };
const HERO: StudioPose = {
	azimuth: POSE.azimuth,
	elevation: POSE.elevation,
	reach: POSE.reach,
	target: [...POSE.target],
};

/** A hand-authored track — the tuning that makes a document differ from the move it names. */
const TUNED: MotionTrack = {
	keyframes: [
		{ at: 0, value: 0, easing: [0.12, 0.83, 0.4, 0.97] },
		{ at: 0.5, value: -9.5, easing: "easeInOutCubic" },
		{ at: 1, value: 0 },
	],
	phase: 0.37,
};

function motion(over: Partial<MotionState> = {}): MotionState {
	return {
		docId: "turntable",
		repeat: 3,
		durationSec: 8,
		timeMap: { kind: "boomerang" },
		playhead: 0,
		playing: false,
		...over,
	};
}

function options(over: Partial<MotionState> = {}, doc?: MotionDoc): ProofExportOptions {
	const state = motion(over);
	return {
		aspect: "portrait",
		quality: "cinema",
		motion: state,
		doc: doc ?? CATALOGUE_DOCS[state.docId as keyof typeof CATALOGUE_DOCS],
	};
}

function snapshotFor(opts: ProofExportOptions) {
	return selectExportSnapshot(createInitialIpodWorkbenchModel(), POSE, opts);
}

/** The export's frame loop, written out rather than referenced, so it can disagree. */
function renderLoop(clip: StudioClip, state: MotionState, total: number): StudioPose[] {
	const sampler = createClipPoseSampler(clip, HERO);
	const phaseMap = createPhaseMap(state.repeat, state.timeMap);
	return Array.from({ length: total }, (_, i) =>
		poseAtProgress(sampler, HERO, i / total, state.repeat, state.timeMap, phaseMap),
	);
}

describe("a proof frame is the export's frame", () => {
	it.each([
		["boomerang, three cycles", motion()],
		["a single looped cycle", motion({ timeMap: { kind: "loop" }, repeat: 1 })],
		["a fractional, open count", motion({ timeMap: { kind: "loop" }, repeat: 2.5 })],
	])("%s: every proved position is a rendered frame, exactly", (_name, state) => {
		const opts = options(state);
		const clip = motionClipFor(state.docId, state.overrides);
		const plan = planTimelineProof(snapshotFor(opts), clip, opts.doc);
		// 1000 frames: every default position lands on a frame index, 0.999 on frame 999.
		const total = 1000;
		const frames = renderLoop(clip, state, total);

		expect(plan.frames).toHaveLength(DEFAULT_PROOF_POSITIONS.length);
		for (const frame of plan.frames) {
			const index = Math.round(frame.position * total);
			// The position must BE a frame the export renders, not merely near one.
			expect(index / total).toBe(frame.position);
			expect(frame.pose).toEqual({
				azimuth: frames[index].azimuth,
				elevation: frames[index].elevation,
				reach: frames[index].reach,
				target: frames[index].target,
			});
		}
	});

	it("proves the hero at every position when the clip is held", () => {
		const state = motion({ repeat: 0 });
		const opts = options(state);
		const plan = planTimelineProof(snapshotFor(opts), motionClipFor(state.docId, undefined), opts.doc);
		for (const frame of plan.frames) {
			expect(frame.pose).toEqual({ ...POSE, target: [...POSE.target] });
		}
	});

	it("follows a tuning: the plan flies the clip it is handed, not the move it names", () => {
		const overrides = { tracks: { azimuth: TUNED } };
		const opts = options({ overrides });
		const tuned = planTimelineProof(snapshotFor(opts), motionClipFor("turntable", overrides), opts.doc);
		const pristine = planTimelineProof(
			snapshotFor(options()),
			motionClipFor("turntable", undefined),
			CATALOGUE_DOCS.turntable,
		);
		expect(tuned.frames.map((f) => f.pose)).not.toEqual(pristine.frames.map((f) => f.pose));
	});

	it("samples the authored positions, in the document's own order", () => {
		const doc: MotionDoc = { ...CATALOGUE_DOCS.orbit, proofPositions: [0.8, 0.1, 0.4] };
		const opts = options({ docId: "orbit" }, doc);
		const plan = planTimelineProof(snapshotFor(opts), motionClipFor("orbit", undefined), doc);
		expect(plan.frames.map((f) => f.position)).toEqual([0.1, 0.4, 0.8]);
		expect(selectProofPositions({ doc })).toEqual([0.1, 0.4, 0.8]);
	});

	it("derives one frame key per position from the one set key", () => {
		const opts = options();
		const plan = planTimelineProof(snapshotFor(opts), motionClipFor("turntable", undefined), opts.doc);
		expect(plan.frames.map((f) => f.key)).toEqual(
			plan.frames.map((_f, i) => `${plan.key}:${i}`),
		);
		expect(new Set(plan.frames.map((f) => f.key)).size).toBe(plan.frames.length);
	});

	it("exposes the same poses the plan carries, for a caller that wants them raw", () => {
		const state = motion();
		const clip = motionClipFor(state.docId, undefined);
		const raw = posesAtPositions(clip, HERO, state.repeat, state.timeMap, DEFAULT_PROOF_POSITIONS);
		const opts = options(state);
		const plan = planTimelineProof(snapshotFor(opts), clip, opts.doc);
		expect(plan.frames.map((f) => f.pose.azimuth)).toEqual(raw.map((p) => p.azimuth));
	});
});

describe("switching motion does not re-render the anchor", () => {
	const orbit = options({ docId: "orbit" });
	const crane = options({ docId: "crane" });

	it("keeps the anchor key and changes the timeline key", () => {
		const a = snapshotFor(orbit);
		const b = snapshotFor(crane);

		// Motion cannot change frame 0 — every move is offsets from the hero.
		expect(proofFingerprint(b)).toBe(proofFingerprint(a));
		expect(
			timelineFingerprint(b, b.motion, selectProofPositions(crane)),
		).not.toBe(timelineFingerprint(a, a.motion, selectProofPositions(orbit)));
	});

	it("separates a tuned move from the pristine one that shares its id", () => {
		const pristine = snapshotFor(options({ docId: "orbit" }));
		const tuned = snapshotFor(options({ docId: "orbit", overrides: { tracks: { azimuth: TUNED } } }));

		// The identity is a HASH, not a name: `move: "orbit"` named both.
		expect(tuned.motion.docId).toBe(pristine.motion.docId);
		expect(tuned.motion.docHash).not.toBe(pristine.motion.docHash);
		expect(proofFingerprint(tuned)).toBe(proofFingerprint(pristine));
		expect(
			timelineFingerprint(tuned, tuned.motion, DEFAULT_PROOF_POSITIONS),
		).not.toBe(timelineFingerprint(pristine, pristine.motion, DEFAULT_PROOF_POSITIONS));
	});

	it("re-keys when the transport changes but the document does not", () => {
		const three = snapshotFor(options());
		const four = snapshotFor(options({ repeat: 4 }));
		expect(four.motion.docHash).toBe(three.motion.docHash);
		expect(proofFingerprint(four)).toBe(proofFingerprint(three));
		expect(
			timelineFingerprint(four, four.motion, DEFAULT_PROOF_POSITIONS),
		).not.toBe(timelineFingerprint(three, three.motion, DEFAULT_PROOF_POSITIONS));
	});

	it("re-keys when the positions change, so a partial set can never read as a hit", () => {
		const snap = snapshotFor(options());
		expect(timelineFingerprint(snap, snap.motion, [0, 0.5, 0.999])).not.toBe(
			timelineFingerprint(snap, snap.motion, DEFAULT_PROOF_POSITIONS),
		);
	});

	it("changes the anchor key when the pose moves, and only then", () => {
		const model = createInitialIpodWorkbenchModel();
		const moved = selectExportSnapshot(model, { ...POSE, azimuth: 40 }, options());
		const same = selectExportSnapshot(model, { ...POSE, azimuth: 33.3 }, options());
		expect(proofFingerprint(moved)).not.toBe(proofFingerprint(same));
	});
});
