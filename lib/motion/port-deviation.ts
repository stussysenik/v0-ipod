import { poseForMove, type CameraMove, type StudioPose } from "../studio-camera";
import { CATALOGUE_DOCS } from "./catalogue";
import { createMotionSampler } from "./doc";

/**
 * THE PARITY HARNESS for the procedural → document port.
 *
 * A cubic bezier segment is not a sine, so porting a generator to keyframes is an
 * APPROXIMATION, and how good it is is a fact to be measured rather than an
 * intention to be stated. This module measures it; `catalogue.test.ts` rules on it.
 *
 * The measurement is hero-independent by construction: every generator in
 * `studio-camera.ts` has the form `hero + f(t)`, so subtracting the hero leaves the
 * pure offset the document also stores. That is why one arbitrary hero suffices and
 * why the reading is a property of the port rather than of a framing.
 *
 * Units are native and never normalised — degrees for angles, world units for
 * reach — because the floor they are ruled against is stated in those units and a
 * normalised reading would silently rescale it.
 */

/** Any pose works; the generators are additive, so this choice cannot affect a reading. */
const PROBE_HERO: StudioPose = {
	azimuth: 21,
	elevation: 9,
	reach: 13,
	target: [0, 0, 0],
};

/** Tracks the port is measured on. Target is untouched by every procedural move. */
export const MEASURED_AXES = ["azimuth", "elevation", "reach"] as const;
export type MeasuredAxis = (typeof MEASURED_AXES)[number];

export type AxisDeviation = Record<MeasuredAxis, number>;

/** The generator's offset from the hero at `t`, per measured axis. */
function generatorOffset(move: CameraMove, t: number): AxisDeviation {
	const pose = poseForMove(move, t, PROBE_HERO);
	return {
		azimuth: pose.azimuth - PROBE_HERO.azimuth,
		elevation: pose.elevation - PROBE_HERO.elevation,
		reach: pose.reach - PROBE_HERO.reach,
	};
}

/**
 * Maximum absolute per-axis deviation between a ported document and its generator,
 * across `samples` uniformly spaced phases in `[0,1)`.
 *
 * The interval is half-open on purpose: phase 1 is the next cycle's phase 0, so
 * including it would measure the seam twice and measure nothing new.
 */
export function measureMoveDeviation(move: CameraMove, samples = 2000): AxisDeviation {
	const sampler = createMotionSampler(CATALOGUE_DOCS[move]);
	const worst: AxisDeviation = { azimuth: 0, elevation: 0, reach: 0 };

	for (let i = 0; i < samples; i++) {
		const t = i / samples;
		const truth = generatorOffset(move, t);
		for (const axis of MEASURED_AXES) {
			const delta = Math.abs(sampler.sample(axis, t) - truth[axis]);
			if (delta > worst[axis]) {
				worst[axis] = delta;
			}
		}
	}

	return worst;
}

/**
 * The perceptual floors this port is ruled against.
 *
 * Both sit an order of magnitude below the export fingerprint's own pose
 * quantisation (`ANGLE_PRECISION` 0.1°, `DISTANCE_PRECISION` 1e-3), so a conforming
 * port cannot even change a cache key — the ported and generated motion are the
 * same frame as far as every downstream system can tell.
 */
export const ANGLE_FLOOR_DEG = 0.25;
export const DISTANCE_FLOOR_UNITS = 0.01;

export function floorForAxis(axis: MeasuredAxis): number {
	return axis === "reach" ? DISTANCE_FLOOR_UNITS : ANGLE_FLOOR_DEG;
}
