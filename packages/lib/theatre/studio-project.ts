import { ELEVATION_RANGE, REACH_RANGE, type StudioPose } from '../studio-camera';
import type { SampledValues } from './keyframe-sampler';

/**
 * The canonical Theatre project layout for the 3D studio, plus the bridge between
 * Theatre's flat numeric props and the studio's `StudioPose` language.
 *
 * Theatre animates plain numbers; the studio thinks in azimuth / elevation /
 * reach / target. We keep the camera's target as three discrete numeric tracks
 * (`targetX/Y/Z`) rather than a compound prop — flat tracks are simpler to author,
 * simpler to sample, and round-trip through the studio GUI without compound-type
 * ceremony. This module is pure (no `@theatre/core` import) so it stays usable in
 * tests and on the deterministic export path; the runtime builds core prop types
 * from `CAMERA_PROP_RANGES`.
 */

export const THEATRE_PROJECT_ID = 'iPod 3D Studio';
export const CAMERA_SHEET_ID = 'Camera';
export const CAMERA_OBJECT_KEY = 'Lens';
export const LIGHTING_OBJECT_KEY = 'Rig';

/** A sensible neutral framing used when a track or prop is absent. */
export const DEFAULT_REACH = 14;

export interface PropRange {
	min: number;
	max: number;
}

/** Slider envelopes for the studio GUI — mirror the camera authoring guards. */
export const CAMERA_PROP_RANGES = {
	azimuth: { min: -180, max: 180 },
	elevation: { min: ELEVATION_RANGE[0], max: ELEVATION_RANGE[1] },
	reach: { min: REACH_RANGE[0], max: REACH_RANGE[1] },
	targetX: { min: -3, max: 3 },
	targetY: { min: -3, max: 3 },
	targetZ: { min: -3, max: 3 },
} as const satisfies Record<string, PropRange>;

export type CameraPropName = keyof typeof CAMERA_PROP_RANGES;

/**
 * The lighting object animates the SAME five relative multipliers the dev
 * scratchpad dials (ambient / key / fill / rim / env), but as a keyframed
 * lighting CUE authored on the timeline — so a moment card can carry not just a
 * camera move but a lighting move that rides along with it. Values are relative
 * multipliers (1 = the rig's authored intensity), range [0, 3], so a track can
 * only dim a light to black or brighten it up to 3× — never negate it.
 */
export const LIGHTING_PROP_RANGES = {
	ambient: { min: 0, max: 3 },
	key: { min: 0, max: 3 },
	fill: { min: 0, max: 3 },
	rim: { min: 0, max: 3 },
	env: { min: 0, max: 3 },
} as const satisfies Record<string, PropRange>;

export type LightingPropName = keyof typeof LIGHTING_PROP_RANGES;

/** The five multiplier channels, in a stable order — the cue's sampled shape. */
export type LightingMultiplierValues = Record<LightingPropName, number>;

/** `StudioPose` → flat numeric tracks Theatre can animate. */
export function poseToStudioValues(pose: StudioPose): Record<CameraPropName, number> {
	return {
		azimuth: pose.azimuth,
		elevation: pose.elevation,
		reach: pose.reach,
		targetX: pose.target[0],
		targetY: pose.target[1],
		targetZ: pose.target[2],
	};
}

function num(values: SampledValues, key: string, fallback: number): number {
	const v = values[key];
	return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Sampled Theatre values → `StudioPose`, with safe defaults for missing props. */
export function studioValuesToPose(values: SampledValues): StudioPose {
	return {
		azimuth: num(values, 'azimuth', 0),
		elevation: num(values, 'elevation', 0),
		reach: num(values, 'reach', DEFAULT_REACH),
		target: [
			num(values, 'targetX', 0),
			num(values, 'targetY', 0),
			num(values, 'targetZ', 0),
		],
	};
}

/** Default prop values for instantiating the camera object in `@theatre/core`. */
export function defaultCameraProps(): Record<CameraPropName, number> {
	return {
		azimuth: 0,
		elevation: 0,
		reach: DEFAULT_REACH,
		targetX: 0,
		targetY: 0,
		targetZ: 0,
	};
}

/** Default prop values for instantiating the lighting object in `@theatre/core`. */
export function defaultLightingProps(): LightingMultiplierValues {
	return { ambient: 1, key: 1, fill: 1, rim: 1, env: 1 };
}

/**
 * Sampled Theatre lighting values → the five relative multiplier channels.
 * The lighting object is authored in relative-multiplier space (1 = rig
 * intensity), so the sampled values map straight onto the multiplier store the
 * scratchpad also drives — letting a keyframed cue and a manual dial share one
 * rig. Missing/non-finite props fall back to identity (no change).
 */
export function lightingValuesToMultipliers(values: SampledValues): LightingMultiplierValues {
	return {
		ambient: num(values, 'ambient', 1),
		key: num(values, 'key', 1),
		fill: num(values, 'fill', 1),
		rim: num(values, 'rim', 1),
		env: num(values, 'env', 1),
	};
}
