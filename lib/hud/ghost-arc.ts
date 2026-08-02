import { wrapPhase, type MotionDoc } from "../motion/doc";
import { poseToPosition, type StudioPose } from "../studio-camera";
import { pathFromDoc, type MotionPath } from "./motion-path";
import type { PointerIntent } from "./pointer-intent";

/**
 * THE GHOST ARC — the authored move, drawn as the route it is.
 *
 * The curve pad drew a graph of phase against value beside the object. This draws the
 * object's own trajectory at 1:1 with the thing it moves, in the scene, at the moment the
 * hand let go. Same information, one coordinate system instead of two.
 *
 * THE ARC IS THE MOVE, NOT A PICTURE OF IT. Every point comes from the SAME pose sampler the
 * rig flies and the export encodes — `createClipPoseSampler` — so a line that disagreed with
 * the motion would be a sampler defect rather than a drawing defect. The test pins that by
 * asserting the points against `poseAtProgress`, which is the call the preview loop makes.
 *
 * THE SEAM IS CLOSED BY REUSE, NOT BY SAMPLING. Phase 1 wraps to phase 0 in every sampler
 * here, so the closing vertex is the opening vertex copied rather than a read at 1 — the same
 * trap `trace.ts` and `motion-path.ts` both document, arriving here as a closed polyline with
 * no seam vertex of its own.
 *
 * BEADS ARE THE PATH'S KNOTS, DEDUPLICATED ACROSS THE SEAM. A document that authors both
 * phase 0 and phase 1 has one point read twice (`design.md` D6); drawing two beads there
 * would offer the hand a grab that pulls the same knot pair from either side.
 *
 * HIT-TESTING IS BY PROJECTED VERTEX, and that is a resolution decision rather than an
 * approximation: at `ARC_SAMPLES` the gap between neighbouring vertices is under a pixel at
 * any framing the stage permits, so a nearest-vertex test and a nearest-segment test select
 * the same knot while the first costs no per-segment projection.
 *
 * NO FOURTH POINTER PHASE. A bead grab is an orbit that started on a bead, so
 * `pointer-intent.ts` decides it unchanged — this module only reads what the reducer already
 * says and names what the arc does about it.
 */

/** World-space point, in the same units `poseToPosition` returns. */
export type ArcPosition = readonly [number, number, number];

export interface ArcPoint {
	/** Cycle position this vertex was sampled at, `[0,1]`. */
	at: number;
	position: ArcPosition;
}

/** A grabbable point on the line, carrying the index of the path knot it draws. */
export interface ArcBead extends ArcPoint {
	/** Index into `MotionPath.knots` — what `deformPath` is handed when this bead is pulled. */
	knot: number;
}

export interface GhostArc {
	/** Closed polyline, `samples + 1` vertices; the last is the first, copied. */
	points: readonly ArcPoint[];
	/** Empty when the document has no single arc to draw (`pathFromDoc` returned `null`). */
	beads: readonly ArcBead[];
	/** The cycle mark: where the loop opens and closes. */
	seam: ArcPosition;
	/** The path the beads edit, or `null` when the tracks read the cycle from different places. */
	path: MotionPath | null;
}

/**
 * Vertices per cycle. Enough that the polyline reads as a curve rather than a fan at the
 * closest framing `REACH_RANGE` allows, and cheap enough to rebuild on every deform frame —
 * one `Float32Array` write per vertex, no geometry reallocation.
 */
export const ARC_SAMPLES = 96;

/** How long the arc lingers after a throw before it is gone. `design.md` D3. */
export const GHOST_ARC_FADE_MS = 600;

/** Grab radius for a bead, in CSS pixels. A 24px control at arm's length from the cursor. */
export const BEAD_HIT_RADIUS_PX = 12;

/** Tap radius for the line between beads. Tighter than a bead, so a near-miss places nothing. */
export const LINE_HIT_RADIUS_PX = 8;

/** A read at exactly 1 returns phase 0's value; a read just shy returns the closing one. */
const LAST_PHASE = 1 - 1e-9;

function positionAt(sample: (phase: number) => StudioPose, phase: number): ArcPosition {
	const v = poseToPosition(sample(phase));
	return [v.x, v.y, v.z];
}

/**
 * Sample a pose sampler into a closed world-space polyline.
 *
 * `samples` is the number of DISTINCT cycle positions; the returned array carries one more,
 * because the loop has to arrive back where it started for the line to close.
 */
export function arcPolyline(
	sample: (phase: number) => StudioPose,
	samples: number = ARC_SAMPLES,
): ArcPoint[] {
	const count = Math.max(2, Math.floor(samples));
	const points: ArcPoint[] = [];
	for (let i = 0; i < count; i += 1) points.push({ at: i / count, position: positionAt(sample, i / count) });
	points.push({ at: 1, position: points[0].position });
	return points;
}

/**
 * The knots of a path, as points on the line.
 *
 * A closing knot at phase 1 is dropped when the opening knot exists, because they are one
 * point read twice. Its INDEX survives on the opening bead only in the sense that pulling
 * either moves both — `deformPath` measures falloff with `cycleDistance`, so the seam needs
 * no special case here either.
 */
