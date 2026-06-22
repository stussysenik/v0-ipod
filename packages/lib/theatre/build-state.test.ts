import { describe, expect, it } from "vitest";

import * as TheatreCore from "@theatre/core";

import { buildTheatreState } from "./build-state";
import { EASINGS } from "./easings";
import { createStateSampler } from "./keyframe-sampler";
import { UnitBezier } from "./unit-bezier";

const core = (TheatreCore as unknown as { default?: typeof TheatreCore }).default ?? TheatreCore;
const { getProject, onChange, createRafDriver } = core;

/**
 * `buildTheatreState` turns a concise authoring spec into a Theatre `OnDiskState`.
 * It is how every moment-card preset is defined, so it must (a) round-trip through
 * our own sampler to the intended values and (b) emit a state the real
 * `@theatre/core` accepts and plays — otherwise studio round-tripping would break.
 */
describe("buildTheatreState", () => {
	it("emits a definition-versioned state with JSON-encoded prop paths", () => {
		const state = buildTheatreState({
			sheetId: "Camera",
			length: 4,
			objects: [
				{
					key: "Lens",
					tracks: {
						azimuth: { keyframes: [{ position: 0, value: 0 }, { position: 4, value: 90 }] },
						"target.x": { keyframes: [{ position: 0, value: -1 }, { position: 4, value: 1 }] },
					},
				},
			],
		});

		expect(state.definitionVersion).toBe("0.4.0");
		const tracks = state.sheetsById.Camera.sequence!.tracksByObject.Lens;
		expect(Object.keys(tracks.trackIdByPropPath)).toContain('["azimuth"]');
		expect(Object.keys(tracks.trackIdByPropPath)).toContain('["target","x"]');
	});

	it("marks the final keyframe of a track as not connected", () => {
		const state = buildTheatreState({
			sheetId: "Camera",
			objects: [
				{
					key: "Lens",
					tracks: {
						azimuth: {
							keyframes: [
								{ position: 0, value: 0 },
								{ position: 2, value: 10 },
								{ position: 4, value: 0 },
							],
						},
					},
				},
			],
		});
		const track = Object.values(
			state.sheetsById.Camera.sequence!.tracksByObject.Lens.trackData,
		)[0];
		expect(track.keyframes[0].connectedRight).toBe(true);
		expect(track.keyframes[1].connectedRight).toBe(true);
		expect(track.keyframes[2].connectedRight).toBe(false);
	});

	it("round-trips a named easing to the intended interpolation", () => {
		const state = buildTheatreState({
			sheetId: "Camera",
			objects: [
				{
					key: "Lens",
					tracks: {
						reach: {
							keyframes: [
								{ position: 0, value: 0, easing: "easeInOut" },
								{ position: 2, value: 100 },
							],
						},
					},
				},
			],
		});
		const sampler = createStateSampler(state, "Camera");
		// The applied easing must match easeInOut sampled at the same local progress.
		const [c1x, c1y, c2x, c2y] = EASINGS.easeInOut;
		const ease = new UnitBezier(c1x, c1y, c2x, c2y);
		expect(sampler.sampleObject("Lens", 0.5).reach as number).toBeCloseTo(
			ease.solve(0.25) * 100,
			3,
		);
		expect(sampler.sampleObject("Lens", 1).reach as number).toBeCloseTo(50, 6); // symmetric
	});

	it("supports stepped (hold) keyframes", () => {
		const state = buildTheatreState({
			sheetId: "Camera",
			objects: [
				{
					key: "Lens",
					tracks: {
						preset: {
							keyframes: [
								{ position: 0, value: 1, hold: true },
								{ position: 2, value: 2 },
							],
						},
					},
				},
			],
		});
		const sampler = createStateSampler(state, "Camera");
		expect(sampler.sampleObject("Lens", 1).preset).toBe(1);
		expect(sampler.sampleObject("Lens", 2).preset).toBe(2);
	});

	it("emits a state that @theatre/core loads and plays identically", () => {
		const state = buildTheatreState({
			sheetId: "Camera",
			length: 4,
			objects: [
				{
					key: "Lens",
					tracks: {
						azimuth: {
							keyframes: [
								{ position: 0, value: 0, easing: "easeOutCubic" },
								{ position: 4, value: 60 },
							],
						},
					},
				},
			],
		});

		const sampler = createStateSampler(state, "Camera");
		const project = getProject("BuildStateParity", { state });
		const sheet = project.sheet("Camera");
		const obj = sheet.object("Lens", { azimuth: 0 });
		const driver = createRafDriver();
		let latest = { azimuth: 0 };
		onChange(obj.props, (v: { azimuth: number }) => (latest = { ...v }), driver);

		let clock = 0;
		for (let i = 0; i <= 20; i++) {
			const position = (i / 20) * 4;
			sheet.sequence.position = position;
			clock += 16;
			driver.tick(clock);
			expect(sampler.sampleObject("Lens", position).azimuth as number).toBeCloseTo(
				latest.azimuth,
				4,
			);
		}
	});
});
