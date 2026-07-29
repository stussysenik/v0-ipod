import { describe, expect, it } from "vitest";

import {
	colorManifest,
	DEFAULT_SHELL_COLOR,
	deriveWheelColors,
	IPOD_5G_BLACK,
	IPOD_6G_SILVER,
	relativeLuminance,
	WHEEL_COLORWAY_DARK,
	WHEEL_COLORWAY_LIGHT,
	WHEEL_COLORWAY_MID,
	WHEEL_LABEL_ANCHOR,
	WHEEL_LABEL_CONTRAST_FLOOR,
} from "./color-manifest";
import { contrastRatio } from "./color-engine";
import { deltaE00Undertone, deltaECIEDE2000, hexToLab } from "./color-proximity";

const FINISHES = colorManifest.authenticFinishes.map((f) => ({ label: f.label, hex: f.hex }));

const byId = (id: string) => {
	const finish = colorManifest.authenticFinishes.find((f) => f.id === id);
	if (!finish) throw new Error(`no attested finish "${id}"`);
	return finish;
};

/**
 * The wheel is the same moulded plastic as the shell, recessed. That is a claim
 * with a measurable consequence: it must differ in lightness and must not differ
 * in undertone. Anything that changes the pigment on the way down is a defect,
 * however good it looks.
 */
describe("deriveWheelColors — same pigment, less light", () => {
	const chromaOf = (hex: string) => {
		const { a, b } = hexToLab(hex);
		return Math.hypot(a, b);
	};
	/** Lab hue angle in degrees; meaningless below this chroma, so callers guard. */
	const hueOf = (hex: string) => {
		const { a, b } = hexToLab(hex);
		return (Math.atan2(b, a) * 180) / Math.PI;
	};
	const hueGap = (x: number, y: number) => {
		const d = Math.abs(x - y) % 360;
		return d > 180 ? 360 - d : d;
	};

	/**
	 * Hue is the part that can never give way. Chroma sometimes must: sRGB cannot
	 * hold a near-boundary pigment at every lightness — (PRODUCT)RED sits at
	 * C* = 88.4, and no encodable colour carries that chroma at the wheel's
	 * L* = 36.5. When the pigment does not fit, the derivation reduces chroma and
	 * keeps hue, which is the correct trade and the reason `labToHexClamped`
	 * bisects on C* instead of clamping channels.
	 */
	it.each(FINISHES.filter((f) => chromaOf(f.hex) > 1).map((f) => [f.label, f.hex] as const))(
		"%s (%s) holds the shell's hue through every wheel stop",
		(_label, hex) => {
			const wheel = deriveWheelColors(hex);
			for (const stop of [wheel.gradient.from, wheel.gradient.via, wheel.gradient.to]) {
				expect(hueGap(hueOf(hex), hueOf(stop)), `${hex} -> ${stop}`).toBeLessThan(2);
			}
		},
	);

	it.each(FINISHES.map((f) => [f.label, f.hex] as const))(
		"%s (%s) never invents chroma the shell does not have",
		(_label, hex) => {
			const wheel = deriveWheelColors(hex);
			const source = chromaOf(hex);
			for (const stop of [wheel.gradient.from, wheel.gradient.via, wheel.gradient.to]) {
				// Chroma may be reduced by the gamut; it must never be amplified. The
				// pre-fix HSL derivation amplified it, which is what made light
				// off-neutral shells produce an over-saturated wheel.
				expect(chromaOf(stop), `${hex} -> ${stop}`).toBeLessThanOrEqual(source + 0.5);
			}
		},
	);

	/**
	 * Undertone parity, restricted to stops where the pigment is actually
	 * representable. Gamut-limited stops are covered by the hue and
	 * no-invented-chroma tests above rather than being given a loose ceiling here.
	 */
	it.each(FINISHES.map((f) => [f.label, f.hex] as const))(
		"%s (%s) keeps the shell's undertone wherever sRGB can hold it",
		(_label, hex) => {
			const wheel = deriveWheelColors(hex);
			const source = chromaOf(hex);
			for (const stop of [wheel.gradient.from, wheel.gradient.via, wheel.gradient.to]) {
				const representable = chromaOf(stop) >= source - 0.5;
				if (!representable) continue;
				expect(deltaE00Undertone(hex, stop), `${hex} -> ${stop}`).toBeLessThanOrEqual(1.0);
			}
		},
	);

	/**
	 * The product lets the shell be an arbitrary hex, so the property has to hold
	 * off the manifest too — that is where the original defect lived. Holding HSL
	 * `s` constant across a lightness move preserves a *ratio*, not a chroma, and
	 * light off-neutral colours came out visibly more saturated in the recess.
	 * #F5F5F0 measured ΔE00-undertone 4.86 before the chroma-preserving fix.
	 */
	it("holds the undertone for arbitrary custom colours, not just manifest finishes", () => {
		let worst = { d: 0, hex: "", wheel: "" };
		for (let r = 0; r < 256; r += 15)
			for (let g = 0; g < 256; g += 15)
				for (let b = 0; b < 256; b += 15) {
					const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
					const via = deriveWheelColors(hex).gradient.via;
					const d = deltaE00Undertone(hex, via);
					if (d > worst.d) worst = { d, hex, wheel: via };
				}
		// Residual is concentrated on near-gamut-boundary pigments, where sRGB
		// cannot hold the chroma at the recessed lightness. Hue is preserved
		// throughout; only chroma gives way.
		expect(worst.d, `worst at ${worst.hex} -> ${worst.wheel}`).toBeLessThanOrEqual(2.5);
	});

	it("changes lightness, which is the part that is supposed to change", () => {
		for (const { hex } of FINISHES) {
			const via = deriveWheelColors(hex).gradient.via;
			expect(Math.abs(hexToLab(hex).l - hexToLab(via).l)).toBeGreaterThan(1);
		}
	});

	/** A neutral shell has no pigment to preserve, so its wheel stays exactly neutral. */
	it("keeps neutral shells neutral", () => {
		for (const v of [0x11, 0x40, 0x80, 0xc0, 0xff]) {
			const hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
			const { l, a, b } = hexToLab(deriveWheelColors(hex).gradient.via);
			expect(Math.abs(a), `${hex} a*`).toBeLessThan(0.5);
			expect(Math.abs(b), `${hex} b*`).toBeLessThan(0.5);
			expect(l).toBeGreaterThanOrEqual(0);
		}
	});

	it("orders the gradient: top lit, bottom shadowed", () => {
		for (const { hex } of FINISHES) {
			const { from, via, to } = deriveWheelColors(hex).gradient;
			expect(relativeLuminance(from)).toBeGreaterThanOrEqual(relativeLuminance(via));
			expect(relativeLuminance(via)).toBeGreaterThanOrEqual(relativeLuminance(to));
		}
	});

	it("recesses the centre button below the wheel it sits in", () => {
		for (const { hex } of FINISHES) {
			const w = deriveWheelColors(hex);
			expect(relativeLuminance(w.centerGradient.via)).toBeLessThanOrEqual(
				relativeLuminance(w.gradient.via),
			);
		}
	});
});

