import { describe, expect, it } from "vitest";

import { deriveWheelColors } from "./color-manifest";
import { deriveIpod3DDimensions } from "./ipod-3d-dimensions";
import {
	IPOD_CLASSIC_MM,
	IPOD_CLASSIC_PRESETS,
	WHEEL_LABEL_SEAT,
	wheelLabelSeatPx,
} from "./ipod-classic-presets";

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

/*
 * ── Wheel label placement QC ─────────────────────────────────────────────────
 *
 * The four printed labels (MENU / ⏮ / ⏭ / ⏯) are part of the machined assembly,
 * not the software: on the real device they are screen-printed at one radial
 * distance, concentric with the wheel. These tests assert that relationship the
 * way a CMM would — seat radius, in-band clearance, inter-label separation —
 * so the print can never crowd the hub or the rim again (the scale(0.8)
 * regression), and so the symmetry survives any camera angle by construction.
 *
 * Label extents mirror the render constants in `ipod-click-wheel.tsx`
 * (side icon aspect 1.4:1, play/pause 1.5:1, MENU set in labelFontSize caps).
 * If those change, update the mirrors here in the same commit.
 */
describe.each(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p] as const))(
	"wheel label placement QC — %s",
	(_id, preset) => {
		const wheel = preset.wheel;
		const R = wheel.size / 2;
		const buttonR = wheel.centerSize / 2;
		/** Radial width of the touch annulus (outer rim → centre-button edge). */
		const band = R - buttonR;
		const seat = wheelLabelSeatPx(wheel);

		// Render mirrors from ipod-click-wheel.tsx.
		const sideIconW = wheel.sideIconSize * 1.4;
		const sideIconH = wheel.sideIconSize;
		const ppIconH = wheel.playPauseIconSize;
		const trackingPx = parseFloat(wheel.labelTracking) * wheel.labelFontSize;
		// Conservative (wide) advance estimate for bold Helvetica caps "MENU".
		const menuTextW = wheel.labelFontSize * 0.8 * 4 + trackingPx * 4;
		const menuTextH = wheel.labelFontSize;

		it("seats every label on the annulus midline — one concentric ring", () => {
			// Equidistance across all four labels holds by construction (one shared
			// seat); this pins the seat itself to the documented mid-band position.
			expect(WHEEL_LABEL_SEAT).toBe(0.5);
			expect(Math.abs(seat - band / 2)).toBeLessThan(0.1);
		});

		it("keeps every label inside the band with machining clearance to rim AND button", () => {
			const MIN_CLEARANCE = 4; // px — print never kisses an edge
			// Radial half-extent of each label along its own axis.
			const radialHalf = {
				menu: menuTextH / 2,
				side: sideIconW / 2, // sides extend radially along x
				playPause: ppIconH / 2,
			};
			for (const half of Object.values(radialHalf)) {
				expect(seat - half).toBeGreaterThanOrEqual(MIN_CLEARANCE); // to the rim
				expect(band - seat - half).toBeGreaterThanOrEqual(MIN_CLEARANCE); // to the button
			}
		});

		it("keeps the printed labels inside the wheel disc", () => {
			// Farthest printed corner of the MENU text from the wheel centre.
			const menuCorner = Math.hypot(menuTextW / 2, R - seat + menuTextH / 2);
			expect(menuCorner).toBeLessThan(R - 2);
			// Farthest corner of a side icon.
			const sideCorner = Math.hypot(R - seat + sideIconW / 2, sideIconH / 2);
			expect(sideCorner).toBeLessThan(R - 2);
		});

		it("separates neighbouring labels — no crowding between MENU and the skips", () => {
			const MIN_GAP = 12; // px between printed bounding boxes
			const c = R - seat; // distance of every label centre from the wheel centre
			// MENU box (top) vs prev box (left): axis-aligned, disjoint on both axes,
			// so the true gap is the distance between nearest corners.
			const dx = c - sideIconW / 2 - menuTextW / 2;
			const dy = c - menuTextH / 2 - sideIconH / 2;
			expect(dx).toBeGreaterThan(0);
			expect(dy).toBeGreaterThan(0);
			expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(MIN_GAP);
		});

		it("renders the interactive overlay 1:1 with the 3D wheel mesh", () => {
			const dims = deriveIpod3DDimensions(preset);
			expect(dims.wheelHtmlPx.width * dims.unit).toBeCloseTo(dims.wheelOuterR * 2, 5);
			expect(dims.wheelHtmlPx.height * dims.unit).toBeCloseTo(dims.wheelOuterR * 2, 5);
		});
	},
);

