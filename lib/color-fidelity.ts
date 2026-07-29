/**
 * Colour fidelity — what survives the trip from picked hex to exported pixel.
 *
 * The product's central promise is that a chosen finish colour comes back out of
 * the exported file as the same colour. This module is the instrument for that
 * claim: it reproduces the export path's colour arithmetic on the CPU and
 * reports, per finish, how far the returned pixel actually lands from the source
 * hex in CIEDE2000.
 *
 * WHAT IS MODELLED, AND WHAT IS NOT
 *
 * Modelled: the transfer chain. Albedo hex → sRGB decode → linear light →
 * (optional display transform) → sRGB encode → 8-bit quantisation → hex. Under a
 * flat unit-intensity white light on a lambertian surface, exiting radiance is
 * the albedo, so this chain is exactly what the renderer does to a
 * front-facing, evenly-lit patch — the case the fidelity promise is about.
 *
 * Not modelled: shading. Fresnel, clearcoat, specular, shadowing and the
 * environment map all change the radiance leaving a real surface, on purpose.
 * A pixel taken from a curved, lit shell is not supposed to equal the albedo,
 * and measuring it against the albedo would be measuring the lighting, not the
 * transfer function. This gate answers the narrower question that actually has a
 * right answer: does the colour pipeline apply its transfer function exactly
 * once, and what does the display transform cost on top of that.
 *
 * The pixel arithmetic mirrors `RESOLVE_FRAG` in lib/three-color-resolve.ts. It
 * is a CPU port for the same reason `neutralToneMap` is one: the shader cannot
 * be executed in the node test environment, so parity is held by porting the
 * math and pinning the port to the shader source. See that module's tests.
 */

import { deltaECIEDE2000, hexToLab, rgbToHex } from "./color-proximity";
import {
	NEUTRAL_START_COMPRESSION,
	linearToSrgb,
	neutralToneMap,
	srgbToLinear,
	type LinearRgb,
} from "./three-color-resolve";

/** The display transform the renderer is configured with. */
export type DisplayTransform = "none" | "neutral";

/**
 * Where a colour sits relative to the Khronos Neutral operator's two thresholds.
 * The bands are properties of the operator, not taste: it keys its roll-off on
 * the peak linear channel and its black-level offset on the minimum one, so
 * these are the only boundaries at which fidelity behaviour actually changes.
 */
export type LuminanceBand = "shadow" | "midtone" | "highlight";

/** Peak linear channel at or above which Neutral compresses instead of passing through. */
export const HIGHLIGHT_PEAK = NEUTRAL_START_COMPRESSION;

/**
 * Minimum linear channel below which Neutral's black offset tapers toward zero
 * rather than sitting at its full 0.04 (`x < 0.08` in the operator).
 */
export const SHADOW_PEAK = 0.08;

/** Decode a hex albedo to linear light — the value the renderer shades with. */
export function hexToLinear(hex: string): LinearRgb {
	const clean = hex.replace("#", "");
	return [
		srgbToLinear(Number.parseInt(clean.slice(0, 2), 16) / 255),
		srgbToLinear(Number.parseInt(clean.slice(2, 4), 16) / 255),
		srgbToLinear(Number.parseInt(clean.slice(4, 6), 16) / 255),
	];
}

/** Peak linear channel — the quantity Neutral's compression threshold reads. */
export function linearPeak(hex: string): number {
	const [r, g, b] = hexToLinear(hex);
	return Math.max(r, g, b);
}

export function bandFor(hex: string): LuminanceBand {
	const peak = linearPeak(hex);
	if (peak >= HIGHLIGHT_PEAK) return "highlight";
	return peak < SHADOW_PEAK ? "shadow" : "midtone";
}

/**
 * CPU port of `RESOLVE_FRAG`: linear light in, the 8-bit sRGB bytes the export
 * read-back produces out. The rounding is the render target's, not ours — a
 * `UnsignedByteType` target quantises on write, which is why parity can never be
 * better than half a code value and why the tolerances below are not zero.
 */
export function resolveToBytes(linear: LinearRgb): [number, number, number] {
	return [
		Math.round(Math.min(Math.max(linearToSrgb(linear[0]), 0), 1) * 255),
		Math.round(Math.min(Math.max(linearToSrgb(linear[1]), 0), 1) * 255),
		Math.round(Math.min(Math.max(linearToSrgb(linear[2]), 0), 1) * 255),
	];
}