export function arcBeads(path: MotionPath, sample: (phase: number) => StudioPose): ArcBead[] {
	const hasOpening = path.knots.some((knot) => knot.at <= 0);
	const beads: ArcBead[] = [];
	path.knots.forEach((knot, index) => {
		if (hasOpening && knot.at >= 1) return;
		beads.push({ at: knot.at, knot: index, position: positionAt(sample, wrapPhase(Math.min(knot.at, LAST_PHASE))) });
	});
	return beads;
}

/** The whole drawing, from the document the rig is flying and the sampler it is flying it with. */
export function ghostArc(
	doc: MotionDoc,
	sample: (phase: number) => StudioPose,
	samples: number = ARC_SAMPLES,
): GhostArc {
	const points = arcPolyline(sample, samples);
	const path = pathFromDoc(doc);
	return {
		points,
		beads: path ? arcBeads(path, sample) : [],
		seam: points[0].position,
		path,
	};
}

/** A projected point in viewport CSS pixels — what a hit test compares against. */
export interface ScreenPoint {
	x: number;
	y: number;
}

/**
 * Index of the projected point nearest `p` within `radiusPx`, or `-1`.
 *
 * One function for beads and for the line: the caller decides which array it passes and what
 * an index means, so there is one distance loop rather than two that must agree.
 */
export function nearestScreenPoint(
	screen: readonly ScreenPoint[],
	p: ScreenPoint,
	radiusPx: number,
): number {
	let best = -1;
	let bestDistance = radiusPx;
	for (let i = 0; i < screen.length; i += 1) {
		const d = Math.hypot(screen[i].x - p.x, screen[i].y - p.y);
		if (d <= bestDistance) {
			bestDistance = d;
			best = i;
		}
	}
	return best;
}

/** What the arc had under the pointer when the press began. */
export interface ArcTouch {
	/** Index into `GhostArc.beads`, or `-1` when the press landed on bare line. */
	bead: number;
	/** Cycle position under the pointer, or `null` when the press missed the arc entirely. */
	at: number | null;
}

/**
 * Resolve what the press landed on.
 *
 * A bead wins over the line it sits on, because the two gestures are not symmetric: grabbing
 * a knot that is there is recoverable by dragging back, and placing a knot on top of one is
 * a no-op the author cannot see.
 */
export function arcTouchAt(
	beadScreen: readonly ScreenPoint[],
	lineScreen: readonly ScreenPoint[],
	points: readonly ArcPoint[],
	p: ScreenPoint,
): ArcTouch | null {
	const bead = nearestScreenPoint(beadScreen, p, BEAD_HIT_RADIUS_PX);
	if (bead >= 0) return { bead, at: null };
	const vertex = nearestScreenPoint(lineScreen, p, LINE_HIT_RADIUS_PX);
	if (vertex < 0) return null;
	return { bead: -1, at: points[vertex]?.at ?? null };
}

/**
 * The bead a live drag is pulling, or `-1`.
 *
 * `locked` is the whole condition: the reducer sets it once the press travelled past
 * `ORBIT_THRESHOLD_PX`, which is the same signal that rules the press out of ever becoming a
 * wheel. A press still inside the threshold is not yet a pull, and a press that became a
 * wheel never is.
 */
export function draggingBead(touch: ArcTouch | null, intent: PointerIntent): number {
	if (touch === null || touch.bead < 0) return -1;
	if (intent.phase !== "orbiting" || !intent.locked) return -1;
	return touch.bead;
}

export type ArcGesture =
	| { kind: "none" }
	/** Remove the knot under the finger. The one gesture here meant to change the move. */
	| { kind: "remove"; bead: number }
	/** Place a knot at a cycle position. Exact by construction — `insertKnot` splits the ease. */
	| { kind: "place"; at: number };

const NO_GESTURE: ArcGesture = { kind: "none" };

/**
 * What a release does to the arc, read from the intent as it stood AT the release.
 *
 * A press that travelled was a pull and already spent itself on `deformPath`; a press that
 * became a wheel belongs to the wheel. What is left is the tap, and a tap means remove on a
 * bead and place on the line — the two halves of one gesture, told apart by what was under
 * it rather than by a modifier.
 */
export function releaseGesture(touch: ArcTouch | null, intent: PointerIntent): ArcGesture {
	if (touch === null) return NO_GESTURE;
	if (intent.phase !== "orbiting" || intent.locked) return NO_GESTURE;
	if (touch.bead >= 0) return { kind: "remove", bead: touch.bead };
	return touch.at === null ? NO_GESTURE : { kind: "place", at: touch.at };
}

/** Drop a knot from a path. Removal widens the segment it opened; `applyPath` drops its curve. */
export function removeKnot(path: MotionPath, index: number): MotionPath {
	if (index < 0 || index >= path.knots.length) return path;
	return { ...path, knots: path.knots.filter((_, i) => i !== index) };
}
