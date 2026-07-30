import type { CameraMove } from "../studio-camera";
import {
	MOTION_PRESETS,
	type MotionPreset,
	type PresetKeyframe,
} from "../theatre/motion-presets";
import type { Ease, MotionDoc, MotionKeyframe, MotionTrack } from "./doc";
import { fitSampledTrack } from "./fit";

/**
 * THE SHIPPED CATALOGUE, as documents.
 *
 * These are the five procedural camera moves re-expressed as `MotionDoc`s. The
 * point is not tidiness: a generator is a black box the surface can never reach,
 * so "Orbit, but sway a little less" required editing TypeScript. A document is an
 * object the user opens, drags, and saves as their own.
 *
 * WHY THE EASINGS ARE WHAT THEY ARE. A quarter of a sine is not approximated by an
 * S-curve — it IS one of the named curves, exactly:
 *
 *     easeOutSine(x) = sin(πx/2)        a quarter rising from zero to the peak
 *     easeInSine(x)  = 1 − cos(πx/2)    a quarter falling from the peak to zero
 *
 * So a full sine cycle on quarter keyframes is `easeOutSine` and `easeInSine`
 * alternating, and a cosine cycle is the same pair in the opposite order. Reaching
 * for `easeInOutSine` on every segment — the obvious move — would put a
 * slow-fast-slow curve where the true shape is fast-then-slow, and the error would
 * be roughly an order of magnitude worse. The residual deviation is then only how
 * well the published CSS bezier approximates the analytic quarter-sine, which is
 * what §2's harness measures.
 *
 * `turntable`'s azimuth is the control case: `360 * t` is linear, so two keyframes
 * with a `linear` ease reproduce it exactly and the expected reading is zero.
 */

/** Quarter-keyframe positions — one full cycle. */
const QUARTERS = [0, 0.25, 0.5, 0.75, 1] as const;

function track(values: readonly number[], easings: readonly Ease[]): MotionTrack {
	const keyframes: MotionKeyframe[] = values.map((value, i) => ({
		at: QUARTERS[i],
		value,
		// The last keyframe closes the cycle and its outgoing curve is never read.
		easing: i < easings.length ? easings[i] : undefined,
	}));
	return { keyframes };
}

/**
 * `A · sin(2πt)` — zero at the seam, peaking a quarter in.
 * Rising quarters are `easeOutSine`; falling quarters are `easeInSine`.
 */
export function sineTrack(amplitude: number): MotionTrack {
	return track(
		[0, amplitude, 0, -amplitude, 0],
		["easeOutSine", "easeInSine", "easeOutSine", "easeInSine"],
	);
}

/**
 * `dc − A · cos(2πt)` — the raised-cosine family every dolly in the catalogue uses.
 * With `dc === A` it starts at zero and breathes out to `2A`; with `dc === 0` it is
 * a plain cosine. The easing order is the mirror of `sineTrack`, because a cosine
 * leaves its extreme slowly and arrives at the next one quickly.
 */
export function cosineTrack(amplitude: number, dc = 0): MotionTrack {
	return track(
		[dc - amplitude, dc, dc + amplitude, dc, dc - amplitude],
		["easeInSine", "easeOutSine", "easeInSine", "easeOutSine"],
	);
}

/** `360 · t` — linear, and therefore exactly two keyframes. */
function linearTurnTrack(degrees: number): MotionTrack {
	return {
		keyframes: [
			{ at: 0, value: 0, easing: "linear" },
			{ at: 1, value: degrees },
		],
	};
}

/**
 * Crane's elevation carries a second harmonic — `16·sin φ + 6·sin 2φ` — the
 * cinebot's "lift → hover → descend" beat inside one cycle. A sum of two sines has
 * no quarter that coincides with a named curve, so this is the one track in the
 * catalogue that is FITTED rather than written: `fitSampledTrack` matches the true
 * derivative at both ends of every segment.
 *
 * Eight segments is a human-scale track — nine keyframes a user can actually drag —
 * and the tangent matching is what makes eight enough. The measured reading is
 * recorded in the change's `tasks.md` §2.6.
 */
