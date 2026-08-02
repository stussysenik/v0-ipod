import { splitEase } from "../theatre/bezier-split";
import type { Ease } from "../theatre/easings";
import {
	createMotionSampler,
	DEFAULT_MOTION_EASING,
	wrapPhase,
	type MotionDoc,
	type MotionKeyframe,
	type MotionTrack,
} from "../motion/doc";

/**
 * THE ARC IS THE EDITOR — a move read as one route through space, deformable by hand.
 *
 * The throw (`throw-to-edit.ts`) authors a move in three scalars: how hard, from where, how
 * bent. That covers every move whose shape is the shipped move's shape. What it cannot reach
 * is a route the catalogue never drew — a pause on the far side, a dip before the rise, a
 * second approach. The panel answer to that is a curve pad with keyframe insertion and
 * per-segment easing rows, which is the animation tool this change exists to delete.
 *
 * THE READING THAT MAKES IT A VIEW RATHER THAN A FEATURE. `azimuth`/`elevation`/`reach` about
 * `targetX/Y/Z` are spherical coordinates about a movable origin, so the six tracks already
 * span every route through space. A custom path therefore needs NO new stored shape, no
 * spline, and no `FINGERPRINT_VERSION` bump — it needs keyframe placement and a picture.
 * Building a spline store would have shipped two encodings of one path.
 *
 * A PATH IS AN EDIT OVER THE BASE, NEVER A REPLACEMENT FOR IT. A knot carries positions only;
 * curves and holds stay in the base document and are resolved at `applyPath` time. That is the
 * same rule `applyTrackEdit` follows and for the same reason: an edit derived from the previous
 * edit accumulates float drift down a drag, and an edit derived from the base does not. It is
 * also what keeps a knot two numbers instead of two numbers plus a curve per axis.
 *
 * PLACEMENT MOVES NO PIXEL. `insertKnot` splits the segment's ease exactly
 * (`lib/theatre/bezier-split.ts`), so adding a control point is a change of what is grabbable,
 * not a change of the move. The deviation is measured at 128 phases in this module's test; a
 * tool that bends the curve at the moment of adding a point makes the author correct the tool.
 *
 * THE CYCLE IS A CIRCLE, SO DISTANCE WRAPS. Falloff is measured with `cycleDistance`, which
 * makes a knot at phase 1 and a knot at phase 0 the same place. The loop seam therefore
 * survives a deform without a special case — pull the closing knot and the opening one comes
 * with it, because they are one point read twice.
 *
 * WHAT THE ARC DOES NOT EDIT, stated rather than hidden: a document whose tracks carry
 * DIFFERENT phase offsets has no single arc, because each axis is then reading the cycle from
 * a different place. `pathFromDoc` returns `null` there and the wheel's Motion branch shows
 * the typed per-track rows instead. That is the same boundary `design.md` D2 already drew.
 */

/** A grabbable point on the arc: one cycle position, one offset per track. */
export interface PathKnot {
	/** Cycle position, `[0,1]`. `1` is the closing knot and reads as the same place as `0`. */
	at: number;
	/** Offset from the hero pose per track key, in each track's native unit. */
	value: Readonly<Record<string, number>>;
}

export interface MotionPath {
	/** Ascending by `at`. Every knot carries a value for every track key in the base. */
	knots: readonly PathKnot[];
	/** The sampling offset every track shares. A path over split phases does not exist. */
	phase: number;
	/** The track keys the knots span, in the base document's own order. */
	keys: readonly string[];
}

/**
 * How far a deform reaches, as a fraction of the cycle. A fifth of a loop is wide enough that
 * one pull reads as a bend rather than a corner, and narrow enough that the far side of the
 * move is untouched — the property that makes a second pull an edit rather than a fight.
 */
export const DEFAULT_FALLOFF = 0.2;

/** Positions closer than this are the same knot; a cut there would produce a zero-length segment. */
const KNOT_EPSILON = 1e-6;

/** The cycle is half-open: phase 1 IS phase 0 to every sampler here, so a read stops just shy. */
const LAST_PHASE = 1 - 1e-9;

/** Distance around a cycle of circumference 1. Phase 0.98 and phase 0.02 are 0.04 apart. */
export function cycleDistance(a: number, b: number): number {
	const raw = Math.abs(wrapPhase(a) - wrapPhase(b));
	return Math.min(raw, 1 - raw);
}

/**
 * A raised cosine over the falloff radius: 1 at the grabbed knot, 0 at the radius, and zero
 * slope at both ends. The zero slope is the point — a linear falloff leaves a visible crease
 * where the influence stops, which reads as a defect in the move rather than a choice.
 */
export function knotWeight(at: number, grabbedAt: number, radius: number): number {
	if (!(radius > 0)) return cycleDistance(at, grabbedAt) < KNOT_EPSILON ? 1 : 0;
	const d = cycleDistance(at, grabbedAt);
	if (d >= radius) return 0;
	return 0.5 * (1 + Math.cos(Math.PI * (d / radius)));
}

