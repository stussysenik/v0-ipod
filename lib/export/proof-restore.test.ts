import { describe, expect, it } from "vitest";

import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { CATALOGUE_DOCS } from "@/lib/motion/catalogue";

import { exportFingerprint, proofFingerprint, type FingerprintPose } from "./export-fingerprint";
import { selectExportSnapshot, type ProofExportOptions } from "./proof-inputs";
import { snapshotToModel } from "./proof-restore";

const POSE: FingerprintPose = { azimuth: 33.3, elevation: -12.5, reach: 2.41, target: [0, 0.1, 0] };
const OPTIONS: ProofExportOptions = {
	aspect: "portrait",
	quality: "cinema",
	motion: {
		docId: "turntable",
		repeat: 3,
		durationSec: 8,
		timeMap: { kind: "boomerang" },
		playhead: 0,
		playing: false,
	},
	doc: CATALOGUE_DOCS.turntable,
};

/** A non-default source model so the round-trip exercises real values, not initial state. */
function sourceModel() {
	const base = createInitialIpodWorkbenchModel();
	return {
		...base,
		metadata: { ...base.metadata, title: "Weightless", artist: "Marconi Union", album: "Distance", currentTime: 42, duration: 480 },
		presentation: { ...base.presentation, skinColor: "#1d1d1f", bgColor: "#000000", bezelColor: "#111111" },
		interaction: { ...base.interaction, batteryLevel: 0.31, osScreen: "now-playing" as const },
		studio: { ...base.studio, marquee: true },
	};
}

describe("snapshotToModel (re-open)", () => {
	it("restores the snapshot's pixel-determining fields over current state", () => {
		const snapshot = selectExportSnapshot(sourceModel(), POSE, OPTIONS);
		const restored = snapshotToModel(createInitialIpodWorkbenchModel(), snapshot);

		expect(restored.metadata.title).toBe("Weightless");
		expect(restored.metadata.currentTime).toBe(42);
		expect(restored.presentation.skinColor).toBe("#1d1d1f");
		expect(restored.presentation.bezelColor).toBe("#111111");
		expect(restored.interaction.batteryLevel).toBe(0.31);
		expect(restored.studio.marquee).toBe(true);
	});

	it("preserves fields the snapshot does not carry (artwork, playback)", () => {
		const base = createInitialIpodWorkbenchModel();
		const snapshot = selectExportSnapshot(sourceModel(), POSE, OPTIONS);
		const restored = snapshotToModel(base, snapshot);
		// artwork isn't part of the fingerprint snapshot, so it stays whatever current had.
		expect(restored.metadata.artwork).toBe(base.metadata.artwork);
		expect(restored.playback).toBe(base.playback);
	});

	it("round-trips: a restored model re-derives the same fingerprints", () => {
		const original = selectExportSnapshot(sourceModel(), POSE, OPTIONS);
		const restored = snapshotToModel(createInitialIpodWorkbenchModel(), original);
		const rederived = selectExportSnapshot(restored, POSE, OPTIONS);

		expect(proofFingerprint(rederived)).toBe(proofFingerprint(original));
		expect(exportFingerprint(rederived)).toBe(exportFingerprint(original));
	});
});

/**
 * A v1 export record predates the motion identity: it carried `move`/`loop`/`speed`/
 * `durationSec` at the TOP LEVEL of the snapshot, not under `motion`. Re-open must read it
 * without a second migration — `sanitizeMotionState` is the migration, and `snapshotToModel`
 * hands it the snapshot itself when no `motion` field is present.
 */
describe("re-opening a v1 export record", () => {
	const v1 = (over: Record<string, unknown>) => ({
		...selectExportSnapshot(sourceModel(), POSE, OPTIONS),
		motion: undefined,
		...over,
	}) as unknown as Parameters<typeof snapshotToModel>[1];

	it("reads the document the record named and the cadence it was flying", () => {
		// Turntable's cycle is 6s; 12s at speed 1 was two cycles.
		const restored = snapshotToModel(
			createInitialIpodWorkbenchModel(),
			v1({ move: "turntable", loop: "loop", speed: 1, durationSec: 12 }),
		);
		expect(restored.studio.motion.docId).toBe("turntable");
		expect(restored.studio.motion.repeat).toBe(2);
		expect(restored.studio.motion.durationSec).toBe(12);
	});

	it("opens composed — a re-opened setup never restores a playhead", () => {
		const restored = snapshotToModel(
			createInitialIpodWorkbenchModel(),
			v1({ move: "orbit", loop: "hold", speed: 2, durationSec: 10, playhead: 0.6, playing: true }),
		);
		expect(restored.studio.motion.repeat).toBe(0); // hold is amplitude zero
		expect(restored.studio.motion.playhead).toBe(0);
		expect(restored.studio.motion.playing).toBe(false);
	});

	it("restores a v2 record's tuning, not just the move it was tuned from", () => {
		const overrides = {
			tracks: {
				azimuth: {
					keyframes: [
						{ at: 0, value: 0, easing: [0.12, 0.83, 0.4, 0.97] as const },
						{ at: 0.5, value: -9.5 },
						{ at: 1, value: 0 },
					],
				},
			},
		};
		const snapshot = selectExportSnapshot(sourceModel(), POSE, {
			...OPTIONS,
			motion: { ...OPTIONS.motion, overrides },
		});
		const restored = snapshotToModel(createInitialIpodWorkbenchModel(), snapshot);
		expect(restored.studio.motion.overrides?.tracks?.azimuth.keyframes).toHaveLength(3);
		expect(restored.studio.motion.repeat).toBe(3);
	});
});
