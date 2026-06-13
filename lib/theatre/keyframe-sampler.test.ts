import { describe, expect, it } from "vitest";

import {
	createStateSampler,
	computeSequenceLength,
	sampleTrack,
	type TheatreProjectState,
	type TheatreTrack,
} from "./keyframe-sampler";

/**
 * A track whose segments interpolate LINEARLY. For a true identity easing the
 * SEGMENT's control points must land on the diagonal at (1/3,1/3) and (2/3,2/3) —
 * and a segment is built from the LEFT keyframe's right handle (handles[2,3]) and
 * the RIGHT keyframe's left handle (handles[0,1]). So every keyframe carries left
 * handle (2/3,2/3) and right handle (1/3,1/3): whatever pair forms a segment, the
 * control points are exactly the diagonal third-points → exact lerp.
 */
function linearTrack(points: Array<[number, number]>): TheatreTrack {
	return {
		type: "BasicKeyframedTrack",
		keyframes: points.map(([position, value], i) => ({
			id: `kf-${i}`,
			position,
			value,
			handles: [2 / 3, 2 / 3, 1 / 3, 1 / 3],
			connectedRight: true,
			type: "bezier" as const,
		})),
	};
}

describe("sampleTrack", () => {
	it("interpolates linearly across a diagonal-handle segment", () => {
		const track = linearTrack([
			[0, 0],
			[10, 100],
		]);
		expect(sampleTrack(track, 0)).toBeCloseTo(0, 6);
		expect(sampleTrack(track, 2.5)).toBeCloseTo(25, 6);
		expect(sampleTrack(track, 5)).toBeCloseTo(50, 6);
		expect(sampleTrack(track, 10)).toBeCloseTo(100, 6);
	});

	it("clamps to the first value before the first keyframe", () => {
		const track = linearTrack([
			[2, 40],
			[6, 80],
		]);
		expect(sampleTrack(track, 0)).toBeCloseTo(40, 6);
		expect(sampleTrack(track, -100)).toBeCloseTo(40, 6);
	});

	it("clamps to the last value after the last keyframe", () => {
		const track = linearTrack([
			[2, 40],
			[6, 80],
		]);
		expect(sampleTrack(track, 6)).toBeCloseTo(80, 6);
		expect(sampleTrack(track, 999)).toBeCloseTo(80, 6);
	});

	it("holds the left value when the segment is not connected (connectedRight=false)", () => {
		const track: TheatreTrack = {
			type: "BasicKeyframedTrack",
			keyframes: [
				{ id: "a", position: 0, value: 10, handles: [0.5, 0, 0.5, 0], connectedRight: false },
				{ id: "b", position: 4, value: 90, handles: [0.5, 1, 0.5, 1], connectedRight: true },
			],
		};
		expect(sampleTrack(track, 0)).toBeCloseTo(10, 6);
		expect(sampleTrack(track, 2)).toBeCloseTo(10, 6); // still the left value
		expect(sampleTrack(track, 3.999)).toBeCloseTo(10, 6);
		expect(sampleTrack(track, 4)).toBeCloseTo(90, 6); // snaps at the right keyframe
	});

	it("steps (no tween) for a hold-typed keyframe", () => {
		const track: TheatreTrack = {
			type: "BasicKeyframedTrack",
			keyframes: [
				{ id: "a", position: 0, value: 1, handles: [0.5, 0, 0.5, 0], connectedRight: true, type: "hold" },
				{ id: "b", position: 4, value: 2, handles: [0.5, 1, 0.5, 1], connectedRight: true },
			],
		};
		expect(sampleTrack(track, 0)).toBe(1);
		expect(sampleTrack(track, 3.9)).toBe(1);
		expect(sampleTrack(track, 4)).toBe(2);
	});

	it("eases a non-diagonal segment exactly like the UnitBezier kernel", () => {
		// handles 0.5,0 → 0.5,1: the classic ease-in-out; quarter progress ≈ 10.589%.
		const track: TheatreTrack = {
			type: "BasicKeyframedTrack",
			keyframes: [
				{ id: "a", position: 0, value: 0, handles: [0.5, 0, 0.5, 0], connectedRight: true },
				{ id: "b", position: 2, value: 100, handles: [0.5, 1, 0.5, 1], connectedRight: true },
			],
		};
		expect(sampleTrack(track, 0.5)).toBeCloseTo(10.589, 2);
		expect(sampleTrack(track, 1)).toBeCloseTo(50, 6);
		expect(sampleTrack(track, 1.5)).toBeCloseTo(89.411, 2);
	});
});

const TWO_PROP_STATE: TheatreProjectState = {
	sheetsById: {
		Cam: {
			staticOverrides: { byObject: { Lens: { fov: 50 } } },
			sequence: {
				type: "PositionalSequence",
				length: 4,
				subUnitsPerUnit: 30,
				tracksByObject: {
					Lens: {
						trackIdByPropPath: { '["azimuth"]': "t-az", '["target","x"]': "t-tx" },
						trackData: {
							"t-az": linearTrack([
								[0, 0],
								[4, 80],
							]),
							"t-tx": linearTrack([
								[0, -2],
								[4, 2],
							]),
						},
					},
				},
			},
		},
	},
	revisionHistory: ["r1"],
	definitionVersion: "0.4.0",
};

describe("createStateSampler", () => {
	it("derives the sequence length from the keyframes when state omits it", () => {
		const noLen: TheatreProjectState = JSON.parse(JSON.stringify(TWO_PROP_STATE));
		delete noLen.sheetsById.Cam.sequence!.length;
		expect(computeSequenceLength(noLen)).toBeCloseTo(4, 6);
	});

	it("samples every sequenced prop into a nested object by decoded prop path", () => {
		const sampler = createStateSampler(TWO_PROP_STATE);
		const mid = sampler.sampleObject("Lens", 2);
		expect(mid.azimuth).toBeCloseTo(40, 6);
		expect((mid.target as { x: number }).x).toBeCloseTo(0, 6);
	});

	it("falls back to a static override for props that have no track", () => {
		const sampler = createStateSampler(TWO_PROP_STATE);
		const v = sampler.sampleObject("Lens", 0);
		expect(v.fov).toBe(50); // never sequenced — comes from staticOverrides
	});

	it("exposes the object keys present in the sequence", () => {
		const sampler = createStateSampler(TWO_PROP_STATE);
		expect(sampler.objectKeys).toContain("Lens");
	});
});
