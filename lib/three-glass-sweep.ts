/**
 * Glass sweep — camera pose → CSS gradient params (§2.1).
 *
 * The live Now Playing screen is a DOM overlay sitting in front of the WebGL device
 * (kept there so title/artist stay inline-editable). To stop it reading as a pasted
 * decal, it wears the same optical event the glazed WebGL surface would: a specular
 * streak that slides and rotates as the camera orbits. This is the pure decision
 * layer — `(azimuth, elevation) → gradient params` — with NO dependency on three, the
 * DOM, or lighting dials, so it is deterministic and unit-testable. §2.2 paints these
 * params onto the DOM screen; §2.3 matches the WebGL export glass to the same numbers
 * so live ≈ export.
 *
 * Model: the glass catches the environment strip most strongly when the device is near
 * dead-on (the composed hero) and fades as the camera swings away to reflect the darker
 * surround — a Gaussian falloff from the head-on catch. The band's along-axis position
 * tracks orbit (azimuth horizontally, elevation vertically) and the gradient axis tilts
 * with the camera so the streak rotates rather than sliding rigidly. Signs/constants are
 * the documented starting shape; §2.3's visual session fine-tunes them against the export.
 */

export interface CameraSweepInput {
	/** Orbit azimuth in degrees; 0 = dead-on, positive = camera swung right. */
	azimuth: number;
	/** Orbit elevation in degrees; 0 = level, positive = camera raised. */
	elevation: number;
}

export interface GlassSweepParams {
	/** Linear-gradient direction in degrees (CSS convention: 0 = to top, 90 = to right). */
	angle: number;
	/** Center of the bright band along the gradient axis, 0–100 (%). */
	position: number;
	/** Peak opacity of the streak, 0–1. */
	intensity: number;
	/** Half-width of the band as a percentage of the axis, > 0. */
	spread: number;
}

/** A top-right diagonal streak — the natural glazed-glass catch on a portrait screen. */
export const BASE_SWEEP_ANGLE = 105;
export const PEAK_SWEEP_INTENSITY = 0.5;
/** Glass always keeps a faint sheen; the streak never fully vanishes. */
export const FLOOR_SWEEP_INTENSITY = 0.05;

const ANGLE_TILT_PER_AZIMUTH = 0.6;
const ANGLE_TILT_PER_ELEVATION = -0.35;
const POSITION_PER_AZIMUTH = 0.9;
const POSITION_PER_ELEVATION = 0.6;
/** Width (deg) of the head-on specular catch before the streak falls off. */
const CATCH_SIGMA = 42;
const BASE_SPREAD = 18;
/** The streak softens as it dims — a fading reflection loses its hard edge. */
const SPREAD_GROWTH = 22;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function resolveGlassSweep({ azimuth, elevation }: CameraSweepInput): GlassSweepParams {
	const angle = BASE_SWEEP_ANGLE + azimuth * ANGLE_TILT_PER_AZIMUTH + elevation * ANGLE_TILT_PER_ELEVATION;

	const position = clamp(
		50 + azimuth * POSITION_PER_AZIMUTH + elevation * POSITION_PER_ELEVATION,
		0,
		100,
	);

	// Gaussian falloff from the dead-on catch across the combined orbit distance.
	const offAxis = Math.hypot(azimuth, elevation);
	const catch_ = Math.exp(-(offAxis * offAxis) / (2 * CATCH_SIGMA * CATCH_SIGMA));
	const intensity = clamp(PEAK_SWEEP_INTENSITY * catch_, FLOOR_SWEEP_INTENSITY, PEAK_SWEEP_INTENSITY);

	const spread = BASE_SPREAD + (1 - catch_) * SPREAD_GROWTH;

	return { angle, position, intensity, spread };
}

/** Render sweep params to a CSS `linear-gradient` overlay value, stops ordered and clamped. */
export function glassSweepGradientCss(params: GlassSweepParams): string {
	const start = clamp(params.position - params.spread, 0, 100);
	const end = clamp(params.position + params.spread, 0, 100);
	const alpha = params.intensity.toFixed(3);
	return (
		`linear-gradient(${params.angle}deg, ` +
		`rgba(255, 255, 255, 0) ${start.toFixed(2)}%, ` +
		`rgba(255, 255, 255, ${alpha}) ${params.position.toFixed(2)}%, ` +
		`rgba(255, 255, 255, 0) ${end.toFixed(2)}%)`
	);
}
