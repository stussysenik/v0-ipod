import { proofPositions, type MotionDoc } from "@/lib/motion/doc";
import { poseAtProgress, createPhaseMap } from "@/lib/motion/transport";
import { createClipPoseSampler, type StudioClip } from "@/lib/studio-clip-presets";
import type { StudioPose } from "@/lib/studio-camera";

import {
	timelineFingerprint,
	timelineFrameKey,
	type ExportSnapshot,
	type FingerprintPose,
} from "./export-fingerprint";

/**
 * THE TIMELINE PROOF — the WYSIWYG claim, made checkable.
 *
 * The anchor proof answers "what will frame 0 look like". It cannot answer "what will the
 * MOVE look like", because every move starts on the composed hero: browsing the catalogue
 * re-renders byte-identical anchors and shows nothing. So a second proof keys a SET of
 * frames at authored clip positions, and the strip under the playhead is that set.
 *
 * WHAT MAKES IT A PROOF RATHER THAN A PREVIEW: the frame at position `p` is rendered from
 * the pose the export renders at `p`, derived by the same sampler and the same transport —
 * not by a parallel implementation that agrees on inspection. `planTimelineProof` is that
 * shared derivation, and `timeline-proof.test.ts` pins it against a simulated export loop
 * rather than asserting it in a comment.
 *
 * IT ADDS NO SECOND QUEUE. The plan is data; the existing `proof-scheduler` walks it
 * through the existing single-flight `proof-render-queue`, so a timeline warm still yields
 * to a real export bake and still never runs two renders at once.
 */

export interface TimelineProofFrame {
	/** Cache key for this one frame. */
	key: string;
	/** Clip progress this frame proves, `[0,1)`. */
	position: number;
	/** The camera pose the export renders at that position. */
	pose: FingerprintPose;
}

export interface TimelineProofPlan {
	/** The key for the whole set — what changes when the motion or the positions change. */
	key: string;
	frames: TimelineProofFrame[];
}

function toFingerprintPose(pose: StudioPose): FingerprintPose {
	return {
		azimuth: pose.azimuth,
		elevation: pose.elevation,
		reach: pose.reach,
		target: [pose.target[0], pose.target[1], pose.target[2]],
	};
}

/**
 * The poses an export flies at the given clip positions.
 *
 * Exported on its own because it is the whole content of the WYSIWYG claim: a test can
 * simulate the export's frame loop and assert these are the same values, which a comment
 * saying "same math" cannot.
 */
export function posesAtPositions(
	clip: StudioClip,
	hero: StudioPose,
	repeat: number,
	timeMap: Parameters<typeof createPhaseMap>[1],
	positions: readonly number[],
): StudioPose[] {
	const sampler = createClipPoseSampler(clip, hero);
	const phaseMap = createPhaseMap(repeat, timeMap);
	return positions.map((position) =>
		poseAtProgress(sampler, hero, position, repeat, timeMap, phaseMap),
	);
}

/**
 * Plan the timeline proof for a composition: one set key, one frame per authored position.
 *
 * `clip` is passed in rather than resolved here, because WHICH engine flies a motion is a
 * single decision that lives in `motionClipFor` — the proof must make it the same way the
 * export does, and the only way to guarantee that is to be handed the same clip.
 */
export function planTimelineProof(
	snapshot: ExportSnapshot,
	clip: StudioClip,
	doc: Pick<MotionDoc, "proofPositions">,
): TimelineProofPlan {
	const positions = proofPositions(doc);
	const key = timelineFingerprint(snapshot, snapshot.motion, positions);
	const hero: StudioPose = {
		azimuth: snapshot.pose.azimuth,
		elevation: snapshot.pose.elevation,
		reach: snapshot.pose.reach,
		target: [snapshot.pose.target[0], snapshot.pose.target[1], snapshot.pose.target[2]],
	};
	const poses = posesAtPositions(
		clip,
		hero,
		snapshot.motion.repeat,
		snapshot.motion.timeMap as Parameters<typeof createPhaseMap>[1],
		positions,
	);
	return {
		key,
		frames: positions.map((position, index) => ({
			key: timelineFrameKey(key, index),
			position,
			pose: toFingerprintPose(poses[index]),
		})),
	};
}
