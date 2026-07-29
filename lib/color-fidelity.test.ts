import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as THREE from "three";

import { colorManifest } from "./color-manifest";
import { deltaECIEDE2000, hexToLab, rgbToHex } from "./color-proximity";
import {
	FIDELITY_ENVELOPE,
	bandContains,
	envelopeBandFor,
	hexToLinear,
	measureExportParity,
	measureFidelity,
	resolveToBytes,
	toleranceFor,
} from "./color-fidelity";
import {
	RESOLVE_TONE_MAPPING,
	linearToSrgb,
	resolveMatchesRenderer,
	srgbToLinear,
} from "./three-color-resolve";

/** Every colour the product ships as a pickable finish or case. */
const MANIFEST_COLORS = [
	...colorManifest.authenticFinishes.map((f) => ({ label: f.label, hex: f.hex })),
	...colorManifest.authenticCaseColors.map((c) => ({ label: c.label, hex: c.hex })),
];

describe("fidelity envelope — the table itself", () => {
	it("covers L* 0–100 with no gap", () => {
		expect(FIDELITY_ENVELOPE[0].minL).toBe(0);
		expect(FIDELITY_ENVELOPE[FIDELITY_ENVELOPE.length - 1].maxL).toBe(100);
		for (let i = 1; i < FIDELITY_ENVELOPE.length; i += 1) {
			expect(FIDELITY_ENVELOPE[i].minL).toBe(FIDELITY_ENVELOPE[i - 1].maxL);
		}
	});

	it("has no overlapping bands", () => {
		for (const band of FIDELITY_ENVELOPE) {
			const matches = FIDELITY_ENVELOPE.filter((b) => b.minL < band.maxL && b.maxL > band.minL);
			expect(matches).toHaveLength(1);
		}
	});

	it("publishes a tolerance at or above what was measured, in every band", () => {
		for (const band of FIDELITY_ENVELOPE) {
			expect(band.toleranceNone).toBeGreaterThanOrEqual(band.measuredNone);
			expect(band.toleranceNeutral).toBeGreaterThanOrEqual(band.measuredNeutral);
		}
	});

	/**
	 * A tolerance far above its measurement is a gate that cannot go red. Half a
	 * ΔE of headroom absorbs float drift without hiding a regression.
	 */
	it("publishes a tolerance no more than 0.5 above what was measured", () => {
		for (const band of FIDELITY_ENVELOPE) {
			expect(band.toleranceNeutral - band.measuredNeutral).toBeLessThanOrEqual(0.5);
		}
	});

	it("resolves every manifest colour to exactly one band", () => {
		for (const { label, hex } of MANIFEST_COLORS) {
			const { l } = hexToLab(hex);
			const matching = FIDELITY_ENVELOPE.filter((b) => bandContains(b, l));
			expect(matching, `${label} ${hex} (L*=${l.toFixed(2)})`).toHaveLength(1);
			expect(envelopeBandFor(hex)).toEqual(matching[0]);
		}
	});

	/**
	 * #FFFFFF computes to L* = 100.0000039, not 100 — the sRGB→XYZ luminance row
	 * sums to 1.0000001. The top band is closed with matching slack; without it
	 * the most-picked colour in the product would fall out of the table entirely.
	 */
	it("bands white, whose L* overshoots 100 by the matrix's own rounding", () => {
		expect(hexToLab("#FFFFFF").l).toBeGreaterThan(100);
		const matching = FIDELITY_ENVELOPE.filter((b) => bandContains(b, hexToLab("#FFFFFF").l));
		expect(matching).toHaveLength(1);
	});

	it("resolves pure white, which sits on the closed upper bound", () => {
		expect(() => envelopeBandFor("#FFFFFF")).not.toThrow();
		expect(envelopeBandFor("#FFFFFF").maxL).toBe(100);
	});

	it("bands are mutually exclusive at every boundary", () => {
		for (const band of FIDELITY_ENVELOPE) {
			for (const l of [band.minL, band.maxL - 1e-9, band.maxL]) {
				if (l > 100) continue;
				expect(FIDELITY_ENVELOPE.filter((b) => bandContains(b, l)).length, `L*=${l}`).toBe(1);
			}
		}
	});

	/** Sampled across the cube, not just the manifest: the table must be total. */
	it("resolves every colour on a coarse sweep of the whole sRGB cube", () => {
		for (let r = 0; r < 256; r += 37)
			for (let g = 0; g < 256; g += 37)
				for (let b = 0; b < 256; b += 37) {
					const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
					expect(envelopeBandFor(hex)).toBeDefined();
				}
	});
});