/**
 * ── The published fidelity envelope ───────────────────────────────────────────
 *
 * Every number below is measured, not chosen: an exhaustive round-trip of all
 * 16,777,216 sRGB colours through `measureFidelity`, bucketed by CIE L*, taking
 * the maximum per bucket. Reproduce with `pnpm fidelity:measure`.
 *
 * Banded by L* rather than by the operator's own thresholds because L* is
 * perceptually uniform, so a per-band ceiling means the same thing in each band.
 * The operator's thresholds key on linear peak and linear minimum, which do not
 * order the error — the worst deviation is not at the darkest end but in the
 * L* 20–30 band, and a table keyed on them would report a non-monotone ceiling
 * with no way to read it.
 *
 * Why the error peaks in the middle-dark, which is the whole shape of the table:
 * Neutral subtracts a linear black offset of at most 0.04. Near true black the
 * offset itself tapers away (`x - 6.25x²`), and at high lightness 0.04 linear is
 * a negligible move in L*. In between, the full offset is applied where L* is
 * still steep in linear light — so that is where a fixed linear subtraction
 * costs the most perceptually.
 */
export interface EnvelopeBand {
	/** Inclusive lower bound on CIE L*. */
	minL: number;
	/** Exclusive upper bound on CIE L*, except the last band which includes 100. */
	maxL: number;
	/** Largest ΔE00 measured in this band with no display transform. */
	measuredNone: number;
	/** Largest ΔE00 measured in this band under Khronos PBR Neutral. */
	measuredNeutral: number;
	/** Published ceiling the gate asserts. Measured value, rounded up for stability. */
	toleranceNone: number;
	toleranceNeutral: number;
	/** Whether the Neutral-band deviation is signed off or tracked as a defect. */
	verdict: "exact" | "accepted-compression";
}

/**
 * Exhaustive, contiguous, non-overlapping cover of L* ∈ [0, 100].
 *
 * `toleranceNone` is 0 in every band and that is not a rounding: the sRGB decode
 * and encode are exact inverses at 8-bit precision, verified over all 256 code
 * values. With no display transform the picked hex returns bit-identical. The
 * fidelity promise as originally written is therefore not merely met today, it
 * is met exactly — which is what makes any nonzero reading a real defect rather
 * than a tolerance question.
 */
export const FIDELITY_ENVELOPE: readonly EnvelopeBand[] = [
	{ minL: 0, maxL: 10, measuredNone: 0, measuredNeutral: 6.122, toleranceNone: 0, toleranceNeutral: 6.5, verdict: "accepted-compression" },
	{ minL: 10, maxL: 20, measuredNone: 0, measuredNeutral: 11.2889, toleranceNone: 0, toleranceNeutral: 11.5, verdict: "accepted-compression" },
	{ minL: 20, maxL: 30, measuredNone: 0, measuredNeutral: 11.4575, toleranceNone: 0, toleranceNeutral: 11.75, verdict: "accepted-compression" },
	{ minL: 30, maxL: 50, measuredNone: 0, measuredNeutral: 10.0915, toleranceNone: 0, toleranceNeutral: 10.5, verdict: "accepted-compression" },
	{ minL: 50, maxL: 70, measuredNone: 0, measuredNeutral: 6.2517, toleranceNone: 0, toleranceNeutral: 6.5, verdict: "accepted-compression" },
	{ minL: 70, maxL: 90, measuredNone: 0, measuredNeutral: 4.2187, toleranceNone: 0, toleranceNeutral: 4.5, verdict: "accepted-compression" },
	{ minL: 90, maxL: 100, measuredNone: 0, measuredNeutral: 3.3959, toleranceNone: 0, toleranceNeutral: 3.5, verdict: "accepted-compression" },
];

/**
 * Band containment. Half-open [minL, maxL) so adjacent bands cannot both claim a
 * colour, except the top band which is closed at 100.
 *
 * The top band has to be closed, and by a hair more than 100: the sRGB→XYZ
 * matrix's luminance row sums to 1.0000001 rather than exactly 1, so #FFFFFF
 * computes to L* = 100.0000039. Treating that as out of range would leave the
 * single most-picked colour in the product unbanded. The slack is two orders of
 * magnitude below any real colour difference and cannot swallow a neighbour.
 */
