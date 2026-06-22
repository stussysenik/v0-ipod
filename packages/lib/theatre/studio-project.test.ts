import { describe, expect, it } from "vitest";

import type { StudioPose } from "../studio-camera";
import {
	CAMERA_OBJECT_KEY,
	CAMERA_PROP_RANGES,
	CAMERA_SHEET_ID,
	poseToStudioValues,
	studioValuesToPose,
	THEATRE_PROJECT_ID,
} from "./studio-project";

/**
 * The studio-project module is the bridge between Theatre's animatable numeric
 * props and the studio's designer-facing `StudioPose` (azimuth / elevation /
 * reach / target). These tests pin the bridge so a Theatre-authored camera track
 * resolves to exactly the pose the rest of the studio already understands.
 */
describe("studio-project camera mapping", () => {
	it("declares stable project / sheet / object identifiers", () => {
		expect(THEATRE_PROJECT_ID).toBeTruthy();
		expect(CAMERA_SHEET_ID).toBeTruthy();
		expect(CAMERA_OBJECT_KEY).toBeTruthy();
	});

	it("round-trips a pose → values → pose without drift", () => {
		const pose: StudioPose = { azimuth: 24, elevation: 12, reach: 14, target: [0.1, -0.2, 0.3] };
		const back = studioValuesToPose(poseToStudioValues(pose));
		expect(back.azimuth).toBeCloseTo(pose.azimuth, 9);
		expect(back.elevation).toBeCloseTo(pose.elevation, 9);
		expect(back.reach).toBeCloseTo(pose.reach, 9);
		expect(back.target[0]).toBeCloseTo(pose.target[0], 9);
		expect(back.target[1]).toBeCloseTo(pose.target[1], 9);
		expect(back.target[2]).toBeCloseTo(pose.target[2], 9);
	});

	it("flattens the target vector into discrete numeric tracks", () => {
		const values = poseToStudioValues({
			azimuth: 0,
			elevation: 0,
			reach: 10,
			target: [1, 2, 3],
		});
		expect(values.targetX).toBe(1);
		expect(values.targetY).toBe(2);
		expect(values.targetZ).toBe(3);
	});

	it("supplies safe defaults when a sampled object is missing props", () => {
		const pose = studioValuesToPose({ azimuth: 30 });
		expect(pose.azimuth).toBe(30);
		expect(pose.reach).toBeGreaterThan(0); // a usable default reach, not 0
		expect(pose.target).toEqual([0, 0, 0]);
	});

	it("publishes slider ranges consistent with the camera authoring envelope", () => {
		expect(CAMERA_PROP_RANGES.reach.min).toBeGreaterThan(0);
		expect(CAMERA_PROP_RANGES.reach.max).toBeGreaterThan(CAMERA_PROP_RANGES.reach.min);
		expect(CAMERA_PROP_RANGES.elevation.min).toBeLessThan(0);
		expect(CAMERA_PROP_RANGES.elevation.max).toBeGreaterThan(0);
	});
});
