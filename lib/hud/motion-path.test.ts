import { describe, expect, it } from "vitest";

import { CATALOGUE_DOCS } from "../motion/catalogue";
import { createMotionSampler, type MotionDoc } from "../motion/doc";
import { stableStringify } from "../export/export-fingerprint";
import { isSplittable, splitEase } from "../theatre/bezier-split";
import { UnitBezier } from "../theatre/unit-bezier";
import { EASINGS, easingHandles, type EasingName } from "../theatre/easings";
import {
	applyPath,
	cycleDistance,
	deformPath,
	insertKnot,
	knotWeight,
	pathFromDoc,
	sharedPhase,
	type MotionPath,
} from "./motion-path";

const ORBIT = CATALOGUE_DOCS.orbit;

/** Sample every track of a document across one cycle. The move, as numbers. */
function sweep(doc: MotionDoc, count = 128): number[] {
	const sampler = createMotionSampler(doc);
	const out: number[] = [];
	for (let i = 0; i < count; i += 1) {
		const all = sampler.sampleAll(i / count);
		for (const key of sampler.trackKeys) out.push(all[key] ?? 0);
	}
	return out;
}

/** Largest absolute difference between two sweeps of equal length. */
function maxDeviation(a: readonly number[], b: readonly number[]): number {
	expect(a.length).toBe(b.length);
	let worst = 0;
	for (let i = 0; i < a.length; i += 1) worst = Math.max(worst, Math.abs(a[i] - b[i]));
	return worst;
}

function path(doc: MotionDoc): MotionPath {
	const read = pathFromDoc(doc);
	if (!read) throw new Error("document has no single arc");
	return read;
}

describe("splitEase", () => {
	/**
	 * The claim the whole in-scene editor rests on: concatenating the two halves reproduces the
	 * original curve. Measured against `UnitBezier`, which is the solver the sampler itself uses,
	 * so this pins the split to the shipped interpolation rather than to a second opinion.
	 *
	 * `easeInOutExpo` is excluded and covered by its own case below — it is the one curve in the
	 * vocabulary that is not splittable at all, which is a fact about the format's x domain
	 * rather than about this solver.
	 */
	it.each((Object.keys(EASINGS) as EasingName[]).filter((n) => n !== "easeInOutExpo"))(
		"reproduces %s from its two halves",
		(name) => {
			const whole = new UnitBezier(...easingHandles(name));
			for (const cut of [0.1, 0.25, 0.5, 0.75, 0.9]) {
				const split = splitEase(name, cut);
				if (!split) throw new Error(`${name} refused an interior cut at ${cut}`);
				const left = new UnitBezier(...split.left);
				const right = new UnitBezier(...split.right);
				for (let i = 0; i <= 64; i += 1) {
					const x = i / 64;
					const expected = whole.solve(x);
					const actual =
						x <= cut
							? left.solve(x / cut) * split.splitY
							: split.splitY + right.solve((x - cut) / (1 - cut)) * (1 - split.splitY);
					expect(Math.abs(actual - expected)).toBeLessThan(1e-5);
				}
			}
		},
	);

	/**
	 * THE ONE CURVE THAT CANNOT BE CUT, measured rather than assumed: 52 of 99 interior positions
	 * on `easeInOutExpo` produce a half whose control polygon carries an x up to 0.089 outside
	 * [0,1], and `resolveEase` clamps x on every read. Clamping would have shipped a silent
	 * 3.5e-2 reshape of the segment — a third of the vocabulary's other curves have crossed
	 * handles too and split fine, so the failure is not visible by inspection.
	 */
	it("refuses the one vocabulary curve whose halves leave the storable x domain", () => {
		let refused = 0;
		for (let i = 1; i < 100; i += 1) {
			if (splitEase("easeInOutExpo", i / 100) === null) refused += 1;
		}
		expect(refused).toBe(52);
		// The midpoint of a symmetric curve cuts fine; the quarter does not. A gate that only
		// asked at 0.5 would have reported this curve as splittable.
		expect(isSplittable("easeInOutExpo", 0.5)).toBe(true);
		expect(isSplittable("easeInOutExpo", 0.25)).toBe(false);
		expect(isSplittable("easeInOutQuart", 0.25)).toBe(true);
	});

	it("is not authored by any shipped document, which is why the refusal costs nothing", () => {
		for (const doc of Object.values(CATALOGUE_DOCS)) {
			for (const track of Object.values(doc.tracks)) {
				for (const kf of track.keyframes) expect(kf.easing).not.toBe("easeInOutExpo");
			}
		}
	});

	it("refuses a cut at either end, because that is not a cut", () => {
		expect(splitEase("easeInOutSine", 0)).toBeNull();
		expect(splitEase("easeInOutSine", 1)).toBeNull();
	});

	it("splits a linear ease into two linear eases", () => {
		const split = splitEase([0, 0, 1, 1], 0.37);
		expect(split?.splitY).toBeCloseTo(0.37, 6);
		for (const h of [...(split?.left ?? []), ...(split?.right ?? [])].slice(0, 4)) {
			expect(Number.isFinite(h)).toBe(true);
		}
	});
});

