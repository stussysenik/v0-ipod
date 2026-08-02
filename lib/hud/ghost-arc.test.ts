import { describe, expect, it } from "vitest";

import { CATALOGUE_DOCS } from "../motion/catalogue";
import type { MotionDoc } from "../motion/doc";
import { DEFAULT_TIME_MAP, poseAtProgress } from "../motion/transport";
import { stableStringify } from "../export/export-fingerprint";
import { createClipPoseSampler, documentClip } from "../studio-clip";
import { poseToPosition, type StudioPose } from "../studio-camera";
import { applyPath, insertKnot, pathFromDoc } from "./motion-path";
import { IDLE_POINTER_INTENT, type PointerIntent } from "./pointer-intent";
import {
	arcBeads,
	arcPolyline,
	arcTouchAt,
	draggingBead,
	ghostArc,
	nearestScreenPoint,
	releaseGesture,
	removeKnot,
	type ScreenPoint,
} from "./ghost-arc";

/** A framing that is not the origin on any axis, so a bug that drops one is visible. */
const HERO: StudioPose = { azimuth: 24, elevation: 12, reach: 11, target: [0.4, -0.2, 0.1] };

const ORBIT = CATALOGUE_DOCS.orbit;

function samplerFor(doc: MotionDoc, hero: StudioPose = HERO) {
	return createClipPoseSampler(documentClip(doc), hero);
}

const pressed = (locked: boolean): PointerIntent => ({
	phase: "orbiting",
	origin: { x: 0, y: 0, t: 0 },
	locked,
	trail: [],
});

describe("arcPolyline", () => {
	/**
	 * §4.2 — the arc IS the move.
	 *
	 * The drawing has no sampler of its own: every vertex is the pose the preview loop would
	 * fly at that progress, converted by the same `poseToPosition` the rig uses. Equality is
	 * asserted by value rather than by tolerance, because a tolerance here would permit a
	 * second interpolation to creep in and pass.
	 */
	it("equals poseAtProgress at 32 phases", () => {
		const sample = samplerFor(ORBIT);
		const arc = arcPolyline(sample, 32);
		expect(arc).toHaveLength(33);
		for (let i = 0; i < 32; i += 1) {
			const pose = poseAtProgress(sample, HERO, i / 32, 1, DEFAULT_TIME_MAP);
			const p = poseToPosition(pose);
			expect(arc[i].at).toBe(i / 32);
			expect(arc[i].position).toEqual([p.x, p.y, p.z]);
		}
	});

	/** The loop closes by copying the opening vertex — never by reading phase 1, which wraps. */
	it("closes on its opening vertex", () => {
		const arc = arcPolyline(samplerFor(CATALOGUE_DOCS.turntable), 24);
		expect(arc[arc.length - 1].at).toBe(1);
		expect(arc[arc.length - 1].position).toBe(arc[0].position);
	});

	/** Every catalogue move draws a finite line at every vertex. */
	it("is finite for every shipped move", () => {
		for (const doc of Object.values(CATALOGUE_DOCS)) {
			for (const point of arcPolyline(samplerFor(doc), 16)) {
				expect(point.position.every(Number.isFinite)).toBe(true);
			}
		}
	});
});

describe("arcBeads", () => {
	it("draws one bead per authored knot position", () => {
		const path = pathFromDoc(ORBIT);
		expect(path).not.toBeNull();
		const beads = arcBeads(path!, samplerFor(ORBIT));
		// The orbit authors quarters plus both ends; the closing knot is the opening one.
		expect(beads.map((b) => b.at)).toEqual([0, 0.25, 0.5, 0.75]);
		expect(beads.map((b) => b.knot)).toEqual([0, 1, 2, 3]);
	});

	/** The seam is one point read twice, so it offers one grab. */
	it("drops the closing knot when the opening knot exists", () => {
		const path = pathFromDoc(ORBIT)!;
		expect(path.knots.some((knot) => knot.at === 1)).toBe(true);
		expect(arcBeads(path, samplerFor(ORBIT)).some((bead) => bead.at >= 1)).toBe(false);
	});

	/** A bead sits ON the line it is grabbable from, at the vertex sharing its cycle position. */
	it("places beads on the polyline", () => {
		const sample = samplerFor(ORBIT);
		const arc = ghostArc(ORBIT, sample, 96);
		for (const bead of arc.beads) {
			const vertex = arc.points.find((point) => Math.abs(point.at - bead.at) < 1e-12);
			expect(vertex).toBeDefined();
			expect(bead.position).toEqual(vertex!.position);
		}
		expect(arc.seam).toEqual(arc.points[0].position);
	});
});

describe("hit-testing", () => {
	const screen: ScreenPoint[] = [
		{ x: 0, y: 0 },
		{ x: 40, y: 0 },
		{ x: 80, y: 0 },
	];

	it("returns the nearest point inside the radius", () => {
		expect(nearestScreenPoint(screen, { x: 44, y: 3 }, 12)).toBe(1);
	});

	it("returns -1 when nothing is inside the radius", () => {
		expect(nearestScreenPoint(screen, { x: 20, y: 0 }, 12)).toBe(-1);
	});

	/** A bead wins over the line under it: a grab is recoverable, a knot placed on one is not. */
	it("prefers a bead to the line beneath it", () => {
		const points = [
			{ at: 0, position: [0, 0, 0] as const },
			{ at: 0.5, position: [1, 0, 0] as const },
		];
		const line: ScreenPoint[] = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
		];
		const touch = arcTouchAt([{ x: 2, y: 2 }], line, points, { x: 1, y: 1 });
		expect(touch).toEqual({ bead: 0, at: null });
	});

	it("reads a bare-line press as a cycle position", () => {
		const points = [
			{ at: 0, position: [0, 0, 0] as const },
			{ at: 0.5, position: [1, 0, 0] as const },
		];
		const line: ScreenPoint[] = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
		];
		expect(arcTouchAt([], line, points, { x: 101, y: 2 })).toEqual({ bead: -1, at: 0.5 });
		expect(arcTouchAt([], line, points, { x: 50, y: 50 })).toBeNull();
	});
});