describe("export parity gate — the picked hex survives to the exported pixel", () => {
	/**
	 * The headline claim, and it is exact rather than merely tight: the sRGB
	 * decode and encode are inverse at 8-bit precision, so with the renderer's
	 * current NoToneMapping the exported byte equals the picked byte.
	 */
	it.each(MANIFEST_COLORS.map((c) => [c.label, c.hex] as const))(
		"%s (%s) round-trips exactly with no display transform",
		(_label, hex) => {
			const m = measureFidelity(hex, "none");
			expect(m.exported.toLowerCase()).toBe(hex.toLowerCase());
			expect(m.deltaE).toBe(0);
			expect(m.deltaE).toBeLessThanOrEqual(toleranceFor(hex, "none"));
		},
	);

	it("round-trips exactly for every one of the 256 channel codes", () => {
		// The chain is channel-independent, so exhaustiveness over one channel is
		// exhaustiveness over all 16,777,216 colours.
		for (let v = 0; v < 256; v += 1) {
			const round = Math.round(Math.min(Math.max(linearToSrgb(srgbToLinear(v / 255)), 0), 1) * 255);
			expect(round, `channel code ${v}`).toBe(v);
		}
	});

	it.each(MANIFEST_COLORS.map((c) => [c.label, c.hex] as const))(
		"%s (%s) stays inside its published band tolerance under Neutral",
		(_label, hex) => {
			const m = measureFidelity(hex, "neutral");
			expect(m.deltaE).toBeLessThanOrEqual(toleranceFor(hex, "neutral"));
		},
	);

	/**
	 * The measured envelope is a ceiling on the whole gamut, not a description of
	 * ten finishes. A coarse sweep re-checks that claim cheaply; the exhaustive
	 * run that produced the numbers lives in `scripts/measure-fidelity.ts`.
	 */
	it("holds the published ceiling across a sweep of the sRGB cube", () => {
		for (let r = 0; r < 256; r += 17)
			for (let g = 0; g < 256; g += 17)
				for (let b = 0; b < 256; b += 17) {
					const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
					expect(measureFidelity(hex, "none").deltaE).toBe(0);
					expect(measureFidelity(hex, "neutral").deltaE).toBeLessThanOrEqual(
						toleranceFor(hex, "neutral"),
					);
				}
	});
});

/**
 * The regressions the gate exists to catch. Without these the gate above is
 * unfalsifiable — it would pass just as happily against a pipeline that had
 * quietly stopped doing anything.
 */
describe("export parity gate — negative controls", () => {
	const brokenRoundTrip = (hex: string, mode: "missing" | "doubled") => {
		const linear = hexToLinear(hex);
		const encoded = linear.map((c) =>
			mode === "missing" ? c : linearToSrgb(linearToSrgb(c)),
		) as [number, number, number];
		const [r, g, b] = encoded.map((c) => Math.round(Math.min(Math.max(c, 0), 1) * 255));
		return deltaECIEDE2000(hex, rgbToHex(r, g, b));
	};

	/**
	 * #FFFFFF and #000000 are fixed points of the sRGB transfer function — 0 and 1
	 * map to themselves — so a finish built entirely from those codes returns
	 * unchanged whether the transfer function runs once, zero times or twice. A
	 * negative control written on white is vacuous. This pins that fact so nobody
	 * later "simplifies" the control set down to white and gets a green gate for a
	 * dead pipeline.
	 */
	it("identifies the transfer function's fixed points, which cannot detect anything", () => {
		const fixedCodes = [...Array(256).keys()].filter(
			(v) => Math.round(linearToSrgb(v / 255) * 255) === v,
		);
		expect(fixedCodes).toEqual([0, 255]);
		expect(brokenRoundTrip("#FFFFFF", "missing")).toBe(0);
		expect(brokenRoundTrip("#FFFFFF", "doubled")).toBe(0);
		expect(brokenRoundTrip("#000000", "missing")).toBe(0);
	});

	const DETECTABLE = MANIFEST_COLORS.filter(
		({ hex }) => !/^#(?:(?:00|ff)){3}$/i.test(hex.replace("#", "").padStart(6, "0")) && hex.toLowerCase() !== "#ffffff",
	);

	it.each(DETECTABLE.map((c) => [c.label, c.hex] as const))(
		"%s (%s) goes red when the transfer function is dropped",
		(_label, hex) => {
			expect(brokenRoundTrip(hex, "missing")).toBeGreaterThan(toleranceFor(hex, "none"));
			expect(brokenRoundTrip(hex, "missing")).toBeGreaterThan(1);
		},
	);

	it.each(DETECTABLE.map((c) => [c.label, c.hex] as const))(
		"%s (%s) goes red when the transfer function is applied twice",
		(_label, hex) => {
			expect(brokenRoundTrip(hex, "doubled")).toBeGreaterThan(toleranceFor(hex, "none"));
		},
	);

	it("the two failure modes move the pixel in opposite directions", () => {
		// Dropping the encode leaves linear light in an sRGB buffer: too dark.
		// Applying it twice lifts everything: too light. A gate that only checked
		// magnitude could not tell these apart, and they have different causes.
		const hex = "#C0C0C0";
		const linear = hexToLinear(hex);
		const correct = resolveToBytes(linear)[0];
		const missing = Math.round(linear[0] * 255);
		const doubled = Math.round(linearToSrgb(linearToSrgb(linear[0])) * 255);
		expect(missing).toBeLessThan(correct);
		expect(doubled).toBeGreaterThan(correct);
	});
});

