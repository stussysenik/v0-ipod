import { createMotionSampler, type MotionDoc } from "./doc";
import { orderedTrackKeys } from "./track-edit";

/**
 * THE TRACE — a motion document reduced to the shape it draws, so a picker can state a value.
 *
 * Every other control in the motion inspector shows what it holds: a track row reads
 * `Azimuth ±17°`, a shelf row reads `3× · 1.7s · seamless`. The picker that chooses WHICH
 * document is being edited showed five words. `Turntable` is a name for a shape, and a name
 * for a shape is something you learn by trying all five and remembering which was which.
 *
 * GENERATED, NEVER BAKED. The obvious implementation is a rendered thumbnail per move, and it
 * is the wrong one twice over: five 3D renders of the real device is a withdrawal from the
 * byte budget and a frame cost on the target machine, spent to show a shape
 * `createMotionSampler` already knows exactly. Sampling the document is free, and it is the
 * same document the live rig flies and the encoder exports — so the picture cannot drift from
 * the motion the way a captured asset can.
 *
 * TWO DECISIONS THAT ARE LOAD-BEARING:
 *
 * 1. **Normalised per track, not per document.** A document's tracks carry incommensurable
 *    units — a 360° turn beside a 0.65-unit dolly — and one normaliser across both makes reach
 *    vanish next to azimuth while implying the two were compared. Per-track normalisation
 *    states SHAPE, which is unit-free. Amplitude is a value the Tracks rows already carry.
 *
 * 2. **The extent is the SAMPLED one, not the keyframes'.** `easeInOutBack` overshoots past
 *    every keyframe it connects, so normalising by authored values would draw a curve leaving
 *    its own frame. Normalising by what was sampled makes `y ∈ [0,1]` a property of the
 *    output rather than a hope about the input.
 *
 * This module reads; it never interpolates. Curves are solved by `UnitBezier` through
 * `createMotionSampler`, which is where the parity test pins them.
 */

/** Samples across one cycle. Enough to resolve a sine's shoulders at the rendered pad size. */
export const TRACE_SAMPLES = 48;

/**
 * The cycle is half-open: phase 1 IS phase 0, because `wrapPhase` says so and every consumer
 * agrees. Sampling the closing point at 1 would read the opening value, which turns a full
 * 360° turn into a sawtooth that drops off a cliff it never drives over. Reading just shy of
 * the seam is the same call `DEFAULT_PROOF_POSITIONS` already makes with its `0.999`.
 */
const LAST_PHASE = 1 - 1e-6;

/** Relative floor below which a track's sampled extent is noise rather than motion. */
const FLAT_EPSILON = 1e-9;

/** Where a track with no extent draws: the middle of its own frame. */
const FLAT_Y = 0.5;

/** A point on the trace: `[x, y]`, both in `[0,1]`. `x` is cycle phase, `y` is normalised value. */
export type TracePoint = readonly [number, number];

export interface MotionTraceLine {
	/** The track this line draws, as keyed in `MotionDoc.tracks`. */
	key: string;
	points: readonly TracePoint[];
	/**
	 * The track's sampled extent is zero — a held axis, or one dialled to gain 0. It draws down
	 * the middle, which is the honest picture of an axis contributing nothing to the move.
	 */
	flat: boolean;
}

export interface MotionTrace {
	/** One line per track, in `orderedTrackKeys` order so the picture matches the Tracks rows. */
	lines: readonly MotionTraceLine[];
	/** Points per line. Every line carries the same count, so a playhead maps by index. */
	samples: number;
}

/**
 * Sample a document into one normalised polyline per track.
 *
 * Pure and total: same document, same array, on any machine and any day. That is what lets
 * the result be memoised against `motionDocHash` by the caller rather than recomputed per
 * frame, and it is the same determinism claim the export fingerprint rests on.
 */
export function motionTrace(doc: MotionDoc, samples: number = TRACE_SAMPLES): MotionTrace {
	// Two points is the floor: a line needs a start and an end, and `i / (n - 1)` needs n > 1.
	const count = Math.max(2, Math.floor(samples));
	const keys = orderedTrackKeys(doc.tracks);
	if (keys.length === 0) return { lines: [], samples: count };

	const sampler = createMotionSampler(doc);
	const values = keys.map(() => Array.from<number>({ length: count }));
	for (let i = 0; i < count; i += 1) {
		const phase = i === count - 1 ? LAST_PHASE : i / (count - 1);
		const all = sampler.sampleAll(phase);
		for (let k = 0; k < keys.length; k += 1) {
			values[k][i] = all[keys[k]] ?? 0;
		}
	}

	const lines = keys.map((key, k) => {
		const series = values[k];
		let min = series[0];
		let max = series[0];
		for (const value of series) {
			if (value < min) min = value;
			if (value > max) max = value;
		}
		const span = max - min;
		const flat = span <= FLAT_EPSILON * Math.max(1, Math.abs(max));
		const points: TracePoint[] = series.map((value, i) => [
			i / (count - 1),
			flat ? FLAT_Y : (value - min) / span,
		]);
		return { key, points, flat } satisfies MotionTraceLine;
	});

	return { lines, samples: count };
}
