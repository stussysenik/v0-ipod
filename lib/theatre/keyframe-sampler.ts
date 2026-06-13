import { UnitBezier } from "./unit-bezier";

/**
 * A pure, synchronous reader for Theatre.js project state (`OnDiskState`).
 *
 * This is the keystone of the integration. Theatre owns the AUTHORING surface
 * (the studio timeline GUI) and the on-disk keyframe format; this module owns the
 * SAMPLING — turning that keyframe data into values at any timeline position with
 * no DOM, no ticker, and no warm prism. That makes it usable in three places that
 * Theatre's own runtime can't serve well:
 *   1. the deterministic offline export loop (render frame N at position N/fps),
 *   2. the live preview's `useFrame` (read once per frame, no subscription churn),
 *   3. unit tests in plain Node.
 *
 * The shapes below mirror `@theatre/core`'s `OnDiskState` (verified against its
 * `.d.ts`): keyframes are a flat ARRAY, easing handles are a 4-tuple shared
 * across adjacent segments, and prop paths are JSON-encoded arrays. The
 * companion parity test proves this sampler matches `@theatre/core` exactly.
 */

export type TheatreKeyframeType = "bezier" | "hold";

export interface TheatreKeyframe {
	id: string;
	/** Camera/lighting tracks are numeric; that is all this sampler interpolates. */
	value: number;
	position: number;
	/** [leftX, leftY, rightX, rightY] Bézier handles, normalized into the segment. */
	handles: [number, number, number, number];
	/** Is there a tween to the next keyframe, or does the value hold? */
	connectedRight: boolean;
	type?: TheatreKeyframeType;
}

export interface TheatreTrack {
	type: "BasicKeyframedTrack";
	__debugName?: string;
	keyframes: TheatreKeyframe[];
}

export interface TheatreObjectTracks {
	/** Maps a JSON-encoded prop path (e.g. `["target","x"]`) to a track id. */
	trackIdByPropPath: Record<string, string>;
	trackData: Record<string, TheatreTrack>;
}

export interface TheatreSequence {
	type: "PositionalSequence";
	length?: number;
	subUnitsPerUnit?: number;
	tracksByObject: Record<string, TheatreObjectTracks>;
}

export interface TheatreSheetState {
	staticOverrides: { byObject: Record<string, Record<string, unknown>> };
	sequence?: TheatreSequence;
}

export interface TheatreProjectState {
	sheetsById: Record<string, TheatreSheetState>;
	revisionHistory: string[];
	definitionVersion: string;
}

/** A nested plain object built up from decoded prop paths. */
export type SampledValues = Record<string, unknown>;

/**
 * Interpolate a single keyframed track at `position`.
 *
 * Mirrors `@theatre/core`'s `interpolationTripleAtPosition` semantics exactly:
 *   • before the first / after the last keyframe → clamp to that keyframe's value;
 *   • `connectedRight === false` → the segment does not tween (hold left value);
 *   • `type === "hold"` → step interpolation (left value until the right keyframe);
 *   • otherwise → Bézier-eased lerp using the left keyframe's RIGHT handle and the
 *     right keyframe's LEFT handle as the two control points.
 */
export function sampleTrack(track: TheatreTrack, position: number): number {
	const kfs = track.keyframes;
	if (kfs.length === 0) {
		return 0;
	}
	// Keyframes are stored sorted, but never trust unsorted input in a sampler.
	const sorted =
		isSortedByPosition(kfs) ? kfs : [...kfs].sort((a, b) => a.position - b.position);

	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	if (position <= first.position) {
		return first.value;
	}
	if (position >= last.position) {
		return last.value;
	}

	// Find the segment [left, right] containing `position`.
	let left = first;
	let right = sorted[1];
	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i].position > position) {
			left = sorted[i - 1];
			right = sorted[i];
			break;
		}
	}

	if (!left.connectedRight) {
		return left.value; // segment intentionally not tweened
	}

	const span = right.position - left.position;
	const localProgression = span <= 0 ? 0 : (position - left.position) / span;

	if (left.type === "hold") {
		return Math.floor(localProgression) >= 1 ? right.value : left.value;
	}

	const solver = new UnitBezier(left.handles[2], left.handles[3], right.handles[0], right.handles[1]);
	const valueProgression = solver.solve(localProgression);
	return left.value + valueProgression * (right.value - left.value);
}

