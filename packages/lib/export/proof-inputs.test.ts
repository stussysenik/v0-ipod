import { describe, expect, it } from "vitest";

import { exportFingerprint, proofFingerprint } from "./export-fingerprint";
import {
	selectExportSnapshot,
	selectProofInputs,
	type ProofExportOptions,
	type ProofModelSlice,
} from "./proof-inputs";

const pose = { azimuth: 24, elevation: 12, reach: 14, target: [0, 0, 0] as [number, number, number] };

const model: ProofModelSlice = {
	metadata: { title: "T", artist: "A", album: "Al", currentTime: 10, duration: 180 },
	presentation: {
		skinColor: "#c0c0c0",
		bgColor: "#101010",
		ringColor: "#888888",
		centerColor: "#ffffff",
		backColor: "#cfd3d7",
		edgeColor: "#cfd3d7",
		bezelColor: "#0a0a0a",
		hardwarePreset: "classic-2008-silver",
	},
	interaction: { batteryLevel: 0.8, osScreen: "now-playing" },
	studio: { marquee: true, lighting: { key: 1.2 } },
};

const options: ProofExportOptions = {
	aspect: "portrait",
	quality: "pro",
	move: "orbit",
	loop: "loop",
	speed: 1,
	durationSec: 4,
};

describe("selectProofInputs", () => {
	it("captures every pixel-determining field", () => {
		const inputs = selectProofInputs(model, pose, options);
		expect(inputs.metadata.title).toBe("T");
		expect(inputs.presentation.skinColor).toBe("#c0c0c0");
		expect(inputs.presentation.hardwarePreset).toBe("classic-2008-silver");
		expect(inputs.batteryLevel).toBe(0.8);
		expect(inputs.osScreen).toBe("now-playing");
		expect(inputs.marquee).toBe(true);
		expect(inputs.lighting).toEqual({ key: 1.2 });
		expect(inputs.aspect).toBe("portrait");
	});

	it("a change to any captured field moves the proof fingerprint", () => {
		const base = proofFingerprint(selectProofInputs(model, pose, options));
		const cases: ProofModelSlice[] = [
			{ ...model, metadata: { ...model.metadata, title: "X" } },
			{ ...model, presentation: { ...model.presentation, ringColor: "#000" } },
			{ ...model, interaction: { ...model.interaction, batteryLevel: 0.1 } },
			{ ...model, studio: { ...model.studio, marquee: false } },
			{ ...model, studio: { ...model.studio, lighting: { key: 9 } } },
		];
		for (const m of cases) {
			expect(proofFingerprint(selectProofInputs(m, pose, options))).not.toBe(base);
		}
	});
});

describe("selectExportSnapshot", () => {
	it("adds motion fields to the proof inputs", () => {
		const snap = selectExportSnapshot(model, pose, options);
		expect(snap.move).toBe("orbit");
		expect(snap.loop).toBe("loop");
		expect(snap.speed).toBe(1);
		expect(snap.durationSec).toBe(4);
	});

	it("the snapshot's proof key equals the standalone proof key (one source of truth)", () => {
		const fromSnapshot = selectExportSnapshot(model, pose, options);
		const fromProof = selectProofInputs(model, pose, options);
		expect(proofFingerprint(fromSnapshot)).toBe(proofFingerprint(fromProof));
	});

	it("motion-only changes move the export fingerprint but NOT the proof key", () => {
		const a = selectExportSnapshot(model, pose, options);
		const b = selectExportSnapshot(model, pose, { ...options, move: "turntable", speed: 2 });
		expect(exportFingerprint(a)).not.toBe(exportFingerprint(b));
		expect(proofFingerprint(a)).toBe(proofFingerprint(b));
	});
});
