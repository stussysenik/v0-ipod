import { describe, expect, it } from "vitest";

import { ELEVATION_RANGE, REACH_RANGE, type StudioPose } from "../studio-camera";
import { createStateSampler } from "./keyframe-sampler";
import { buildPresetState, MOTION_PRESETS, type MotionPreset } from "./motion-presets";
import { CAMERA_OBJECT_KEY, CAMERA_SHEET_ID, studioValuesToPose } from "./studio-project";

const HERO: StudioPose = { azimuth: 18, elevation: 14, reach: 13, target: [0, 0, 0] };
const CYCLE = 6;

/** Smallest absolute angular gap between two azimuths, in [0,180]. */
function azGap(a: number, b: number): number {
	const d = (((a - b) % 360) + 360) % 360;
	return Math.min(d, 360 - d);
}

function poseAt(preset: MotionPreset, position: number): StudioPose {
	const state = buildPresetState(preset, HERO, CYCLE);
	const sampler = createStateSampler(state, CAMERA_SHEET_ID);
	return studioValuesToPose(sampler.sampleObject(CAMERA_OBJECT_KEY, position));
}

describe("motion presets (moment cards)", () => {
	it("offers a rich catalogue with unique ids", () => {
		expect(MOTION_PRESETS.length).toBeGreaterThanOrEqual(6);
		const ids = MOTION_PRESETS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	for (const preset of MOTION_PRESETS) {
		it(`${preset.id}: builds a valid camera sequence of the requested length`, () => {
			const state = buildPresetState(preset, HERO, CYCLE);
			const sampler = createStateSampler(state, CAMERA_SHEET_ID);
			expect(sampler.objectKeys).toContain(CAMERA_OBJECT_KEY);
			expect(sampler.sequenceLength).toBeCloseTo(CYCLE, 6);
		});

		it(`${preset.id}: starts anchored on the hero framing`, () => {
			const start = poseAt(preset, 0);
			// Every preset begins at the composed hero (offsets are zero at t=0),
			// so a clip never pops away from the user's framing on the first frame.
			expect(azGap(start.azimuth, HERO.azimuth)).toBeCloseTo(0, 4);
			expect(start.elevation).toBeCloseTo(HERO.elevation, 4);
			expect(start.reach).toBeCloseTo(HERO.reach, 4);
		});

		it(`${preset.id}: keeps reach and elevation within the authoring envelope`, () => {
			for (let i = 0; i <= 12; i++) {
				const pose = poseAt(preset, (i / 12) * CYCLE);
				expect(pose.reach).toBeGreaterThanOrEqual(REACH_RANGE[0] - 1e-6);
				expect(pose.reach).toBeLessThanOrEqual(REACH_RANGE[1] + 1e-6);
				expect(pose.elevation).toBeGreaterThanOrEqual(ELEVATION_RANGE[0] - 1e-6);
				expect(pose.elevation).toBeLessThanOrEqual(ELEVATION_RANGE[1] + 1e-6);
			}
		});

		if (preset.loopable) {
			it(`${preset.id}: closes on its loop seam (pose(0) ≈ pose(cycle))`, () => {
				const start = poseAt(preset, 0);
				const end = poseAt(preset, CYCLE);
				expect(azGap(end.azimuth, start.azimuth)).toBeCloseTo(0, 4);
				expect(end.elevation).toBeCloseTo(start.elevation, 4);
				expect(end.reach).toBeCloseTo(start.reach, 4);
			});
		}
	}

	it("at least one preset actually moves the camera mid-cycle", () => {
		const movers = MOTION_PRESETS.filter((p) => {
			const mid = poseAt(p, CYCLE / 2);
			return (
				azGap(mid.azimuth, HERO.azimuth) > 1 ||
				Math.abs(mid.elevation - HERO.elevation) > 1 ||
				Math.abs(mid.reach - HERO.reach) > 0.1
			);
		});
		expect(movers.length).toBeGreaterThanOrEqual(5);
	});
});
