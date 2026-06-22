import { describe, expect, it } from "vitest";

import {
	exportFingerprint,
	proofFingerprint,
	quantizePose,
	stableStringify,
	toProofInputs,
	type ExportSnapshot,
	type ProofInputs,
} from "./export-fingerprint";

const basePose = { azimuth: 24, elevation: 12, reach: 14, target: [0, 0, 0] as [number, number, number] };

function makeProofInputs(overrides: Partial<ProofInputs> = {}): ProofInputs {
	return {
		pose: { ...basePose },
		aspect: "portrait",
		quality: "pro",
		metadata: { title: "Song", artist: "Artist", album: "Album", currentTime: 30, duration: 200 },
		marquee: true,
		batteryLevel: 0.8,
		osScreen: "now-playing",
		presentation: {
			skinColor: "#c0c0c0",
			bgColor: "#101010",
			ringColor: "#888",
			centerColor: "#fff",
			backColor: "#cfd3d7",
			edgeColor: "#cfd3d7",
			bezelColor: "#0a0a0a",
			hardwarePreset: "classic",
		},
		lighting: { key: 1.2, fill: 0.4, rim: 0.8 },
		...overrides,
	};
}

function makeSnapshot(overrides: Partial<ExportSnapshot> = {}): ExportSnapshot {
	return { ...makeProofInputs(), move: "orbit", loop: "loop", speed: 1, durationSec: 4, ...overrides };
}

describe("stableStringify", () => {
	it("is independent of key order", () => {
		expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
	});

	it("preserves array order (arrays are meaningful)", () => {
		expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
	});

	it("sorts nested keys recursively", () => {
		expect(stableStringify({ o: { y: 1, x: 2 } })).toBe(stableStringify({ o: { x: 2, y: 1 } }));
	});
});

describe("proofFingerprint", () => {
	it("is identical for the same inputs in any field order", () => {
		const a = makeProofInputs();
		const b = makeProofInputs();
		expect(proofFingerprint(a)).toBe(proofFingerprint(b));
	});

	it("changes when a pixel-determining input changes", () => {
		const base = proofFingerprint(makeProofInputs());
		expect(proofFingerprint(makeProofInputs({ pose: { ...basePose, azimuth: 25 } }))).not.toBe(base);
		expect(
			proofFingerprint(makeProofInputs({ metadata: { title: "X", artist: "Artist", album: "Album", currentTime: 30, duration: 200 } })),
		).not.toBe(base);
		expect(
			proofFingerprint(makeProofInputs({ presentation: { ...makeProofInputs().presentation, skinColor: "#000" } })),
		).not.toBe(base);
		expect(proofFingerprint(makeProofInputs({ lighting: { key: 9 } }))).not.toBe(base);
		expect(proofFingerprint(makeProofInputs({ aspect: "square" }))).not.toBe(base);
	});

	it("ignores sub-quantization pose jitter", () => {
		const base = proofFingerprint(makeProofInputs());
		const jittered = proofFingerprint(
			makeProofInputs({ pose: { ...basePose, azimuth: 24.02, reach: 14.0004 } }),
		);
		expect(jittered).toBe(base);
	});

	it("does NOT change with move/loop/speed/duration (anchor frame is move-independent)", () => {
		// proofFingerprint takes ProofInputs which has no motion fields; prove via snapshots
		// narrowed to proof inputs that motion doesn't leak in.
		const a = toProofInputs(makeSnapshot({ move: "orbit" }));
		const b = toProofInputs(makeSnapshot({ move: "turntable", speed: 2, loop: "boomerang", durationSec: 30 }));
		expect(proofFingerprint(a)).toBe(proofFingerprint(b));
	});
});

describe("exportFingerprint", () => {
	it("DOES change with motion (provenance distinguishes exports)", () => {
		const base = exportFingerprint(makeSnapshot());
		expect(exportFingerprint(makeSnapshot({ move: "turntable" }))).not.toBe(base);
		expect(exportFingerprint(makeSnapshot({ speed: 2 }))).not.toBe(base);
		expect(exportFingerprint(makeSnapshot({ loop: "hold" }))).not.toBe(base);
		expect(exportFingerprint(makeSnapshot({ durationSec: 8 }))).not.toBe(base);
	});

	it("a snapshot's proof key is derivable and stable", () => {
		const snap = makeSnapshot();
		expect(proofFingerprint(toProofInputs(snap))).toBe(proofFingerprint(makeProofInputs()));
	});
});

describe("quantizePose", () => {
	it("rounds angles to 0.1° and distances to 1e-3, normalizing -0", () => {
		const q = quantizePose({ azimuth: 24.04, elevation: -0.0001, reach: 14.00049, target: [-0.0004, 0, 0] });
		expect(q.azimuth).toBe(24);
		expect(Object.is(q.elevation, 0)).toBe(true); // not -0
		expect(q.reach).toBe(14);
		expect(q.target[0]).toBe(0);
	});
});
