import type { StudioPose } from "../studio-camera";
import { buildTheatreState, type KeyframeSpec, type SheetSpec } from "./build-state";
import type { EasingName } from "./easings";
import type { TheatreProjectState } from "./keyframe-sampler";
import {
	CAMERA_OBJECT_KEY,
	CAMERA_SHEET_ID,
	poseToStudioValues,
	type CameraPropName,
} from "./studio-project";

/**
 * MOMENT CARDS — the parametric, shareable motion vocabulary.
 *
 * Each card is a Theatre keyframe clip authored in OFFSET space relative to the
 * hero pose the designer composed: a card says "bob the elevation ±3° and breathe
 * the dolly in half a unit", not absolute coordinates. `buildPresetState` anchors
 * those offsets onto a concrete hero and a chosen cycle length, producing a real
 * Theatre `OnDiskState` the sampler (export) and `@theatre/core` (studio GUI)
 * both consume. Because every prop track is emitted anchored on the hero — even
 * the ones a card leaves constant — a clip resolves to the FULL hero framing plus
 * its motion, never a partial pose.
 *
 * Loopable cards begin and end at zero offset, so a clip repeated N times closes
 * seamlessly on the hero seam (the same invariant the procedural moves guarantee
 * via whole-turn sin/cos). One-shot cards (`loopable: false`) are reveals meant to
 * play once.
 */

/** A keyframe expressed as a delta from the hero pose, positioned in [0,1]. */
export interface PresetKeyframe {
	/** Normalized position within one cycle (0 = start, 1 = end). */
	at: number;
	dAzimuth?: number;
	dElevation?: number;
	dReach?: number;
	dTargetX?: number;
	dTargetY?: number;
	dTargetZ?: number;
	/** Easing leaving this keyframe (default `easeInOutSine` — a breathing curve). */
	easing?: EasingName;
}

export interface MotionPreset {
	id: string;
	label: string;
	hint: string;
	/** A satisfying length for one cycle of this motion, in seconds. */
	naturalCycleSeconds: number;
	/** Does the motion return to the hero seam so it can repeat seamlessly? */
	loopable: boolean;
	keyframes: PresetKeyframe[];
}

const DEFAULT_PRESET_EASING: EasingName = "easeInOutSine";

/** Map a camera prop name to the matching per-keyframe offset field. */
const OFFSET_FIELD: Record<CameraPropName, keyof PresetKeyframe> = {
	azimuth: "dAzimuth",
	elevation: "dElevation",
	reach: "dReach",
	targetX: "dTargetX",
	targetY: "dTargetY",
	targetZ: "dTargetZ",
};

/**
 * Anchor a moment card onto a concrete `hero` pose and `cycleSeconds`, producing a
 * Theatre project state with one absolute numeric track per camera prop.
 */
export function buildPresetState(
	preset: MotionPreset,
	hero: StudioPose,
	cycleSeconds: number,
): TheatreProjectState {
	const base = poseToStudioValues(hero);
	const propNames = Object.keys(base) as CameraPropName[];

	const tracks: Record<string, { keyframes: KeyframeSpec[] }> = {};
	for (const prop of propNames) {
		const field = OFFSET_FIELD[prop];
		tracks[prop] = {
			keyframes: preset.keyframes.map((kf) => ({
				position: kf.at * cycleSeconds,
				value: base[prop] + ((kf[field] as number | undefined) ?? 0),
				easing: kf.easing ?? DEFAULT_PRESET_EASING,
			})),
		};
	}

	const spec: SheetSpec = {
		sheetId: CAMERA_SHEET_ID,
		length: cycleSeconds,
		objects: [{ key: CAMERA_OBJECT_KEY, tracks }],
	};
	return buildTheatreState(spec);
}

export const MOTION_PRESETS: readonly MotionPreset[] = [
	{
		id: "float-bob",
		label: "Float & Bob",
		hint: "weightless vertical breath",
		naturalCycleSeconds: 6,
		loopable: true,
		keyframes: [
			{ at: 0 },
			{ at: 0.25, dElevation: 3, dAzimuth: 2 },
			{ at: 0.5, dReach: -0.5 },
			{ at: 0.75, dElevation: -3, dAzimuth: -2 },
			{ at: 1 },
		],
	},
	{
		id: "parallax-push",
		label: "Parallax Push-In",
		hint: "dolly dives in and returns",
		naturalCycleSeconds: 5,
		loopable: true,
		keyframes: [
			{ at: 0, easing: "easeInOutCubic" },
			{ at: 0.5, dReach: -4, easing: "easeInOutCubic" },
			{ at: 1 },
		],
	},
	{
		id: "pendulum",
		label: "Pendulum Sway",
		hint: "wide left-right arc",
		naturalCycleSeconds: 7,
		loopable: true,
		keyframes: [
			{ at: 0 },
			{ at: 0.25, dAzimuth: 22, dElevation: 2 },
			{ at: 0.5 },
			{ at: 0.75, dAzimuth: -22, dElevation: 2 },
			{ at: 1 },
		],
	},
	{
		id: "crane-reveal",
		label: "Crane Reveal",
		hint: "lift overhead and settle",
		naturalCycleSeconds: 8,
		loopable: true,
		keyframes: [
			{ at: 0, easing: "easeInOutCubic" },
			{ at: 0.5, dElevation: 24, dReach: 1.5, easing: "easeInOutCubic" },
			{ at: 1 },
		],
	},
	{
		id: "grand-turntable",
		label: "Grand Turntable",
		hint: "constant 360° jewel-case spin",
		naturalCycleSeconds: 6,
		loopable: true,
		keyframes: [
			{ at: 0, easing: "linear" },
			{ at: 0.5, dAzimuth: 180, dElevation: 3, easing: "linear" },
			{ at: 1, dAzimuth: 360 },
		],
	},
	{
		id: "boom-drift",
		label: "Boom Drift",
		hint: "diagonal cinebot glide",
		naturalCycleSeconds: 6,
		loopable: true,
		keyframes: [
			{ at: 0 },
			{ at: 0.5, dAzimuth: 16, dElevation: 8, dReach: -1 },
			{ at: 1 },
		],
	},
	{
		id: "halo-sweep",
		label: "Halo Sweep",
		hint: "cresting arc that lifts and eases in",
		// Slow + luxurious: the camera sways a wide shallow arc across the front
		// while cresting up and pushing gently in at the apex, then unwinds — three
		// axes moving in concert for a beauty-shot feel. Quarter keyframes + the
		// default easeInOutSine (same recipe as the proven pendulum) keep it
		// buttery and seamless; every offset returns to zero at the seam.
		naturalCycleSeconds: 9,
		loopable: true,
		keyframes: [
			{ at: 0 },
			{ at: 0.25, dAzimuth: 20, dElevation: 6, dReach: -0.6 },
			{ at: 0.5, dElevation: 10, dReach: -1.2 },
			{ at: 0.75, dAzimuth: -20, dElevation: 6, dReach: -0.6 },
			{ at: 1 },
		],
	},
	{
		id: "dolly-out-reveal",
		label: "Dolly-Out Reveal",
		hint: "one-shot pull back to a wide",
		naturalCycleSeconds: 5,
		loopable: false,
		keyframes: [
			{ at: 0, easing: "easeOutCubic" },
			{ at: 1, dReach: 5, dAzimuth: 15 },
		],
	},
] as const;

/** Look up a moment card by id. */
export function findMotionPreset(id: string): MotionPreset | undefined {
	return MOTION_PRESETS.find((p) => p.id === id);
}