describe("cycleDistance and knotWeight", () => {
	it("measures around the seam, so phase 0.98 and 0.02 are 0.04 apart", () => {
		expect(cycleDistance(0.98, 0.02)).toBeCloseTo(0.04, 12);
		expect(cycleDistance(0, 1)).toBeCloseTo(0, 12);
		expect(cycleDistance(0.25, 0.75)).toBeCloseTo(0.5, 12);
	});

	it("weighs the closing knot exactly as the opening one — the seam has no special case", () => {
		expect(knotWeight(1, 0, 0.2)).toBe(knotWeight(0, 0, 0.2));
		expect(knotWeight(0.95, 0.02, 0.2)).toBeCloseTo(knotWeight(0.95, 1.02, 0.2), 12);
	});

	it("lands on zero at the radius with zero slope, so a pull leaves no crease", () => {
		expect(knotWeight(0.2, 0, 0.2)).toBe(0);
		expect(knotWeight(0.199, 0, 0.2)).toBeLessThan(1e-4);
		expect(knotWeight(0, 0, 0.2)).toBeCloseTo(1, 12);
	});
});

describe("pathFromDoc", () => {
	it("reads a catalogue move as one route with a knot at every authored position", () => {
		const read = path(ORBIT);
		const positions = new Set<number>();
		for (const track of Object.values(ORBIT.tracks)) {
			for (const kf of track.keyframes) positions.add(kf.at);
		}
		expect(read.knots.map((k) => k.at)).toEqual([...positions].sort((a, b) => a - b));
		expect(read.keys).toEqual(Object.keys(ORBIT.tracks));
	});

	it("gives every knot a value for every track, including axes with no keyframe there", () => {
		const read = path(ORBIT);
		for (const knot of read.knots) {
			for (const key of read.keys) expect(typeof knot.value[key]).toBe("number");
		}
	});

	it("has no arc when the tracks read the cycle from different places", () => {
		const split: MotionDoc = {
			...ORBIT,
			tracks: {
				azimuth: ORBIT.tracks.azimuth,
				reach: { ...ORBIT.tracks.reach, phase: 0.25 },
			},
		};
		expect(sharedPhase(split)).toBeNull();
		expect(pathFromDoc(split)).toBeNull();
	});
});

describe("applyPath", () => {
	it("round-trips a catalogue move byte-identically through the arc", () => {
		const rebuilt = applyPath(ORBIT, path(ORBIT));
		expect(maxDeviation(sweep(rebuilt), sweep(ORBIT))).toBeLessThan(1e-12);
	});

	/**
	 * EXACT WHEN THE AXES AGREE, MEASURED WHEN THEY DO NOT. Four of the five catalogue moves
	 * keyframe every axis at the same quarters, so reading them as one arc adds no knot and the
	 * round trip is bit-identical. `crane` is the exception — its elevation is authored at
	 * eighths while azimuth and reach are at quarters — so the arc must place knots on the two
	 * coarser axes, and each placement carries the shipped sampler's own 1e-6 x-inversion error.
	 * The reading is 3.60e-5 degrees of azimuth, which is 1.5e-6 of that track's amplitude.
	 */
	it("round-trips a move whose axes share positions bit-identically", () => {
		for (const id of ["orbit", "turntable", "sweep", "robo"] as const) {
			const doc = CATALOGUE_DOCS[id];
			expect(maxDeviation(sweep(applyPath(doc, path(doc))), sweep(doc))).toBe(0);
		}
	});

	it("costs 3.6e-5 degrees on the one move whose axes are keyframed apart", () => {
		const doc = CATALOGUE_DOCS.crane;
		const deviation = maxDeviation(sweep(applyPath(doc, path(doc))), sweep(doc));
		expect(deviation).toBeGreaterThan(0);
		expect(deviation).toBeLessThan(1e-4);
	});

	it("is deterministic — the same path twice produces the same bytes", () => {
		const read = path(ORBIT);
		expect(stableStringify(applyPath(ORBIT, read))).toBe(stableStringify(applyPath(ORBIT, read)));
	});
});

