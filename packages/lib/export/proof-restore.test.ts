import { describe, expect, it } from "vitest";

import { createInitialIpodWorkbenchModel } from "@ipod/lib/ipod-state/model";

import { exportFingerprint, proofFingerprint, type FingerprintPose } from "./export-fingerprint";
import { selectExportSnapshot, type ProofExportOptions } from "./proof-inputs";
import { snapshotToModel } from "./proof-restore";

const POSE: FingerprintPose = { azimuth: 33.3, elevation: -12.5, reach: 2.41, target: [0, 0.1, 0] };
const OPTIONS: ProofExportOptions = {
	aspect: "portrait",
	quality: "cinema",
	move: "turntable",
	loop: "boomerang",
	speed: 1.5,
	durationSec: 8,
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
