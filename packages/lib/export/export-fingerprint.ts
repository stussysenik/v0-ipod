/**
 * The deterministic export fingerprint — the key that makes proof a guarantee.
 *
 * Export pixels are a pure function of their inputs (proven by the theatre parity test).
 * So a frame can be CONTENT-ADDRESSED: hash the inputs, and a frame stored under that hash
 * *is* the export for those inputs, not a preview of it. This module computes that hash.
 *
 * Two related keys, because two questions are being answered:
 *
 *   • `proofFingerprint` keys the proof CACHE. It covers only the inputs that change the
 *     ANCHOR FRAME (phase 0 = the composed angle). Every camera move starts at the hero
 *     pose, so `move`/`loop`/`speed`/`duration` do NOT change frame 0 — including them
 *     would re-render byte-identical frames while you browse moves. They are deliberately
 *     excluded from the cache key.
 *
 *   • `exportFingerprint` is the full export IDENTITY for provenance ("what did I export?").
 *     It is the proof inputs PLUS `move`/`loop`/`speed`/`durationSec`, so two exports that
 *     differ only in motion are distinct records and each restores its exact setup.
 *
 * Both are pure: canonical key-sorted JSON → FNV-1a. No `Date`/random/wall-clock, so they
 * reproduce across reloads and are unit-testable in the node project. `FINGERPRINT_VERSION`
 * is folded in so changing the input set busts every prior entry.
 */

export const FINGERPRINT_VERSION = 1;

export interface FingerprintPose {
	azimuth: number;
	elevation: number;
	reach: number;
	target: [number, number, number];
}

/** Inputs that determine the anchor frame's pixels (the proof). */
export interface ProofInputs {
	pose: FingerprintPose;
	aspect: string;
	quality: string;
	metadata: {
		title: string;
		artist: string;
		album: string;
		currentTime: number;
		duration: number;
	};
	marquee: boolean;
	batteryLevel: number;
	osScreen: string;
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
	/** The studio lighting rig — serialized structurally. */
	lighting: unknown;
}

/** The full export identity (proof inputs + motion) for provenance + re-open. */
export interface ExportSnapshot extends ProofInputs {
	move: string;
	loop: string;
	speed: number;
	durationSec: number;
}

/**
 * Pose quantization. Sub-pixel jitter (a 0.01° nudge from an orbit drag) must not mint a
 * new cache key, or speculative pre-compute would thrash. We round to a precision below
 * visible change: angles to 0.1°, distances to 1e-3.
 */
const ANGLE_PRECISION = 10; // → 0.1° steps
const DISTANCE_PRECISION = 1000; // → 1e-3 steps

function quantize(value: number, steps: number): number {
	// `+ 0` normalizes -0 to 0 so the two hash identically.
	return Math.round(value * steps) / steps + 0;
}

export function quantizePose(pose: FingerprintPose): FingerprintPose {
	return {
		azimuth: quantize(pose.azimuth, ANGLE_PRECISION),
		elevation: quantize(pose.elevation, ANGLE_PRECISION),
		reach: quantize(pose.reach, DISTANCE_PRECISION),
		target: [
			quantize(pose.target[0], DISTANCE_PRECISION),
			quantize(pose.target[1], DISTANCE_PRECISION),
			quantize(pose.target[2], DISTANCE_PRECISION),
		],
	};
}

/**
 * Canonical JSON: object keys sorted recursively so field ORDER never affects the hash.
 * Arrays keep their order (it is meaningful). This is the determinism backbone — the same
 * logical input always serializes to the same string.
 */
export function stableStringify(value: unknown): string {
	if (value === null || typeof value !== "object") {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(",")}]`;
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	return `{${keys
		.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
		.join(",")}}`;
}

/** FNV-1a 32-bit → 8-char hex. Tiny, fast, stable, and dependency-free. */
export function hashString(input: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		// h *= 16777619, kept in 32-bit unsigned range via Math.imul.
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, "0");
}

// Pick ONLY the proof fields explicitly (never spread) so passing a superset — e.g. a full
// ExportSnapshot with motion fields — can't leak extra keys into the proof hash.
function normalizeProofInputs(inputs: ProofInputs): ProofInputs {
	return {
		pose: quantizePose(inputs.pose),
		aspect: inputs.aspect,
		quality: inputs.quality,
		metadata: {
			title: inputs.metadata.title,
			artist: inputs.metadata.artist,
			album: inputs.metadata.album,
			currentTime: inputs.metadata.currentTime,
			duration: inputs.metadata.duration,
		},
		marquee: inputs.marquee,
		batteryLevel: inputs.batteryLevel,
		osScreen: inputs.osScreen,
		presentation: {
			skinColor: inputs.presentation.skinColor,
			bgColor: inputs.presentation.bgColor,
			ringColor: inputs.presentation.ringColor,
			centerColor: inputs.presentation.centerColor,
			backColor: inputs.presentation.backColor,
			edgeColor: inputs.presentation.edgeColor,
			bezelColor: inputs.presentation.bezelColor,
			hardwarePreset: inputs.presentation.hardwarePreset,
		},
		lighting: inputs.lighting,
	};
}

/** Cache key: hashes only the anchor-frame-determining inputs. */
export function proofFingerprint(inputs: ProofInputs): string {
	const canonical = stableStringify({
		v: FINGERPRINT_VERSION,
		kind: "proof",
		inputs: normalizeProofInputs(inputs),
	});
	return hashString(canonical);
}

/** Provenance identity: the full export setup, motion included. */
export function exportFingerprint(snapshot: ExportSnapshot): string {
	const { move, loop, speed, durationSec, ...proof } = snapshot;
	const canonical = stableStringify({
		v: FINGERPRINT_VERSION,
		kind: "export",
		motion: { move, loop, speed, durationSec },
		inputs: normalizeProofInputs(proof),
	});
	return hashString(canonical);
}

/** Narrow a full snapshot to just its proof inputs (so an export's proof key is derivable). */
export function toProofInputs(snapshot: ExportSnapshot): ProofInputs {
	const { move: _m, loop: _l, speed: _s, durationSec: _d, ...proof } = snapshot;
	return proof;
}