describe("insertKnot", () => {
	/**
	 * THE MEASUREMENT THIS MODULE EXISTS FOR. Placing a control point must not reshape the move,
	 * or the author spends the next gesture correcting the tool. Asserted over 128 phases at 15
	 * insertion positions, on the shipped orbit rather than a fixture.
	 *
	 * The reading is 2.60e-5 degrees of azimuth against a 17° amplitude — 1.5e-6 relative, and
	 * the same order as the crane round trip above, because it has the same cause: the shipped
	 * sampler inverts x→t to 1e-6 while the split inverts to 2^-40. Tightening the split does
	 * not move this number; only tightening `UnitBezier.solve` would, and that is the curve
	 * every other consumer already flies.
	 */
	it("moves no pixel — a knot placed anywhere leaves the sampled move unchanged", () => {
		const before = sweep(ORBIT);
		let worst = 0;
		for (let i = 1; i < 16; i += 1) {
			const at = i / 16;
			const grown = insertKnot(ORBIT, path(ORBIT), at);
			expect(grown.knots.length).toBeGreaterThanOrEqual(path(ORBIT).knots.length);
			worst = Math.max(worst, maxDeviation(sweep(applyPath(ORBIT, grown)), before));
		}
		expect(worst).toBeLessThan(1e-4);
	});

	it("moves no pixel when two knots land in the same segment", () => {
		const before = sweep(ORBIT);
		let grown = insertKnot(ORBIT, path(ORBIT), 0.06);
		grown = insertKnot(ORBIT, grown, 0.19);
		grown = insertKnot(ORBIT, grown, 0.12);
		expect(grown.knots.filter((k) => k.at > 0 && k.at < 0.25)).toHaveLength(3);
		expect(maxDeviation(sweep(applyPath(ORBIT, grown)), before)).toBeLessThan(1e-3);
	});

	it("declines a knot where one already sits", () => {
		const read = path(ORBIT);
		expect(insertKnot(ORBIT, read, read.knots[1].at)).toBe(read);
	});

	it("lands on the deformed route, not the shipped one", () => {
		const read = path(ORBIT);
		const pulled = deformPath(read, 1, { azimuth: 40 });
		const grown = insertKnot(ORBIT, pulled, read.knots[1].at + 0.01);
		const added = grown.knots.find((k) => Math.abs(k.at - (read.knots[1].at + 0.01)) < 1e-9);
		const shipped = insertKnot(ORBIT, read, read.knots[1].at + 0.01).knots.find(
			(k) => Math.abs(k.at - (read.knots[1].at + 0.01)) < 1e-9,
		);
		expect(added?.value.azimuth).not.toBeCloseTo(shipped?.value.azimuth ?? 0, 3);
	});
});

describe("deformPath", () => {
	it("is local — a pull outside the falloff leaves those knots bit-identical", () => {
		const read = path(ORBIT);
		const pulled = deformPath(read, 0, { azimuth: 25 }, 0.2);
		for (let i = 0; i < read.knots.length; i += 1) {
			if (knotWeight(read.knots[i].at, read.knots[0].at, 0.2) > 0) continue;
			expect(stableStringify(pulled.knots[i])).toBe(stableStringify(read.knots[i]));
		}
	});

	it("carries the closing knot with the opening one, so the loop still closes", () => {
		const read = path(ORBIT);
		const opening = read.knots.findIndex((k) => k.at === 0);
		const closing = read.knots.findIndex((k) => k.at === 1);
		expect(opening).toBeGreaterThanOrEqual(0);
		expect(closing).toBeGreaterThan(opening);
		const pulled = deformPath(read, opening, { azimuth: 12 }, 0.2);
		for (const key of read.keys) {
			expect(pulled.knots[closing].value[key]).toBeCloseTo(pulled.knots[opening].value[key], 12);
		}
	});

	/**
	 * Derived from the grabbed path, never from the previous frame of the drag. Out and back
	 * must return the ORIGINAL bytes, or a move dragged back to where it started stores a copy
	 * of the base instead of clearing its override.
	 */
	it("returns bit-identical values when a drag goes out and comes back", () => {
		const read = path(ORBIT);
		const out = deformPath(read, 2, { azimuth: 31.5, reach: -0.4 });
		const back = deformPath(read, 2, { azimuth: 0, reach: 0 });
		expect(stableStringify(back)).toBe(stableStringify(read));
		expect(stableStringify(out)).not.toBe(stableStringify(read));
	});

	it("does nothing for a knot index that is not on the path", () => {
		const read = path(ORBIT);
		expect(deformPath(read, 99, { azimuth: 10 })).toBe(read);
	});

	it("writes a document a deformed arc actually flies", () => {
		const read = path(ORBIT);
		const pulled = deformPath(read, 1, { azimuth: 40 }, 0.3);
		const moved = applyPath(ORBIT, pulled);
		expect(maxDeviation(sweep(moved), sweep(ORBIT))).toBeGreaterThan(1);
		// No format field is invented: the tracks a deform writes carry keyframes and phase only.
		for (const track of Object.values(moved.tracks)) {
			expect(Object.keys(track).sort()).toEqual(
				track.phase === undefined ? ["keyframes"] : ["keyframes", "phase"],
			);
			for (const kf of track.keyframes) {
				expect(Object.keys(kf).every((k) => ["at", "value", "easing", "hold"].includes(k))).toBe(
					true,
				);
			}
		}
	});
});