/*
 * ── Label ink legibility QC ──────────────────────────────────────────────────
 *
 * "Light evidence": the print must stay readable over the ring it sits on, for
 * the colourway every preset actually ships. Mirrors the component's ink path —
 * `deriveWheelColors(ring).labelColor` at the flat print alpha — and checks
 * WCAG contrast of the *blended* ink against the ring tone. Dark wheels carry
 * the legibility burden (white print, strong floor); light wheels are the
 * authentic subtle grey screen-print, held above a perceptibility floor.
 */
describe("wheel label ink legibility", () => {
	const srgbToLinear = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	const hexChannels = (hex: string): [number, number, number] => {
		const h = hex.replace("#", "");
		return [
			parseInt(h.slice(0, 2), 16),
			parseInt(h.slice(2, 4), 16),
			parseInt(h.slice(4, 6), 16),
		];
	};
	const luminance = (hex: string) => {
		const [r, g, b] = hexChannels(hex).map(srgbToLinear);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const contrast = (a: string, b: string) => {
		const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (hi + 0.05) / (lo + 0.05);
	};
	/** Composite the ink over the ring at the flat-mode print alpha. */
	const blend = (ink: string, ring: string, alpha: number) => {
		const i = hexChannels(ink);
		const r = hexChannels(ring);
		const mixed = i.map((c, n) => Math.round(c * alpha + r[n] * (1 - alpha)));
		return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
	};
	const FLAT_MENU_ALPHA = 0.6; // mirrors LABEL_OPACITY.flat.menu

	it.each(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p] as const))(
		"%s — shipped colourway keeps the print legible",
		(_id, preset) => {
			// The ring tone and ink exactly as the component resolves them.
			const ring =
				preset.defaultRingColor ?? deriveWheelColors(preset.defaultShellColor).gradient.via;
			const ink = preset.defaultRingColor
				? deriveWheelColors(preset.defaultRingColor).labelColor
				: deriveWheelColors(preset.defaultShellColor).labelColor;
			const printed = blend(ink, ring, FLAT_MENU_ALPHA);
			const ratio = contrast(printed, ring);

			if (luminance(ring) < 0.18) {
				// Dark wheel: the print is the only affordance — hold WCAG-large floor.
				expect(ratio).toBeGreaterThanOrEqual(4.0);
			} else {
				// Light wheel: authentic subtle grey print, but never invisible.
				expect(ratio).toBeGreaterThanOrEqual(1.5);
			}
		},
	);
});

it("the 160GB launch chassis is the thick body; 80/120GB and Late-2009 are thin", () => {
	const byId = new Map(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p.depthMm]));
	expect(byId.get("classic-2007")).toBe(MM.body.depthThick);
	expect(byId.get("classic-2008")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2008-black")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2008-silver")).toBe(MM.body.depthThin);
	expect(byId.get("classic-2009")).toBe(MM.body.depthThin);
});

/*
 * ── Chassis edge ports QC ────────────────────────────────────────────────────
 *
 * Source: Fig 3-53's top/bottom edge views (verified at 600 DPI). The ports are
 * recesses machined INTO the chassis — these tests pin their seats to the
 * drawing and assert the flush invariant that killed the first attempt (a jack
 * torus proud of the silhouette, lessons 2026-06-07).
 *
 * Mirrored render constants from `three-d-ipod.tsx` (update in the same commit):
 * bodyFilletMax 0.05 / bodyFilletDepthRatio 0.1 (extrude bevel), portRecessLift
 * 0.002 world units.
 */