function craneElevationTrack(
	fundamental: number,
	secondHarmonic: number,
	divisions: number,
): MotionTrack {
	const TAU = Math.PI * 2;
	return fitSampledTrack(
		(t) => fundamental * Math.sin(TAU * t) + secondHarmonic * Math.sin(2 * TAU * t),
		divisions,
		{
			derivative: (t) =>
				fundamental * TAU * Math.cos(TAU * t) +
				secondHarmonic * 2 * TAU * Math.cos(2 * TAU * t),
		},
	);
}

/**
 * The six offset fields a moment card carries, mapped to the track keys the pose
 * bridge reads (`studio-project.ts`). A card writes all six on one shared grid; a
 * document splits them into six tracks that merely happen to share positions —
 * which is what makes them independently editable afterwards.
 */
const CARD_OFFSET_FIELDS = {
	azimuth: "dAzimuth",
	elevation: "dElevation",
	reach: "dReach",
	targetX: "dTargetX",
	targetY: "dTargetY",
	targetZ: "dTargetZ",
} as const satisfies Record<string, keyof PresetKeyframe>;

/**
 * Re-express a moment card as a document. This is a pure change of shape, not an
 * approximation: the positions, values and easings are carried across untouched, so
 * the ported document samples IDENTICALLY rather than merely closely. The test
 * asserts exact equality for that reason.
 *
 * Every card writes all six tracks, including the ones it leaves at zero, matching
 * `buildPresetState`'s behaviour of emitting a track per prop so a clip always
 * resolves to a full framing rather than a partial pose.
 */
export function presetToMotionDoc(preset: MotionPreset): MotionDoc {
	const tracks: Record<string, MotionTrack> = {};
	for (const [trackKey, field] of Object.entries(CARD_OFFSET_FIELDS)) {
		tracks[trackKey] = {
			keyframes: preset.keyframes.map((kf) => ({
				at: kf.at,
				value: (kf[field] as number | undefined) ?? 0,
				easing: kf.easing,
			})),
		};
	}
	return {
		id: preset.id,
		label: preset.label,
		hint: preset.hint,
		naturalCycleSeconds: preset.naturalCycleSeconds,
		loopable: preset.loopable,
		tracks,
	};
}

/** The eight moment cards as documents, keyed by card id. */
export const MOMENT_DOCS: Record<string, MotionDoc> = Object.fromEntries(
	MOTION_PRESETS.map((preset) => [preset.id, presetToMotionDoc(preset)]),
);

/**
 * The ported catalogue. Amplitudes are transcribed from the generators in
 * `lib/studio-camera.ts` and the parity harness proves the transcription.
 */
export const CATALOGUE_DOCS: Record<CameraMove, MotionDoc> = {
	orbit: {
		id: "orbit",
		label: "Orbit",
		hint: "gentle 3/4 sway",
		naturalCycleSeconds: 5,
		loopable: true,
		tracks: {
			azimuth: sineTrack(17),
			elevation: cosineTrack(2),
			reach: cosineTrack(0.4, 0.25),
		},
	},
	turntable: {
		id: "turntable",
		label: "Turntable",
		hint: "Z-axis 360 spin",
		naturalCycleSeconds: 6,
		loopable: true,
		tracks: {
			azimuth: linearTurnTrack(360),
			elevation: sineTrack(4),
			reach: cosineTrack(0.5, 0.5),
		},
	},
	sweep: {
		id: "sweep",
		label: "Sweep",
		hint: "overhead arc",
		naturalCycleSeconds: 7,
		loopable: true,
		tracks: {
			azimuth: sineTrack(5),
			elevation: sineTrack(28),
			reach: cosineTrack(0.8, 0.8),
		},
	},
	robo: {
		id: "robo",
		label: "Robo",
		hint: "diagonal dolly",
		naturalCycleSeconds: 6,
		loopable: true,
		tracks: {
			azimuth: sineTrack(18),
			elevation: sineTrack(8),
			reach: cosineTrack(0.9, 0.9),
		},
	},
	crane: {
		id: "crane",
		label: "Crane",
		hint: "robotic lift arc",
		naturalCycleSeconds: 8,
		loopable: true,
		tracks: {
			azimuth: sineTrack(24),
			elevation: craneElevationTrack(16, 6, 8),
			reach: cosineTrack(1.1, 1.1),
		},
	},
};
