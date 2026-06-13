import { describe, expect, it } from "vitest";

import { deriveIpod3DDimensions } from "./ipod-3d-dimensions";
import { IPOD_CLASSIC_MM, IPOD_CLASSIC_PRESETS } from "./ipod-classic-presets";

/**
 * Dimensional QC against Apple's engineering drawing.
 *
 * Source of truth: "iPod classic 160GB / 80GB Dimensional Drawing", Case Design
 * Guidelines for Apple Devices R11, Figures 3-53/3-54 (dimensions in mm). These
 * tests assert the RELATIONSHIPS the drawing fixes — outer shell ↔ aperture ↔
 * wheel — so no future hand-tune can silently push the face off 1:1 again.
 *
 * Tokens are rounded to 0.1px, so ratio assertions carry a small tolerance.
 */

const MM = IPOD_CLASSIC_MM;

// 0.1px rounding on either operand of a ratio ⇒ allow ~0.15% drift.
const RATIO_TOL = 0.0015;

describe.each(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p] as const))(
	"machined face geometry — %s",
	(_id, preset) => {
		const pxPerMm = preset.shell.height / MM.body.height;

		it("keeps the body silhouette at the drawing aspect (61.8 × 103.5)", () => {
			expect(preset.shell.width / preset.shell.height).toBeCloseTo(
				MM.body.width / MM.body.height,
				3,
			);
		});

		it("keeps the screen aperture at 52.0 × 39.5 in body proportion", () => {
			expect(
				Math.abs(preset.screen.frameWidth / preset.shell.width - MM.screen.apertureWidth / MM.body.width),
			).toBeLessThan(RATIO_TOL);
			expect(
				Math.abs(preset.screen.frameHeight / preset.shell.height - MM.screen.apertureHeight / MM.body.height),
			).toBeLessThan(RATIO_TOL);
		});

		it("preserves the EVEN aperture reveal (top margin ≈ side margin ≈ 4.9mm)", () => {
			const sidePx = (preset.shell.width - preset.screen.frameWidth) / 2;
			// The drawing's own asymmetry budget: 4.95 top vs 4.9 sides = 0.05mm.
			expect(Math.abs(preset.shell.paddingTop - sidePx)).toBeLessThan(0.1 * pxPerMm);
		});

		it("seats the wheel centre 30.4mm above the bottom edge at Ø38.0", () => {
			expect(Math.abs(preset.wheel.size - MM.wheel.diameter * pxPerMm)).toBeLessThan(0.2);
			const wheelCenterFromBottom = preset.shell.paddingBottom + preset.wheel.size / 2;
			expect(Math.abs(wheelCenterFromBottom - MM.wheel.centerFromBottom * pxPerMm)).toBeLessThan(0.3);
		});

		it("closes the vertical box model exactly (no leftover-space layout)", () => {
			const stack =
				preset.shell.paddingTop +
				preset.screen.frameHeight +
				preset.shell.controlMarginTop +
				preset.wheel.size +
				preset.shell.paddingBottom;
			expect(Math.abs(stack - preset.shell.height)).toBeLessThan(0.5);
		});

		it("keeps the select button at Ø13.7 in wheel proportion", () => {
			expect(
				Math.abs(preset.wheel.centerSize / preset.wheel.size - MM.wheel.buttonDiameter / MM.wheel.diameter),
			).toBeLessThan(RATIO_TOL);
		});

		it("carries its revision's true chassis depth", () => {
			expect([MM.body.depthThin, MM.body.depthThick]).toContain(preset.depthMm);
		});

		it("projects 1:1 into the 3D scene", () => {
			const dims = deriveIpod3DDimensions(preset);
			expect(dims.width / dims.height).toBeCloseTo(MM.body.width / MM.body.height, 3);
			expect(dims.depth / dims.height).toBeCloseTo(preset.depthMm / MM.body.height, 3);
			expect((dims.wheelOuterR * 2) / dims.width).toBeCloseTo(MM.wheel.diameter / MM.body.width, 2);
			// Wheel centre: 30.4mm above the bottom edge, in scene units.
			const centerFromBottom = dims.height / 2 + dims.wheelCenterY;
			expect(centerFromBottom / dims.height).toBeCloseTo(MM.wheel.centerFromBottom / MM.body.height, 2);
			// Screen aperture centre: 24.7mm below the top edge.
			const screenCenterFromTop = dims.height / 2 - dims.screenCenterY;
			expect(screenCenterFromTop / dims.height).toBeCloseTo(
				MM.screen.apertureCenterFromTop / MM.body.height,
				2,
			);
		});
	},
);

it("the 160GB launch chassis is the thick body; 80/120GB and Late-2009 are thin", () => {
	const byId = new Map(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p.depthMm]));
	expect(byId.get("classic-2007")).toBe(MM.body.depthThick);
	expect(byId.get("classic-2008")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2008-black")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2008-silver")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2009")).toBe(MM.body.depthThin);
});
