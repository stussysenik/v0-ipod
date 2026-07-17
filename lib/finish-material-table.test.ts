import { describe, expect, it } from "vitest";

import { AUTHENTIC_CASE_COLORS, colorManifest, relativeLuminance } from "./color-manifest";
import {
	darkBoost,
	ENV_RESPONSE_FLOOR,
	resolveFinishMaterial,
	resolveFinishTable,
	SEPARATION_EPSILON,
	SEPARATION_ORDER,
} from "./finish-material-table";

/*
 * ── Finish material response — the "black isn't a void" evidence (§3.1) ──────────
 *
 * The face, ring and wheel are dyed dielectric plastic: visible sheen is
 * albedo × environment × envMapIntensity. On a dark finish the albedo term
 * collapses, so the OLD flat 0.16/0.18 env constants returned almost nothing and
 * the click wheel disappeared into the housing. This table is finish-aware; the
 * two spec invariants are pure data, so they are proven headlessly here:
 *
 *   1. Floor  — every part, every manifest finish, clears ENV_RESPONSE_FLOOR.
 *   2. Separation — wheel ‹ ring ‹ face by ≥ SEPARATION_EPSILON at every luminance,
 *      so the wheel stays legible as its own part even at #111.
 */

// The full colour corpus the device can be finished in: the authentic finishes and
// case colours from the manifest, plus the pathological extremes (#000/#fff/#111).
const CORPUS: string[] = [
	...colorManifest.authenticFinishes.map((f) => f.hex),
	...AUTHENTIC_CASE_COLORS.map((c) => c.hex),
	"#000000",
	"#111111",
	"#ffffff",
];

const SPECULAR_PARTS = ["face", "ring", "wheel"] as const;

describe("dark boost ramp", () => {
	it("is 0 at/above the reference luminance and 1 at true black, monotone between", () => {
		expect(darkBoost(relativeLuminance("#ffffff"))).toBe(0);
		expect(darkBoost(relativeLuminance("#000000"))).toBe(1);
		// Monotone non-increasing in luminance: darker → not-less boost.
		const ramp = ["#ffffff", "#888888", "#333333", "#111111", "#000000"].map((h) =>
			darkBoost(relativeLuminance(h)),
		);
		for (let i = 1; i < ramp.length; i++) expect(ramp[i]).toBeGreaterThanOrEqual(ramp[i - 1]);
	});
});

describe("env-response floor (spec: every finish clears the floor)", () => {
	it.each(CORPUS)("%s — every part returns env response ≥ the floor", (hex) => {
		const table = resolveFinishTable(hex);
		for (const part of ["face", "ring", "wheel", "glyphs"] as const) {
			expect(table[part].envMapIntensity).toBeGreaterThanOrEqual(ENV_RESPONSE_FLOOR);
		}
	});

	it("darkest finishes are lifted well clear of the floor — not a hair over", () => {
		// This is the crux of "black describes its form": a black wheel must catch real env.
		const black = resolveFinishTable("#111111");
		for (const part of SPECULAR_PARTS) {
			expect(black[part].envMapIntensity).toBeGreaterThan(ENV_RESPONSE_FLOOR + 0.2);
		}
		// And a dark finish returns strictly more env than a light one (the finish-aware lift).
		const silver = resolveFinishTable("#c8c9cb");
		for (const part of SPECULAR_PARTS) {
			expect(black[part].envMapIntensity).toBeGreaterThan(silver[part].envMapIntensity);
		}
	});
});

describe("specular separation (spec: wheel/face/ring stay separable on dark finishes)", () => {
	it.each(CORPUS)("%s — wheel ‹ ring ‹ face by ≥ epsilon (roughness signature)", (hex) => {
		const table = resolveFinishTable(hex);
		for (let i = 1; i < SEPARATION_ORDER.length; i++) {
			const slicker = table[SEPARATION_ORDER[i - 1]].roughness;
			const rougher = table[SEPARATION_ORDER[i]].roughness;
			expect(rougher - slicker).toBeGreaterThanOrEqual(SEPARATION_EPSILON);
		}
	});

	it("black-on-black keeps the wheel a distinct part from the face", () => {
		// Wheel and face at the same near-black colour still read apart by material alone.
		const t = resolveFinishTable("#111111");
		expect(t.face.roughness - t.wheel.roughness).toBeGreaterThanOrEqual(2 * SEPARATION_EPSILON);
		// The wheel also catches more env than the face, doubling the separation cue.
		expect(t.wheel.envMapIntensity).toBeGreaterThan(t.face.envMapIntensity);
	});
});

describe("monotonic response across the finish range", () => {
	// A descending luminance sweep: env must rise (non-decreasing) and roughness must
	// fall (non-increasing) as the finish darkens — a smooth table with no reversals.
	const SWEEP = ["#ffffff", "#c8c9cb", "#888888", "#4a4a4e", "#1b1818", "#111111", "#000000"];

	it.each(SPECULAR_PARTS)("%s — env is monotone up, roughness monotone down as finish darkens", (part) => {
		const rows = SWEEP.map((hex) => resolveFinishMaterial(hex, part));
		for (let i = 1; i < rows.length; i++) {
			expect(rows[i].envMapIntensity).toBeGreaterThanOrEqual(rows[i - 1].envMapIntensity);
			expect(rows[i].roughness).toBeLessThanOrEqual(rows[i - 1].roughness);
		}
	});

	it("roughness never drops below a physical floor (no perfect mirror plastic)", () => {
		for (const part of SPECULAR_PARTS) {
			expect(resolveFinishMaterial("#000000", part).roughness).toBeGreaterThanOrEqual(0.02);
		}
	});
});
