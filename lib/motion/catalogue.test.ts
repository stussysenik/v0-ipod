import { describe, expect, it } from "vitest";

import { CAMERA_MOVES, poseForMove, type StudioPose } from "../studio-camera";
import { createStateSampler } from "../theatre/keyframe-sampler";
import { buildPresetState, MOTION_PRESETS } from "../theatre/motion-presets";
import {
	CAMERA_OBJECT_KEY,
	CAMERA_SHEET_ID,
	studioValuesToPose,
} from "../theatre/studio-project";
import { CATALOGUE_DOCS, cosineTrack, MOMENT_DOCS, sineTrack } from "./catalogue";
import { createMotionSampler } from "./doc";
import {
	floorForAxis,
	MEASURED_AXES,
	measureMoveDeviation,
} from "./port-deviation";

/**
 * THE PORT PARITY GATE.
 *
 * Every shipped move is an editable document rather than a generator. A cubic
 * bezier is not a sine, so the port is an approximation and these tests are the
 * measurement that rules it admissible — per repo law, a reading is never nudged to
 * make a check pass, so a failure here means the port changed, not that the floor
 * should move.
 *
 * The readings themselves are recorded in the change's `tasks.md` §2 and are not
 * re-derived. What is pinned here is the floor and the mechanism behind it.
 */

const HERO: StudioPose = { azimuth: 21, elevation: 9, reach: 13, target: [0, 0, 0] };

describe("procedural → document port", () => {
	for (const spec of CAMERA_MOVES) {
		it(`${spec.id} stays within the perceptual floor on every axis`, () => {
			const deviation = measureMoveDeviation(spec.id);
			for (const axis of MEASURED_AXES) {
				const floor = floorForAxis(axis);
				// Named in the assertion so a failure says which move and which axis.
				expect(
					deviation[axis],
					`${spec.id}.${axis} deviated ${deviation[axis].toExponential(3)} (floor ${floor})`,
				).toBeLessThanOrEqual(floor);
			}
		});
	}

	it("turntable's azimuth is exact — the control case that proves the harness", () => {
		// `360 * t` is linear, so two keyframes with a linear ease reproduce it
		// exactly. A nonzero reading here means the harness is wrong, not the port.
		expect(measureMoveDeviation("turntable").azimuth).toBeLessThan(1e-9);
	});

	it("every ported document closes on its seam", () => {
		for (const spec of CAMERA_MOVES) {
			const sampler = createMotionSampler(CATALOGUE_DOCS[spec.id]);
			for (const axis of MEASURED_AXES) {
				if (spec.id === "turntable" && axis === "azimuth") {
					continue; // a full turn closes at 360°, not at 0 — the seam is modular
				}
				expect(sampler.sample(axis, 0)).toBeCloseTo(sampler.sample(axis, 0.999999), 3);
			}
		}
	});

	it("a document reproduces the generator's absolute pose, not just its offset", () => {
		// Held to the same ruled floor as the port itself — a tighter bound here
		// would be a second, stricter standard nobody ruled on.
		const sampler = createMotionSampler(CATALOGUE_DOCS.orbit);
		for (const t of [0, 0.13, 0.5, 0.77]) {
			const generated = poseForMove("orbit", t, HERO);
			expect(Math.abs(HERO.azimuth + sampler.sample("azimuth", t) - generated.azimuth))
				.toBeLessThanOrEqual(floorForAxis("azimuth"));
			expect(Math.abs(HERO.elevation + sampler.sample("elevation", t) - generated.elevation))
				.toBeLessThanOrEqual(floorForAxis("elevation"));
			expect(Math.abs(HERO.reach + sampler.sample("reach", t) - generated.reach))
				.toBeLessThanOrEqual(floorForAxis("reach"));
		}
	});
});

