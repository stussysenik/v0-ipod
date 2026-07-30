/**
 * The ONE place a fingerprint snapshot is built from studio state.
 *
 * The spec requires a single source of the pixel-determining snapshot, so that a test can
 * guarantee every input that changes the export is included (and `FINGERPRINT_VERSION` is
 * bumped whenever this set changes). Everything upstream — the proof cache, the panel, the
 * provenance stamp — derives from these two selectors and nothing else.
 *
 * Selectors take narrow slices (not the whole model) so they stay pure and cheaply testable.
 */

import { motionDocHash, proofPositions, resolveMotionDoc, type MotionDoc } from "@/lib/motion/doc";
import type { MotionState } from "@/lib/motion/motion-state";

import type {
	ExportSnapshot,
	FingerprintPose,
	MotionIdentity,
	ProofInputs,
} from "./export-fingerprint";

/** The studio-state fields that affect the anchor frame's pixels. */
export interface ProofModelSlice {
	metadata: {
		title: string;
		artist: string;
		album: string;
		currentTime: number;
		duration: number;
	};
	presentation: {
		skinColor: string;
		bgColor: string;
		ringColor: string;
		centerColor: string;
		backColor: string;
		edgeColor: string;
		bezelColor: string;
		hardwarePreset: string;
	};
	interaction: {
		batteryLevel: number;
		osScreen: string;
	};
	studio: {
		marquee: boolean;
		lighting: unknown;
	};
}

/**
 * The export-option fields. Proof uses aspect/quality; motion determines the timeline and
 * the provenance identity, and enters here so it enters in exactly one place.
 */
export interface ProofExportOptions {
	aspect: string;
	quality: string;
	/** The authored motion slice, plus the document it resolves against. */
	motion: MotionState;
	/** The catalogue/shelf document `motion.docId` names, before overrides. */
	doc: MotionDoc;
}

/**
 * The motion identity for a snapshot: the resolved document hashed, plus the transport.
 *
 * Resolution happens HERE rather than at the call sites so the hash always covers the
 * document that will actually fly — a sparse override that never reached the hash would
 * produce a proof frame of untuned motion and label it proof of the tuned one.
 */
export function selectMotionIdentity(options: Pick<ProofExportOptions, "motion" | "doc">): MotionIdentity {
	const resolved = resolveMotionDoc(options.doc, options.motion.overrides);
	return {
		docId: options.motion.docId,
		docHash: motionDocHash(resolved),
		repeat: options.motion.repeat,
		durationSec: options.motion.durationSec,
		timeMap: options.motion.timeMap,
		...(options.motion.overrides ? { overrides: options.motion.overrides } : {}),
	};
}

/** The clip positions this snapshot's timeline proof covers. */
export function selectProofPositions(options: Pick<ProofExportOptions, "doc">): readonly number[] {
	return proofPositions(options.doc);
}

export function selectProofInputs(
	model: ProofModelSlice,
	pose: FingerprintPose,
	options: Pick<ProofExportOptions, "aspect" | "quality">,
): ProofInputs {
	return {
		pose: {
			azimuth: pose.azimuth,
			elevation: pose.elevation,
			reach: pose.reach,
			target: [pose.target[0], pose.target[1], pose.target[2]],
		},
		aspect: options.aspect,
		quality: options.quality,
		metadata: {
			title: model.metadata.title,
			artist: model.metadata.artist,
			album: model.metadata.album,
			currentTime: model.metadata.currentTime,
			duration: model.metadata.duration,
		},
		marquee: model.studio.marquee,
		batteryLevel: model.interaction.batteryLevel,
		osScreen: model.interaction.osScreen,
		presentation: {
			skinColor: model.presentation.skinColor,
			bgColor: model.presentation.bgColor,
			ringColor: model.presentation.ringColor,
			centerColor: model.presentation.centerColor,
			backColor: model.presentation.backColor,
			edgeColor: model.presentation.edgeColor,
			bezelColor: model.presentation.bezelColor,
			hardwarePreset: model.presentation.hardwarePreset,
		},
		lighting: model.studio.lighting,
	};
}

export function selectExportSnapshot(
	model: ProofModelSlice,
	pose: FingerprintPose,
	options: ProofExportOptions,
): ExportSnapshot {
	return {
		...selectProofInputs(model, pose, options),
		motion: selectMotionIdentity(options),
	};
}