/**
 * The one phase every track reads the cycle from, or `null` when they disagree.
 *
 * An absent `phase` is 0 rather than "no opinion", because that is what the sampler reads.
 */
export function sharedPhase(doc: MotionDoc): number | null {
	let shared: number | null = null;
	for (const track of Object.values(doc.tracks)) {
		const phase = wrapPhase(track.phase ?? 0);
		if (shared === null) shared = phase;
		else if (shared !== phase) return null;
	}
	return shared ?? 0;
}

/** Every authored cycle position across every track, deduplicated and ascending. */
function knotPositions(doc: MotionDoc): number[] {
	const seen: number[] = [];
	for (const track of Object.values(doc.tracks)) {
		for (const kf of track.keyframes) {
			if (!Number.isFinite(kf.at)) continue;
			if (!seen.some((at) => Math.abs(at - kf.at) < KNOT_EPSILON)) seen.push(kf.at);
		}
	}
	return seen.sort((a, b) => a - b);
}

/**
 * Read a document as one route.
 *
 * Positions are the union of every track's keyframes, so an axis that has no keyframe where
 * another does contributes its interpolated value there. That is what makes the arc ONE
 * object with one set of grab points rather than six lines a hand has to pick between.
 */
export function pathFromDoc(doc: MotionDoc): MotionPath | null {
	const phase = sharedPhase(doc);
	if (phase === null) return null;

	const keys = Object.keys(doc.tracks);
	const positions = knotPositions(doc);
	if (positions.length === 0) return { knots: [], phase, keys };

	// An AUTHORED value is read from the keyframe, never sampled back out. Two reasons, and the
	// second is a defect this cost: reading the keyframe is exact where a solved curve is only
	// close, and phase 1 wraps to phase 0 in every sampler here — so a turntable's closing 360°
	// would read as its opening 0° and the move would become a sawtooth. `trace.ts` documents
	// the same trap. Only positions a track does NOT author are interpolated, just shy of the
	// seam, which is the call `DEFAULT_PROOF_POSITIONS` already makes with its `0.999`.
	const sampler = createMotionSampler(doc);
	const knots = positions.map((at) => {
		const sampled = sampler.sampleAll(wrapPhase(Math.min(at, LAST_PHASE) - phase));
		const value: Record<string, number> = {};
		for (const key of keys) {
			const authored = doc.tracks[key].keyframes.find((kf) => Math.abs(kf.at - at) < KNOT_EPSILON);
			value[key] = authored ? authored.value : (sampled[key] ?? 0);
		}
		return { at, value } satisfies PathKnot;
	});
	return { knots, phase, keys };
}

/** Base keyframes ascending — the segment structure every curve decision is read from. */
function sortedFrames(track: MotionTrack): MotionKeyframe[] {
	return [...track.keyframes].sort((a, b) => a.at - b.at);
}

/** Index of the base keyframe at `at`, or `-1`. */
function anchorIndex(frames: readonly MotionKeyframe[], at: number): number {
	return frames.findIndex((kf) => Math.abs(kf.at - at) < KNOT_EPSILON);
}

/** Index of the base keyframe opening the segment that contains `at`, or `-1` outside the range. */
function segmentIndex(frames: readonly MotionKeyframe[], at: number): number {
	for (let i = 0; i < frames.length - 1; i += 1) {
		if (at > frames[i].at && at < frames[i + 1].at) return i;
	}
	return -1;
}

/**
 * Lay a path back over the base document.
 *
 * Curves come from the base: a knot the base already had keeps its authored ease, and a knot
 * the path inserted takes the exact split of the curve REMAINING in the segment it landed in.
 * The remainder is what makes two knots in one segment correct — the second cuts the first's
 * right half, not the original curve, which is the same distinction as splitting a rope twice.
 * A held segment splits into two held segments, exact without any bezier at all.
 *
 * A base keyframe the path no longer carries is dropped along with its curve, and the segment
 * it opened widens. Removal is the one gesture here that is MEANT to change the move.
 */
