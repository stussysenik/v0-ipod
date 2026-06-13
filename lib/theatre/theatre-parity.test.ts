import { describe, expect, it } from "vitest";

import * as TheatreCore from "@theatre/core";

import {
	createStateSampler,
	type TheatreProjectState,
	type TheatreTrack,
} from "./keyframe-sampler";

/**
 * THE FIDELITY CONTRACT.
 *
 * Our pure sampler and `@theatre/core` must produce identical values for the same
 * keyframe state, or designers would see one thing in the studio timeline and get
 * another in the export. This test renders the same tracks through both engines at
 * many positions and asserts they agree.
 *
 * `@theatre/core` only emits values through a HOT prism: we subscribe with a
 * `rafDriver` we tick manually, set `sequence.position`, tick, then read the value
 * the subscription captured. (Cold reads return the static default — proven during
 * integration.) That ceremony lives entirely in this oracle; production code uses
 * the pure synchronous sampler.
 */

// `@theatre/core` ships as CJS; tolerate both interop shapes.
const core = (TheatreCore as unknown as { default?: typeof TheatreCore }).default ?? TheatreCore;
const { getProject, onChange, createRafDriver } = core;

function easeTrack(points: Array<[number, number]>, type: "bezier" | "hold" = "bezier"): TheatreTrack {
	return {
		type: "BasicKeyframedTrack",
		keyframes: points.map(([position, value], i) => ({
			id: `kf-${i}`,
			position,
			value,
			// A pronounced, asymmetric ease so any bezier mismatch would show.
			handles: [0.7, 0.1, 0.25, 0.9],
			connectedRight: true,
			type,
		})),
	};
}

let projectCounter = 0;

/** Sample one object's props through the real `@theatre/core` runtime. */
function sampleWithCore(
	state: TheatreProjectState,
	sheetId: string,
	objectKey: string,
	props: Record<string, number>,
	positions: number[],
): Record<string, number>[] {
	projectCounter += 1;
	const project = getProject(`Parity-${projectCounter}`, { state });
	const sheet = project.sheet(sheetId);
	const obj = sheet.object(objectKey, props);

	const driver = createRafDriver();
	let latest: Record<string, number> = { ...props };
	const unsub = onChange(
		obj.props,
		(v: Record<string, number>) => {
			latest = { ...v };
		},
		driver,
	);

	const out: Record<string, number>[] = [];
	let clock = 0;
	for (const position of positions) {
		sheet.sequence.position = position;
		clock += 16;
		driver.tick(clock);
		out.push({ ...latest });
	}
	unsub();
	return out;
}

describe("pure sampler ↔ @theatre/core parity", () => {
	const POSITIONS = Array.from({ length: 41 }, (_, i) => (i / 40) * 4); // 0 → 4 inclusive

	it("matches @theatre/core for a multi-keyframe asymmetric-ease track", () => {
		const state: TheatreProjectState = {
			sheetsById: {
				Cam: {
					staticOverrides: { byObject: {} },
					sequence: {
						type: "PositionalSequence",
						length: 4,
						subUnitsPerUnit: 30,
						tracksByObject: {
							Lens: {
								trackIdByPropPath: { '["azimuth"]': "t-az", '["reach"]': "t-reach" },
								trackData: {
									"t-az": easeTrack([
										[0, 0],
										[1.5, 30],
										[4, -20],
									]),
									"t-reach": easeTrack([
										[0, 14],
										[4, 9],
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

		const sampler = createStateSampler(state, "Cam");
		const coreValues = sampleWithCore(state, "Cam", "Lens", { azimuth: 0, reach: 0 }, POSITIONS);

		POSITIONS.forEach((position, i) => {
			const mine = sampler.sampleObject("Lens", position);
			expect(mine.azimuth as number).toBeCloseTo(coreValues[i].azimuth, 4);
			expect(mine.reach as number).toBeCloseTo(coreValues[i].reach, 4);
		});
	});

	it("matches @theatre/core for a hold (stepped) track", () => {
		const state: TheatreProjectState = {
			sheetsById: {
				Cam: {
					staticOverrides: { byObject: {} },
					sequence: {
						type: "PositionalSequence",
						length: 4,
						subUnitsPerUnit: 30,
						tracksByObject: {
							Lens: {
								trackIdByPropPath: { '["elevation"]': "t-el" },
								trackData: {
									"t-el": easeTrack(
										[
											[0, 0],
											[2, 45],
											[4, 10],
										],
										"hold",
									),
								},
							},
						},
					},
				},
			},
			revisionHistory: ["r1"],
			definitionVersion: "0.4.0",
		};

		const sampler = createStateSampler(state, "Cam");
		const coreValues = sampleWithCore(state, "Cam", "Lens", { elevation: 0 }, POSITIONS);

		POSITIONS.forEach((position, i) => {
			const mine = sampler.sampleObject("Lens", position);
			expect(mine.elevation as number).toBeCloseTo(coreValues[i].elevation, 4);
		});
	});
});