describe.each(IPOD_CLASSIC_PRESETS.map((p) => [p.id, p] as const))(
	"chassis edge ports QC — %s",
	(_id, preset) => {
		const dims = deriveIpod3DDimensions(preset);
		const { jack, hold, dock } = dims.ports;
		const mm = dims.mmToWorld;
		const halfW = dims.width / 2;
		// width is px-derived (0.1px rounding) while ports are pure-mm — small slack.
		const SEAT_TOL = 0.25 * mm; // 0.25mm

		it("seats the jack bore Ø3.5 with its centre 8.1mm from the left edge", () => {
			expect(Math.abs(jack.centerX + halfW - MM.top.headphoneJack.centerFromLeft * mm)).toBeLessThan(SEAT_TOL);
			expect(jack.radius).toBeCloseTo(((MM.top.headphoneJack.boreDiameter / 2) * mm), 5);
		});

		it("keeps the jack rim inside the silhouette (corner-arc dip is sub-hairline)", () => {
			// Distance from the left edge to the bore's nearest rim, in mm.
			const rimFromEdgeMm = MM.top.headphoneJack.centerFromLeft - MM.top.headphoneJack.boreDiameter / 2;
			const r = MM.body.cornerRadius;
			// How far the top outline has fallen away from flat at that distance.
			const intoArc = Math.max(0, r - rimFromEdgeMm);
			const dip = r - Math.sqrt(r * r - intoArc * intoArc);
			expect(dip).toBeLessThan(0.01); // <0.01mm — flush to any machining tolerance
		});

		it("spans the hold-switch slot 9.5→20.2mm from the right edge at a 1.8mm slit", () => {
			const near = MM.top.holdSwitch.slotNearFromRight;
			const far = MM.top.holdSwitch.slotFarFromRight;
			expect(hold.length).toBeCloseTo((far - near) * mm, 5);
			expect(hold.width).toBeCloseTo(MM.top.holdSwitch.slotWidth * mm, 5);
			const centerFromRight = halfW - hold.centerX;
			expect(Math.abs(centerFromRight - ((near + far) / 2) * mm)).toBeLessThan(SEAT_TOL);
			// Entirely on the straight band — clear of the 6.4 corner arc.
			expect(near).toBeGreaterThan(MM.body.cornerRadius);
			expect(MM.body.width - far).toBeGreaterThan(MM.body.cornerRadius);
		});

		it("centres the 21.8 × 2.8 dock opening on the width centreline, clear of the corners", () => {
			expect(dock.length).toBeCloseTo(MM.bottom.dockConnector.width * mm, 5);
			expect(dock.width).toBeCloseTo(MM.bottom.dockConnector.height * mm, 5);
			const endFromEdgeMm = (MM.body.width - MM.bottom.dockConnector.width) / 2;
			expect(endFromEdgeMm).toBeGreaterThan(MM.body.cornerRadius);
		});

		it("fits every port inside the wall's flat band on this chassis depth", () => {
			// The extrude bevel consumes bevelT from each end of the depth.
			const bevelT = Math.min(0.05, dims.depth * 0.1);
			const flatBand = dims.depth - 2 * bevelT;
			expect(jack.radius * 2).toBeLessThan(flatBand);
			expect(hold.width).toBeLessThan(flatBand);
			expect(dock.width).toBeLessThan(flatBand);
		});

		it("holds the flush invariant — recess lift is z-fight clearance, not a reveal", () => {
			const PORT_RECESS_LIFT = 0.002; // world units, mirrored from MECHANICAL
			expect(PORT_RECESS_LIFT / mm).toBeLessThan(0.05); // < 0.05mm proud of the wall
		});
	},
);
