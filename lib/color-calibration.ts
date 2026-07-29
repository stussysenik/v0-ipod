/**
 * Calibration controls for finish colour — the dcal model applied to the product.
 *
 * dcal (github.com/stussysenik/dcal) calibrates a display by composing three
 * operator-facing values into one transfer ramp:
 *
 *   contrast    -> pow(2, (c - 50) / 50)  as a power-law exponent
 *   brightness  -> scales maximum output
 *   white point -> per-channel gain from the daylight locus
 *
 * The same three values are a better customisation surface than a hex field:
 * picking "slightly warmer, slightly flatter" is a thing a person can want and
 * cannot spell in hex. This module is that pipeline over a single colour rather
 * than over a 256-entry display LUT.
 *
 * Neutral is identity by construction — brightness 100, contrast 50, 6500K
 * returns the input colour unchanged. Anything else would silently re-tint every
 * authentic finish the manifest pins.
 */

import { hexToRgb, rgbToHex } from "./color-proximity";

export interface Calibration {
	/** 0-100. 100 is unattenuated. Scales maximum output. */
	brightness: number;
	/** 0-100. 50 is neutral; below flattens, above deepens. */
	contrast: number;
	/** Correlated colour temperature in Kelvin. 6500 is the sRGB white point. */
	whitePointK: number;
}

export const NEUTRAL: Calibration = { brightness: 100, contrast: 50, whitePointK: 6500 };

/** The white point sRGB itself is defined against; gains at this value are unity. */
const D65_KELVIN = 6500;

export const KELVIN_RANGE = { min: 4000, max: 25000 } as const;

/**
 * Named transfer targets. dcal exposes these as one-click presets because the
 * exponent is the part of a calibration nobody remembers.
 */
export const TRANSFER_TARGETS = {
	sRGB: { label: "sRGB", gamma: 2.2 },
	"Rec.709": { label: "Rec.709", gamma: 2.4 },
	"DCI-P3": { label: "DCI-P3", gamma: 2.6 },
} as const;

export type TransferTarget = keyof typeof TRANSFER_TARGETS;

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}

/** sRGB EOTF (IEC 61966-2-1): encoded [0,1] -> linear [0,1]. */
function toLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** sRGB inverse EOTF: linear [0,1] -> encoded [0,1]. */
function toEncoded(c: number): number {
	return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * CIE D-series daylight locus: correlated colour temperature -> xy chromaticity.
 * Two piecewise cubics, split at 7000K, valid across KELVIN_RANGE.
 */
export function kelvinToChromaticity(kelvin: number): { x: number; y: number } {
	const t = clamp(kelvin, KELVIN_RANGE.min, KELVIN_RANGE.max);
	const x =
		t <= 7000
			? -4.607e9 / t ** 3 + 2.9678e6 / t ** 2 + 0.09911e3 / t + 0.244063
			: -2.0064e9 / t ** 3 + 1.9018e6 / t ** 2 + 0.24748e3 / t + 0.23704;
	const y = -3.0 * x * x + 2.87 * x - 0.275;
	return { x, y };
}

/** Linear sRGB primaries for a chromaticity, at Y = 1. Unnormalised. */
function rawGains(kelvin: number): [number, number, number] {
	const { x, y } = kelvinToChromaticity(kelvin);
	// xyY -> XYZ at Y = 1.
	const X = x / y;
	const Y = 1;
	const Z = (1 - x - y) / y;

	// XYZ -> linear sRGB (D65).
	return [
		3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
		-0.969266 * X + 1.8760108 * Y + 0.041556 * Z,
		0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z,
	];
}

/**
 * Per-channel linear gain for a colour temperature.
 *
 * Taken as a ratio against the gains at D65, so 6500K is exactly unity and the
 * curve stays continuous through it — the daylight locus approximates D65 at
 * 6504K, so using it raw would leave a small step at the neutral position and
 * silently tint every finish at the default setting.
 *
 * Normalised so the largest gain is 1: calibration only ever attenuates, so no
 * channel is driven above full scale and nothing clips.
 */
export function kelvinToRgbGains(kelvin: number): { r: number; g: number; b: number } {
	const raw = rawGains(kelvin);
	const ref = rawGains(D65_KELVIN);
	const ratio = raw.map((v, i) => (ref[i] === 0 ? 0 : v / ref[i]));

	const max = Math.max(...ratio);
	if (!(max > 0)) return { r: 1, g: 1, b: 1 };
	const [r, g, b] = ratio.map((v) => clamp(v / max, 0, 1));
	return { r, g, b };
}

/** Contrast slider -> power-law exponent. 50 is unity by construction. */
export function contrastExponent(contrast: number): number {
	return Math.pow(2, (clamp(contrast, 0, 100) - 50) / 50);
}

/**
 * Compose the three operator values into one channel transfer, then apply it to
 * a colour. Order matches dcal's RampComposer: contrast shapes the curve,
 * brightness scales its ceiling, white point tints per channel.
 */
export function applyCalibration(hex: string, cal: Calibration = NEUTRAL): string {
	const exponent = contrastExponent(cal.contrast);
	const scale = clamp(cal.brightness, 0, 100) / 100;
	const gains = kelvinToRgbGains(cal.whitePointK);

	const { r, g, b } = hexToRgb(hex);
	const channel = (v: number, gain: number): number => {
		const linear = toLinear(v / 255);
		const shaped = Math.pow(linear, exponent) * scale * gain;
		return Math.round(clamp(toEncoded(clamp(shaped, 0, 1)), 0, 1) * 255);
	};

	return rgbToHex(channel(r, gains.r), channel(g, gains.g), channel(b, gains.b));
}

/**
 * Re-express a calibration against a named transfer target. The target sets the
 * exponent; the returned contrast is the slider position that produces it, so
 * the control surface and the preset stay one value rather than two.
 */
export function calibrationForTarget(target: TransferTarget, base: Calibration = NEUTRAL): Calibration {
	const { gamma } = TRANSFER_TARGETS[target];
	// contrastExponent inverted: exponent = 2^((c-50)/50)  =>  c = 50 + 50*log2(e)
	const contrast = 50 + 50 * Math.log2(gamma / 2.2);
	return { ...base, contrast: clamp(contrast, 0, 100) };
}
