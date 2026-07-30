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
	return {
		...makeProofInputs(),
		motion: {
			docId: "orbit",
			docHash: "aaaa1111",
			repeat: 1,
			durationSec: 4,
			timeMap: { kind: "loop" },
		},
		...overrides,
	};
}

/** A snapshot differing from the base only in the named motion fields. */
function withMotion(patch: Partial<ExportSnapshot["motion"]>): ExportSnapshot {
	const base = makeSnapshot();
	return { ...base, motion: { ...base.motion, ...patch } };
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

	it("does NOT change with the motion identity (anchor frame is move-independent)", () => {
		// proofFingerprint takes ProofInputs which has no motion field; prove via snapshots
		// narrowed to proof inputs that motion doesn't leak in.
		const a = toProofInputs(makeSnapshot());
		const b = toProofInputs(
			withMotion({
				docId: "turntable",
				docHash: "bbbb2222",
				repeat: 6,
				durationSec: 30,
				timeMap: { kind: "boomerang" },
			}),
		);
		expect(proofFingerprint(a)).toBe(proofFingerprint(b));
	});
});

describe("exportFingerprint", () => {
	it("DOES change with motion (provenance distinguishes exports)", () => {
		const base = exportFingerprint(makeSnapshot());
		expect(exportFingerprint(withMotion({ docId: "turntable" }))).not.toBe(base);
		expect(exportFingerprint(withMotion({ repeat: 2 }))).not.toBe(base);
		expect(exportFingerprint(withMotion({ repeat: 0 }))).not.toBe(base);
		expect(exportFingerprint(withMotion({ timeMap: { kind: "boomerang" } }))).not.toBe(base);
		expect(exportFingerprint(withMotion({ durationSec: 8 }))).not.toBe(base);
	});

	it("a tuned document is a different export even under the same name", () => {
		// The defect this closes: `move: "orbit"` named both a pristine and a hand-tuned
		// Orbit, so two visibly different exports carried one identity.
		expect(exportFingerprint(withMotion({ docHash: "cccc3333" }))).not.toBe(
			exportFingerprint(makeSnapshot()),
		);
	});

	it("the retained overrides do NOT move the identity — docHash already carries them", () => {
		expect(
			exportFingerprint(withMotion({ overrides: { tracks: { azimuth: { keyframes: [] } } } })),
		).toBe(exportFingerprint(makeSnapshot()));
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