export function bandContains(band: EnvelopeBand, l: number): boolean {
	const isTop = band.maxL === 100;
	return l >= band.minL && (isTop ? l <= 100 + 1e-4 : l < band.maxL);
}

/**
 * The band a colour falls in. Total over L* ∈ [0, 100] by construction — the
 * bands are contiguous and the top one is closed, so every sRGB colour resolves.
 */
export function envelopeBandFor(hex: string): EnvelopeBand {
	const { l } = hexToLab(hex);
	const band = FIDELITY_ENVELOPE.find((b) => bandContains(b, l));
	if (!band) throw new Error(`color-fidelity: no envelope band covers L*=${l} (${hex})`);
	return band;
}

export function toleranceFor(hex: string, transform: DisplayTransform): number {
	const band = envelopeBandFor(hex);
	return transform === "neutral" ? band.toleranceNeutral : band.toleranceNone;
}

export interface FidelityMeasurement {
	/** The hex the operator picked. */
	source: string;
	/** The hex the exported pixel carries. */
	exported: string;
	/** Perceptual distance between them. The number the promise is made in. */
	deltaE: number;
	band: LuminanceBand;
	/** Peak linear channel — why the colour landed in the band it did. */
	peak: number;
	transform: DisplayTransform;
}

/**
 * Round-trip one albedo through the export path and measure the result.
 *
 * `exposure` is the renderer's, applied before the display transform exactly as
 * three does. It defaults to 1 because that is the neutral position; anything
 * else is a lighting choice, and a colour cannot be held to an albedo-parity
 * promise once it is being deliberately brightened or darkened.
 */
export function measureFidelity(
	hex: string,
	transform: DisplayTransform = "none",
	exposure = 1,
): FidelityMeasurement {
	const linear = hexToLinear(hex);
	const shown: LinearRgb =
		transform === "neutral"
			? neutralToneMap(linear, exposure)
			: [linear[0] * exposure, linear[1] * exposure, linear[2] * exposure];
	const [r, g, b] = resolveToBytes(shown);
	const exported = rgbToHex(r, g, b);
	return {
		source: hex.toUpperCase(),
		exported,
		deltaE: deltaECIEDE2000(hex, exported),
		band: bandFor(hex),
		peak: linearPeak(hex),
		transform,
	};
}

/**
 * ── Live-versus-export parity ─────────────────────────────────────────────────
 *
 * The claim that actually matters to a person exporting a plate: the file looks
 * like the screen. This is a different question from albedo fidelity above, and
 * conflating them is what made the promise untestable.
 *
 * The two paths do not share an operator by construction. three chooses tone
 * mapping per render target (`getParameters`, r182): the live canvas renders to
 * `null` and gets `renderer.toneMapping`; the export renders to a plain
 * `WebGLRenderTarget`, which is neither null nor XR, and is therefore forced to
 * `NoToneMapping` whatever the renderer says. `ColorResolvePass` has to reapply
 * the operator itself, and this function measures what happens when it does not.
 *
 * Today both sides are off, so parity is exact — but exact *by coincidence*, and
 * nothing was checking. Swap the renderer to Neutral without swapping the
 * resolve pass and this returns the divergence instead of zero.
 */
export function measureExportParity(
	hex: string,
	rendererTransform: DisplayTransform,
	resolveTransform: DisplayTransform,
	exposure = 1,
): { live: string; exported: string; deltaE: number } {
	const apply = (t: DisplayTransform): LinearRgb => {
		const linear = hexToLinear(hex);
		return t === "neutral"
			? neutralToneMap(linear, exposure)
			: [linear[0] * exposure, linear[1] * exposure, linear[2] * exposure];
	};
	// Live: the renderer's operator, then three's own output encode.
	const [lr, lg, lb] = resolveToBytes(apply(rendererTransform));
	// Export: the render target forced the operator off, so whatever the resolve
	// pass reapplies is the only operator the exported pixel ever sees.
	const [er, eg, eb] = resolveToBytes(apply(resolveTransform));
	const live = rgbToHex(lr, lg, lb);
	const exported = rgbToHex(er, eg, eb);
	return { live, exported, deltaE: deltaECIEDE2000(live, exported) };
}
