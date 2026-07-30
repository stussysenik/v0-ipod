import type { TimelineProofFrame } from "./timeline-proof";

/**
 * THE STRIP'S ALGEBRA — what a reader of the timeline set has to get right.
 *
 * `planTimelineProof` already owns which poses are proved (§5.4) and the cache owns whether a
 * frame has landed. What remains is three decisions a filmstrip makes, all of them pure and
 * none of them safe to leave inside a component: the clip time each cell states, which cell
 * the playhead is nearest, and the fact that a cache miss is a frame STILL COMPUTING rather
 * than a frame that does not exist. There is no component test project here, so anything that
 * could be got wrong lives in this file and is proven in `timeline-strip.test.ts`.
 *
 * ORDER IS THE DOCUMENT'S, NEVER SORTED. `proofPositions` may be authored in any order and the
 * plan keys frames by index against that order, so re-sorting here would put a cell under a
 * label belonging to another frame's key.
 *
 * `nearest` IS NOT `current`. The playhead is continuous and the proved positions are five
 * points on it; a cell is the closest proof to where the playhead sits, which is a weaker and
 * true claim. Naming it `current` would assert the playhead is AT a proved position, and at
 * that point the strip would be lying at 4 of every 5 pixels of the scrub.
 */

export interface TimelineStripCell {
	/** Cache key for this frame — what the strip `peek`s. */
	key: string;
	/** Clip progress this frame proves, `[0,1)`. */
	position: number;
	/**
	 * Clip time the frame proves, formatted like the transport readout (`4.5s`) so the two
	 * readings under one scrubber are the same kind of number. The last position is `0.999`,
	 * which rounds to the clip length at one decimal — the same rounding the playhead readout
	 * already applies to itself.
	 */
	label: string;
	/** The cache holds this frame. `false` means computing; the set has no absent frames. */
	ready: boolean;
	/** No other frame is closer to the playhead. Exactly one cell per non-empty set. */
	nearest: boolean;
}

export interface TimelineStripArgs {
	/** Clip length, for the time label. */
	durationSec: number;
	/** Live playhead over the whole clip, `[0,1)`. */
	playhead: number;
	/** Cache presence for one frame key — the hook's `peek`, narrowed to a predicate. */
	ready: (key: string) => boolean;
}

/**
 * The index of the frame closest to the playhead, or `-1` for an empty set.
 *
 * Ties resolve to the lower index: a playhead exactly between two proofs is reported as the
 * earlier one, so the mark moves forward through the strip and never jumps back on a scrub
 * that only went forward.
 */
export function nearestFrameIndex(
	frames: readonly TimelineProofFrame[],
	playhead: number,
): number {
	let best = -1;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let index = 0; index < frames.length; index += 1) {
		const distance = Math.abs(frames[index].position - playhead);
		if (distance < bestDistance) {
			best = index;
			bestDistance = distance;
		}
	}
	return best;
}

/** One cell per planned frame, in the document's order. */
export function timelineStripCells(
	frames: readonly TimelineProofFrame[],
	{ durationSec, playhead, ready }: TimelineStripArgs,
): TimelineStripCell[] {
	const nearest = nearestFrameIndex(frames, playhead);
	return frames.map((frame, index) => ({
		key: frame.key,
		position: frame.position,
		label: `${(frame.position * durationSec).toFixed(1)}s`,
		ready: ready(frame.key),
		nearest: index === nearest,
	}));
}