/**
 * ── The defect this change exists to surface ──────────────────────────────────
 *
 * three chooses tone mapping per render target. The live canvas renders to null
 * and receives `renderer.toneMapping`; the export renders to a plain
 * WebGLRenderTarget and is forced to NoToneMapping. So the export path only
 * matches the screen if `ColorResolvePass` reapplies the renderer's operator.
 *
 * Today both are off and parity is exact — by coincidence, not by construction.
 */
describe("live-versus-export parity under a display transform", () => {
	it("is exact when the renderer and the resolve pass agree", () => {
		for (const { hex } of MANIFEST_COLORS) {
			expect(measureExportParity(hex, "none", "none").deltaE).toBe(0);
			expect(measureExportParity(hex, "neutral", "neutral").deltaE).toBe(0);
		}
	});

	it("diverges by the full envelope when the renderer tone-maps and the export does not", () => {
		const divergences = MANIFEST_COLORS.map(({ hex }) => measureExportParity(hex, "neutral", "none").deltaE);
		// Not a hypothetical: this is what shipping NeutralToneMapping without
		// touching the resolve pass would do to every dark finish.
		expect(Math.max(...divergences)).toBeGreaterThan(9);
	});

	it("reports a mismatch whenever the renderer's operator has no port in the resolve pass", () => {
		expect(resolveMatchesRenderer(THREE.NoToneMapping, "none")).toBe(true);
		expect(resolveMatchesRenderer(THREE.NeutralToneMapping, "neutral")).toBe(true);
		expect(resolveMatchesRenderer(THREE.NeutralToneMapping, "none")).toBe(false);
		expect(resolveMatchesRenderer(THREE.NoToneMapping, "neutral")).toBe(false);
		for (const unsupported of [
			THREE.ACESFilmicToneMapping,
			THREE.AgXToneMapping,
			THREE.ReinhardToneMapping,
			THREE.CineonToneMapping,
		]) {
			expect(resolveMatchesRenderer(unsupported, "none")).toBe(false);
			expect(resolveMatchesRenderer(unsupported, "neutral")).toBe(false);
		}
	});

	/**
	 * Structural, not numeric: the pixel math is covered above, so this only has to
	 * establish that the shipped renderer configuration and the shipped resolve
	 * pass are the pair that was measured. Changing either alone turns this red.
	 */
	it("the shipped renderer and the shipped resolve pass are a matched pair", () => {
		const source = readFileSync(resolve(__dirname, "../components/three/three-d-ipod.tsx"), "utf8");
		const configured = source.match(/toneMapping:\s*THREE\.(\w+)/);
		expect(configured, "renderer tone mapping not found in three-d-ipod.tsx").not.toBeNull();
		const rendererToneMapping = THREE[configured![1] as keyof typeof THREE] as number;
		expect(resolveMatchesRenderer(rendererToneMapping, RESOLVE_TONE_MAPPING)).toBe(true);
	});

	it("the capture path resolves through ColorResolvePass rather than reading the target raw", () => {
		const source = readFileSync(resolve(__dirname, "../components/three/three-d-ipod.tsx"), "utf8");
		expect(source).toContain("colorResolveRef.current!.resolve(");
		// A raw read-back of the linear target is the bug the resolve pass exists to
		// prevent; it must not reappear alongside it.
		expect(source).not.toMatch(/gl\.readRenderTargetPixels\(/);
	});
});