describe("gestures", () => {
	/**
	 * §4b.10 — no fourth pointer phase. A pull is `orbiting` + `locked`, which is exactly what
	 * the shipped reducer already reports for a drag; this module adds no state of its own.
	 */
	it("reads a travelled press on a bead as a pull", () => {
		expect(draggingBead({ bead: 2, at: null }, pressed(true))).toBe(2);
		expect(draggingBead({ bead: 2, at: null }, pressed(false))).toBe(-1);
		expect(draggingBead({ bead: -1, at: 0.5 }, pressed(true))).toBe(-1);
		expect(draggingBead(null, pressed(true))).toBe(-1);
	});

	it("reads a still release as remove on a bead and place on the line", () => {
		expect(releaseGesture({ bead: 1, at: null }, pressed(false))).toEqual({ kind: "remove", bead: 1 });
		expect(releaseGesture({ bead: -1, at: 0.4 }, pressed(false))).toEqual({ kind: "place", at: 0.4 });
	});

	/** A press that travelled spent itself on the pull; a wheel press belongs to the wheel. */
	it("takes nothing from a travelled press or a summon", () => {
		expect(releaseGesture({ bead: 1, at: null }, pressed(true))).toEqual({ kind: "none" });
		expect(releaseGesture({ bead: -1, at: 0.4 }, { ...pressed(false), phase: "summoning" })).toEqual({
			kind: "none",
		});
		expect(releaseGesture({ bead: 0, at: null }, IDLE_POINTER_INTENT)).toEqual({ kind: "none" });
	});
});

describe("a segment the format cannot cut", () => {
	/**
	 * §4b.11 — the dead spot is honest.
	 *
	 * `easeInOutExpo` is the one curve of the 23 whose halves need an x handle outside the
	 * domain `resolveEase` clamps to, so a knot placed inside it would silently reshape the
	 * segment by up to 3.5e-2 (measured in `motion-path.test.ts`). The ruling is to refuse the
	 * knot. This asserts the refusal at the GESTURE level: the tap resolves to a `place`, the
	 * place is attempted, and the document that comes back is byte-identical to the one that
	 * went in — not merely close, and not a bead sitting on an unchanged move.
	 */
	const UNCUTTABLE: MotionDoc = {
		id: "uncuttable",
		label: "Uncuttable",
		naturalCycleSeconds: 4,
		loopable: true,
		tracks: {
			azimuth: {
				keyframes: [
					{ at: 0, value: 0, easing: "easeInOutExpo" },
					{ at: 1, value: 30 },
				],
			},
		},
	};

	it("places no bead and leaves the move byte-identical", () => {
		const path = pathFromDoc(UNCUTTABLE)!;
		const before = stableStringify(applyPath(UNCUTTABLE, path));

		const gesture = releaseGesture({ bead: -1, at: 0.25 }, pressed(false));
		expect(gesture).toEqual({ kind: "place", at: 0.25 });

		const next = insertKnot(UNCUTTABLE, path, gesture.kind === "place" ? gesture.at : 0);
		expect(next.knots).toHaveLength(path.knots.length);
		expect(stableStringify(applyPath(UNCUTTABLE, next))).toBe(before);
	});

	/**
	 * The dead spot is an interval, not the whole segment, and it does NOT contain the middle.
	 * `easeInOutExpo` is symmetric, so it cuts exactly at 0.5 and refuses from 0.25 to 0.45 and
	 * from 0.55 to 0.75 — which is why a tap at the midpoint is the one tap that would have
	 * reported this curve placeable. Pinned here so the refusal is read as measured rather than
	 * as a property of the whole curve.
	 */
	it("refuses the quarter and takes the midpoint of the same segment", () => {
		const path = pathFromDoc(UNCUTTABLE)!;
		expect(insertKnot(UNCUTTABLE, path, 0.25).knots).toHaveLength(path.knots.length);
		expect(insertKnot(UNCUTTABLE, path, 0.5).knots).toHaveLength(path.knots.length + 1);
	});

	/** The refusal is the curve's, not the position's — a splittable segment takes the knot. */
	it("takes the knot on a segment that cuts", () => {
		const path = pathFromDoc(ORBIT)!;
		const next = insertKnot(ORBIT, path, 0.375);
		expect(next.knots).toHaveLength(path.knots.length + 1);
		expect(next.knots.map((knot) => knot.at)).toContain(0.375);
	});
});

describe("removeKnot", () => {
	it("drops one knot and leaves the rest addressable", () => {
		const path = pathFromDoc(ORBIT)!;
		const next = removeKnot(path, 1);
		expect(next.knots).toHaveLength(path.knots.length - 1);
		expect(next.knots.map((knot) => knot.at)).not.toContain(0.25);
	});

	it("is a no-op outside the range", () => {
		const path = pathFromDoc(ORBIT)!;
		expect(removeKnot(path, -1)).toBe(path);
		expect(removeKnot(path, path.knots.length)).toBe(path);
	});
});