/**
 * The manifest's authentic finishes are factual claims about shipped Apple
 * hardware. They carry provenance and must stay distinguishable from one another
 * — two "different" finishes that no one can tell apart are a data error.
 */
/**
 * The wheel label spans the whole gradient, so the contrast floor has to hold
 * across it. Checking the midpoint alone is what let every light case ship
 * illegible over its shadowed lower third — the derived silver wheel passed at
 * 3.09:1 on `via` and failed at 2.79:1 on `to`.
 */
describe("wheel labels — the floor holds across the surface, not at a point", () => {
	const stopsOf = (w: ReturnType<typeof deriveWheelColors>) => [
		w.gradient.from,
		w.gradient.via,
		w.gradient.to,
	];

	it.each(FINISHES.map((f) => [f.label, f.hex] as const))(
		"%s (%s) clears %i:1 on every stop of its derived wheel",
		(_label, hex) => {
			for (const stop of stopsOf(deriveWheelColors(hex))) {
				expect(
					contrastRatio(deriveWheelColors(hex).labelColor, stop),
					`${deriveWheelColors(hex).labelColor} on ${stop}`,
				).toBeGreaterThanOrEqual(WHEEL_LABEL_CONTRAST_FLOOR);
			}
		},
	);

	it("holds for arbitrary custom shells, across the whole cube", () => {
		let worst = { ratio: Number.POSITIVE_INFINITY, hex: "", stop: "", label: "" };
		for (let r = 0; r < 256; r += 15)
			for (let g = 0; g < 256; g += 15)
				for (let b = 0; b < 256; b += 15) {
					const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
					const wheel = deriveWheelColors(hex);
					for (const stop of stopsOf(wheel)) {
						const ratio = contrastRatio(wheel.labelColor, stop);
						if (ratio < worst.ratio) worst = { ratio, hex, stop, label: wheel.labelColor };
					}
				}
		expect(
			worst.ratio,
			`worst: ${worst.label} on ${worst.stop} (shell ${worst.hex})`,
		).toBeGreaterThanOrEqual(WHEEL_LABEL_CONTRAST_FLOOR);
	});

	/**
	 * The static colorways are measured mouldings; only the label is chrome, and
	 * only the label is allowed to move. The moulded stops are pinned here so a
	 * future legibility fix cannot reach past the label and repaint the plastic.
	 */
	it.each([
		["dark", WHEEL_COLORWAY_DARK, ["#1C1C1E", "#202022", "#252527"]],
		["mid", WHEEL_COLORWAY_MID, ["#4A4A4E", "#424246", "#3A3A3E"]],
		["light", WHEEL_COLORWAY_LIGHT, ["#F5F5F7", "#E8E8EA", "#DCDCDC"]],
	] as const)("%s colorway keeps its moulded stops and clears the floor", (_band, cw, stops) => {
		expect([cw.gradient.from, cw.gradient.via, cw.gradient.to]).toEqual([...stops]);
		for (const stop of stops) {
			expect(contrastRatio(cw.labelColor, stop), `${cw.labelColor} on ${stop}`).toBeGreaterThanOrEqual(
				WHEEL_LABEL_CONTRAST_FLOOR,
			);
		}
	});

	/**
	 * A label that already clears the floor keeps its exact recorded tone. This
	 * is the guard on the solver's own failure mode: starting from a single band
	 * anchor rather than the colorway's recorded label rounds the charcoal
	 * wheel's #E0E0E0 silkscreen up to white for a floor it already met at
	 * 6.68:1.
	 */
	it("leaves a passing label exactly where it was recorded", () => {
		expect(WHEEL_COLORWAY_DARK.labelColor.toUpperCase()).toBe("#FFFFFF");
		expect(WHEEL_COLORWAY_MID.labelColor.toUpperCase()).toBe("#E0E0E0");
	});

	/**
	 * The light colorway's anchor is Apple's systemGray, not a hardware
	 * measurement, and it fails the floor the manifest sets for itself. Recorded
	 * as a number so the decision to move it stays visible.
	 */
	it("moves the light colorway's label off its failing systemGray anchor", () => {
		expect(WHEEL_LABEL_ANCHOR.light).toBe("#8E8E93");
		expect(contrastRatio(WHEEL_LABEL_ANCHOR.light, "#DCDCDC")).toBeLessThan(
			WHEEL_LABEL_CONTRAST_FLOOR,
		);
		expect(WHEEL_COLORWAY_LIGHT.labelColor).not.toBe(WHEEL_LABEL_ANCHOR.light);
	});
});