export function applyPath(base: MotionDoc, path: MotionPath): MotionDoc {
	const tracks: Record<string, MotionTrack> = {};
	for (const [key, baseTrack] of Object.entries(base.tracks)) {
		const frames = sortedFrames(baseTrack);
		const keyframes: MotionKeyframe[] = [];

		// The curve still unspent in the base segment currently being walked, and the span it
		// covers. `segment` is the base index, so a second knot in one segment is recognised
		// as such even though `spanStart` has already moved onto the first knot.
		let segment = -1;
		let remaining: Ease | undefined;
		let held = false;
		let spanStart = 0;
		let spanEnd = 0;

		for (const knot of path.knots) {
			const frame: MotionKeyframe = { at: knot.at, value: knot.value[key] ?? 0 };
			const anchor = anchorIndex(frames, knot.at);
			if (anchor >= 0) {
				const source = frames[anchor];
				if (source.easing !== undefined) frame.easing = source.easing;
				if (source.hold) frame.hold = true;
				segment = anchor;
				remaining = source.easing;
				held = source.hold === true;
				spanStart = source.at;
				spanEnd = frames[anchor + 1]?.at ?? source.at;
				keyframes.push(frame);
				continue;
			}

			const inside = segmentIndex(frames, knot.at);
			if (inside < 0) {
				// Outside the track's authored range: the sampler clamps there, so the value is
				// the endpoint's and any curve reproduces it.
				keyframes.push(frame);
				continue;
			}
			if (inside !== segment) {
				// Entered a segment without passing its opening keyframe — the path dropped it.
				segment = inside;
				remaining = frames[inside].easing;
				held = frames[inside].hold === true;
				spanStart = frames[inside].at;
				spanEnd = frames[inside + 1].at;
			}
			if (held) {
				frame.hold = true;
				keyframes.push(frame);
				continue;
			}
			if (!(spanEnd > spanStart)) {
				keyframes.push(frame);
				continue;
			}
			// An ABSENT easing is not a neutral one: `resolveEase` substitutes
			// `DEFAULT_MOTION_EASING` before the sampler ever sees the keyframe, so a segment
			// with no authored curve still has a curve, and splitting it means splitting that.
			// Leaving both halves unauthored would apply the whole default twice.
			if (remaining === undefined) remaining = DEFAULT_MOTION_EASING;
			const split = splitEase(remaining, (knot.at - spanStart) / (spanEnd - spanStart));
			if (split) {
				const previous = keyframes[keyframes.length - 1];
				if (previous) previous.easing = split.left;
				frame.easing = split.right;
				remaining = split.right;
				spanStart = knot.at;
			}
			keyframes.push(frame);
		}

		const track: MotionTrack = { keyframes };
		const phase = wrapPhase(path.phase);
		if (phase !== 0) track.phase = phase;
		tracks[key] = track;
	}
	return { ...base, tracks };
}

/**
 * Can a knot be placed here without reshaping the move?
 *
 * Every track's segment at this position must cut exactly. One curve in the whole easing
 * vocabulary cannot — `easeInOutExpo`, whose halves need an x handle outside the domain
 * `resolveEase` clamps to — and the honest answer there is that the arc takes no knot rather
 * than that it takes one and bends. No shipped document authors that curve; the measurement
 * is pinned in this module's test so the day one does, the dead spot is already explained.
 */
export function canPlaceKnot(doc: MotionDoc, at: number): boolean {
	const position = wrapPhase(at);
	for (const track of Object.values(doc.tracks)) {
		const frames = sortedFrames(track);
		if (anchorIndex(frames, position) >= 0) return false;
		const inside = segmentIndex(frames, position);
		if (inside < 0 || frames[inside].hold) continue;
		const span = frames[inside + 1].at - frames[inside].at;
		if (!(span > 0)) continue;
		const ease = frames[inside].easing ?? DEFAULT_MOTION_EASING;
		if (!splitEase(ease, (position - frames[inside].at) / span)) return false;
	}
	return true;
}

/**
 * Place a knot on the arc at a cycle position.
 *
 * The values are read from the path AS IT STANDS — `applyPath` over the base, sampled — so a
 * knot added after a deform lands on the deformed route rather than on the shipped one.
 * Returns the path unchanged when a knot already sits there, or when the cut is not storable.
 */
export function insertKnot(base: MotionDoc, path: MotionPath, at: number): MotionPath {
	const position = wrapPhase(at);
	if (path.knots.some((knot) => Math.abs(knot.at - position) < KNOT_EPSILON)) return path;

	const current = applyPath(base, path);
	if (!canPlaceKnot(current, position)) return path;
	const sampler = createMotionSampler(current);
	const all = sampler.sampleAll(wrapPhase(position - path.phase));
	const value: Record<string, number> = {};
	for (const key of path.keys) value[key] = all[key] ?? 0;

	const knots = [...path.knots, { at: position, value }].sort((a, b) => a.at - b.at);
	return { ...path, knots };
}

/**
 * Pull one knot and let its neighbours follow.
 *
 * `grabbed` is the path as it was when the hand closed, not the path from the previous frame
 * of the same drag. Dragging out and back therefore returns bit-identical values rather than
 * approximately identical ones, which is the property `isPristineTrack` needs in order to
 * clear an override instead of storing a copy of the base.
 */
export function deformPath(
	grabbed: MotionPath,
	index: number,
	delta: Readonly<Record<string, number>>,
	radius: number = DEFAULT_FALLOFF,
): MotionPath {
	const anchor = grabbed.knots[index];
	if (!anchor) return grabbed;

	const knots = grabbed.knots.map((knot) => {
		const weight = knotWeight(knot.at, anchor.at, radius);
		if (weight === 0) return knot;
		const value: Record<string, number> = { ...knot.value };
		for (const key of grabbed.keys) {
			const shift = delta[key];
			if (shift === undefined || shift === 0) continue;
			value[key] = (knot.value[key] ?? 0) + shift * weight;
		}
		return { at: knot.at, value } satisfies PathKnot;
	});
	return { ...grabbed, knots };
}