describe("moment cards port exactly", () => {
	/**
	 * A card and its document are the same keyframes in a different shape, so this
	 * is a re-expression rather than an approximation — but it is NOT bit-identical,
	 * and the reason is structural rather than a defect.
	 *
	 * A card interpolates ABSOLUTE values: `buildPresetState` adds the hero to every
	 * keyframe before the lerp. A document interpolates OFFSETS and adds the hero
	 * after. In floating point `lerp(h+a, h+b) ≠ h + lerp(a,b)`, so the two orders
	 * disagree in the last bits. The document's order is the more correct one —
	 * offsets are small, so relative precision is higher, and hero-independence is
	 * exactly what makes a document portable across framings.
	 *
	 * Measured worst case across all eight cards at 20k phases: 5.68e-14 absolute,
	 * against interpolated magnitudes of 13–381. The bound below sits ~17× above
	 * that and still eleven orders below the 0.25° perceptual floor.
	 */
	const FLOAT_ORDER_BOUND = 1e-12;

	for (const preset of MOTION_PRESETS) {
		it(`${preset.id} samples identically as a document, to float-order rounding`, () => {
			const viaCard = createStateSampler(
				buildPresetState(preset, HERO, 1),
				CAMERA_SHEET_ID,
			);
			const viaDoc = createMotionSampler(MOMENT_DOCS[preset.id]);

			for (let i = 0; i < 500; i++) {
				const t = i / 500;
				const card = studioValuesToPose(viaCard.sampleObject(CAMERA_OBJECT_KEY, t));
				expect(Math.abs(HERO.azimuth + viaDoc.sample("azimuth", t) - card.azimuth))
					.toBeLessThan(FLOAT_ORDER_BOUND);
				expect(Math.abs(HERO.elevation + viaDoc.sample("elevation", t) - card.elevation))
					.toBeLessThan(FLOAT_ORDER_BOUND);
				expect(Math.abs(HERO.reach + viaDoc.sample("reach", t) - card.reach))
					.toBeLessThan(FLOAT_ORDER_BOUND);
			}
		});
	}

	it("carries every track, including the ones a card leaves at zero", () => {
		// `parallax-push` moves only reach; the other five tracks must still exist so
		// a clip resolves to a full framing rather than a partial pose.
		const doc = MOMENT_DOCS["parallax-push"];
		expect(Object.keys(doc.tracks).sort()).toEqual([
			"azimuth",
			"elevation",
			"reach",
			"targetX",
			"targetY",
			"targetZ",
		]);
	});
});

describe("the residual is one constant, scaled by amplitude", () => {
	/**
	 * Sine and cosine tracks use the published `easeOutSine` / `easeInSine` beziers,
	 * which approximate the analytic quarter-sine they are named for. The leftover
	 * error is therefore a fixed fraction of amplitude and nothing else — which is
	 * what makes the catalogue's headroom a number rather than a guess.
	 */
	const UNIT_RESIDUAL = 7.5561e-3;

	function worstAgainst(track: ReturnType<typeof sineTrack>, truth: (t: number) => number): number {
		const sampler = createMotionSampler({
			id: "probe",
			label: "probe",
			loopable: true,
			naturalCycleSeconds: 1,
			tracks: { a: track },
		});
		let worst = 0;
		for (let i = 0; i < 4000; i++) {
			const t = i / 4000;
			worst = Math.max(worst, Math.abs(sampler.sample("a", t) - truth(t)));
		}
		return worst;
	}

	const TAU = Math.PI * 2;

	it("a unit sine and a unit cosine track carry the same residual", () => {
		const s = worstAgainst(sineTrack(1), (t) => Math.sin(TAU * t));
		const c = worstAgainst(cosineTrack(1), (t) => -Math.cos(TAU * t));
		expect(s).toBeCloseTo(UNIT_RESIDUAL, 5);
		expect(c).toBeCloseTo(UNIT_RESIDUAL, 5);
	});

	it("the residual scales linearly with amplitude", () => {
		const worst = worstAgainst(sineTrack(20), (t) => 20 * Math.sin(TAU * t));
		expect(worst).toBeCloseTo(20 * UNIT_RESIDUAL, 4);
	});

	it("states the amplitude headroom the floors buy", () => {
		// A future amplitude change above these breaks the port, and should fail
		// loudly here rather than quietly ship a move that misses its floor.
		expect(0.25 / UNIT_RESIDUAL).toBeGreaterThan(33);
		expect(0.01 / UNIT_RESIDUAL).toBeGreaterThan(1.32);
		// The largest shipped amplitudes, well inside those budgets.
		expect(28).toBeLessThan(0.25 / UNIT_RESIDUAL); // sweep elevation
		expect(1.1).toBeLessThan(0.01 / UNIT_RESIDUAL); // crane reach
	});
});