describe("authentic finishes — provenance and distinctness", () => {
	it("every finish carries the provenance a preset needs to be presented as factual", () => {
		for (const f of colorManifest.authenticFinishes) {
			expect(f.id, "id").toBeTruthy();
			expect(f.label, `${f.id} label`).toBeTruthy();
			expect(f.generation, `${f.id} generation`).toBeTruthy();
			expect(f.year, `${f.id} year`).toBeGreaterThanOrEqual(2001);
			expect(f.year, `${f.id} year`).toBeLessThanOrEqual(2014);
			expect(f.notes, `${f.id} notes`).toBeTruthy();
			expect(f.hex, `${f.id} hex`).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});

	it("has no duplicate ids", () => {
		const ids = colorManifest.authenticFinishes.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	/**
	 * Distinct finishes must be distinguishable. Where two share a hex they must
	 * also share a generation story — otherwise the picker offers a choice that
	 * is not a choice.
	 */
	it("finishes with the same hex are flagged, not silently offered twice", () => {
		const byHex = new Map<string, string[]>();
		for (const f of colorManifest.authenticFinishes) {
			const key = f.hex.toUpperCase();
			byHex.set(key, [...(byHex.get(key) ?? []), f.id]);
		}
		for (const [hex, ids] of byHex) {
			expect(ids, `${hex} is shared by ${ids.join(", ")}`).toHaveLength(1);
		}
	});

	it("no two finishes are closer than the just-noticeable difference", () => {
		const finishes = colorManifest.authenticFinishes;
		for (let i = 0; i < finishes.length; i += 1) {
			for (let j = i + 1; j < finishes.length; j += 1) {
				const d = deltaECIEDE2000(finishes[i].hex, finishes[j].hex);
				expect(d, `${finishes[i].id} vs ${finishes[j].id}`).toBeGreaterThan(1);
			}
		}
	});

	/**
	 * A constant whose name asserts a generation must carry that generation's
	 * attested hex. This shipped broken: `IPOD_6G_BLACK` held #1b1818, which is
	 * `black-5g` exactly (ΔE00 0.00) and ΔE00 1.09 from the attested `black-6g`,
	 * while `IPOD_6G_SILVER` held #C8C9CB, ΔE00 2.51 from `silver-6g` and equal
	 * to no attested finish at all. Both are now read from the manifest, so the
	 * only way to reintroduce the drift is to change the attested data itself.
	 */
	it("generation-named constants carry their generation's attested hex", () => {
		expect(IPOD_5G_BLACK).toBe(byId("black-5g").hex);
		expect(IPOD_6G_SILVER).toBe(byId("silver-6g").hex);
	});

	/**
	 * The neutral starting shell is not a finish and must not be mistaken for
	 * one. Pinned above the JND so a future edit cannot quietly walk it onto an
	 * attested value and inherit a provenance it never had.
	 */
	it("the default shell is not close enough to any finish to imply one", () => {
		for (const f of colorManifest.authenticFinishes) {
			expect(
				deltaECIEDE2000(DEFAULT_SHELL_COLOR, f.hex),
				`DEFAULT_SHELL_COLOR vs ${f.id}`,
			).toBeGreaterThan(1);
		}
	});
});
