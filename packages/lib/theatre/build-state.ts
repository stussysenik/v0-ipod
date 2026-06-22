import { easingHandles, type CubicBezierHandles, type EasingName } from "./easings";
import type {
	TheatreKeyframe,
	TheatreObjectTracks,
	TheatreProjectState,
	TheatreSheetState,
	TheatreTrack,
} from "./keyframe-sampler";

/**
 * Author a Theatre.js `OnDiskState` from a concise, designer-readable spec.
 *
 * Hand-writing Theatre state is unbearable (PointableSet-style ids, per-keyframe
 * 4-tuples split across adjacent segments, JSON-encoded prop paths). This builder
 * lets a preset say "azimuth goes 0 → 90 with an easeOutCubic" and produces a
 * state that BOTH our pure sampler and `@theatre/core` consume identically — so a
 * preset can be opened in the studio GUI, tweaked, exported, and read back.
 *
 * EASING ASSEMBLY: an easing is a segment curve `(c1,c2)`. Theatre stores ONE
 * handle tuple per keyframe `[leftX,leftY,rightX,rightY]`; a segment's curve is the
 * LEFT keyframe's right handle plus the RIGHT keyframe's left handle. So for the
 * segment i → i+1 with easing E we write E.c1 into keyframe i's right handle and
 * E.c2 into keyframe i+1's left handle. The easing lives on the LEFT keyframe of
 * each segment.
 */

export interface KeyframeSpec {
	position: number;
	value: number;
	/** Easing applied to the segment LEAVING this keyframe (default `easeInOut`). */
	easing?: EasingName | CubicBezierHandles;
	/** Step (no tween) out of this keyframe. */
	hold?: boolean;
}

export interface TrackSpec {
	keyframes: KeyframeSpec[];
}

export interface ObjectSpec {
	key: string;
	/** Prop path (dot notation, e.g. `"target.x"`) → track spec. */
	tracks: Record<string, TrackSpec>;
}

export interface SheetSpec {
	sheetId: string;
	/** Sequence length in seconds. Defaults to the last keyframe position. */
	length?: number;
	fps?: number;
	objects: ObjectSpec[];
}

const DEFAULT_EASING: EasingName = "easeInOut";
/** Outer handle for the first/last keyframe — never used by interpolation. */
const NEUTRAL_HANDLE: readonly [number, number] = [0.5, 0.5];

/** Encode a dot-path (or array path) the way Theatre keys its tracks. */
export function encodePropPath(path: string | readonly string[]): string {
	const segments = Array.isArray(path) ? path : String(path).split(".");
	return JSON.stringify(segments);
}

function buildTrack(spec: TrackSpec, debugName: string): TheatreTrack {
	const kfs = [...spec.keyframes].sort((a, b) => a.position - b.position);

	const keyframes: TheatreKeyframe[] = kfs.map((kf, i) => {
		const isLast = i === kfs.length - 1;
		const outgoing = easingHandles(kf.easing ?? DEFAULT_EASING);
		const incoming = i > 0 ? easingHandles(kfs[i - 1].easing ?? DEFAULT_EASING) : null;

		// left handle = incoming segment's c2; right handle = outgoing segment's c1.
		const leftX = incoming ? incoming[2] : NEUTRAL_HANDLE[0];
		const leftY = incoming ? incoming[3] : NEUTRAL_HANDLE[1];
		const rightX = isLast ? NEUTRAL_HANDLE[0] : outgoing[0];
		const rightY = isLast ? NEUTRAL_HANDLE[1] : outgoing[1];

		return {
			id: `kf${i}`,
			position: kf.position,
			value: kf.value,
			handles: [leftX, leftY, rightX, rightY],
			connectedRight: !isLast,
			type: kf.hold ? "hold" : "bezier",
		};
	});

	return { type: "BasicKeyframedTrack", __debugName: debugName, keyframes };
}

function lastPosition(spec: SheetSpec): number {
	let max = 0;
	for (const obj of spec.objects) {
		for (const track of Object.values(obj.tracks)) {
			for (const kf of track.keyframes) {
				if (kf.position > max) {
					max = kf.position;
				}
			}
		}
	}
	return max;
}

export function buildTheatreState(spec: SheetSpec): TheatreProjectState {
	const tracksByObject: Record<string, TheatreObjectTracks> = {};

	for (const obj of spec.objects) {
		const trackIdByPropPath: Record<string, string> = {};
		const trackData: Record<string, TheatreTrack> = {};
		let trackIndex = 0;
		for (const [propPath, trackSpec] of Object.entries(obj.tracks)) {
			const trackId = `${obj.key}-track-${trackIndex++}`;
			trackIdByPropPath[encodePropPath(propPath)] = trackId;
			trackData[trackId] = buildTrack(trackSpec, `${obj.key}:${propPath}`);
		}
		tracksByObject[obj.key] = { trackIdByPropPath, trackData };
	}

	const sheet: TheatreSheetState = {
		staticOverrides: { byObject: {} },
		sequence: {
			type: "PositionalSequence",
			length: spec.length ?? lastPosition(spec),
			subUnitsPerUnit: spec.fps ?? 30,
			tracksByObject,
		},
	};

	return {
		sheetsById: { [spec.sheetId]: sheet },
		revisionHistory: ["rev-initial"],
		definitionVersion: "0.4.0",
	};
}