function isSortedByPosition(kfs: readonly TheatreKeyframe[]): boolean {
	for (let i = 1; i < kfs.length; i++) {
		if (kfs[i].position < kfs[i - 1].position) {
			return false;
		}
	}
	return true;
}

/** Decode Theatre's JSON-encoded prop path (`'["target","x"]'` → `["target","x"]`). */
export function decodePropPath(encoded: string): string[] {
	try {
		const parsed: unknown = JSON.parse(encoded);
		if (Array.isArray(parsed)) {
			return parsed.map((p) => String(p));
		}
	} catch {
		// Not JSON — treat the whole string as a single-segment path.
	}
	return [encoded];
}

/** Assign `value` at a nested `path` inside `target`, creating objects as needed. */
function setDeep(target: SampledValues, path: string[], value: unknown): void {
	let node = target;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		if (typeof node[key] !== "object" || node[key] === null) {
			node[key] = {};
		}
		node = node[key] as SampledValues;
	}
	node[path[path.length - 1]] = value;
}

/** The longest keyframe position across every track — the true playable length. */
export function computeSequenceLength(state: TheatreProjectState, sheetId?: string): number {
	const sheet = resolveSheet(state, sheetId);
	const seq = sheet?.sequence;
	if (!seq) {
		return 0;
	}
	if (typeof seq.length === "number" && seq.length > 0) {
		return seq.length;
	}
	let max = 0;
	for (const tracks of Object.values(seq.tracksByObject)) {
		for (const track of Object.values(tracks.trackData)) {
			for (const kf of track.keyframes) {
				if (kf.position > max) {
					max = kf.position;
				}
			}
		}
	}
	return max;
}

function resolveSheet(state: TheatreProjectState, sheetId?: string): TheatreSheetState | undefined {
	if (sheetId) {
		return state.sheetsById[sheetId];
	}
	const ids = Object.keys(state.sheetsById);
	return ids.length > 0 ? state.sheetsById[ids[0]] : undefined;
}

export interface StateSampler {
	readonly sheetId: string;
	readonly sequenceLength: number;
	readonly objectKeys: string[];
	/** All sequenced + static values for one object at `position`, nested by prop path. */
	sampleObject(objectKey: string, position: number): SampledValues;
	/** Every object's sampled values at `position`, keyed by object key. */
	sampleAll(position: number): Record<string, SampledValues>;
}

/**
 * Build a reusable sampler over a Theatre project state. The returned object is
 * the only thing the runtime and tests touch — it hides the prop-path decoding,
 * static-override merging, and per-track interpolation behind two read methods.
 */
export function createStateSampler(state: TheatreProjectState, sheetId?: string): StateSampler {
	const resolvedId = sheetId ?? Object.keys(state.sheetsById)[0];
	const sheet = resolveSheet(state, resolvedId);
	const seq = sheet?.sequence;
	const tracksByObject = seq?.tracksByObject ?? {};
	const staticByObject = sheet?.staticOverrides?.byObject ?? {};
	const objectKeys = Array.from(
		new Set([...Object.keys(tracksByObject), ...Object.keys(staticByObject)]),
	);

	function sampleObject(objectKey: string, position: number): SampledValues {
		const out: SampledValues = {};

		// Static overrides first, so sequenced props can win where they exist.
		const statics = staticByObject[objectKey];
		if (statics) {
			for (const [key, value] of Object.entries(statics)) {
				out[key] = value;
			}
		}

		const tracks = tracksByObject[objectKey];
		if (tracks) {
			for (const [encodedPath, trackId] of Object.entries(tracks.trackIdByPropPath)) {
				const track = tracks.trackData[trackId];
				if (!track) {
					continue;
				}
				setDeep(out, decodePropPath(encodedPath), sampleTrack(track, position));
			}
		}

		return out;
	}

	return {
		sheetId: resolvedId,
		sequenceLength: computeSequenceLength(state, resolvedId),
		objectKeys,
		sampleObject,
		sampleAll(position: number): Record<string, SampledValues> {
			const out: Record<string, SampledValues> = {};
			for (const key of objectKeys) {
				out[key] = sampleObject(key, position);
			}
			return out;
		},
	};
}
