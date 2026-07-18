// iPod Classic 6th Generation Colors (from reference image)
// Silver: Light anodized aluminum with light wheel
// Black: Deep black with dark wheel
import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR } from "./color-manifest";

import type { IpodHardwarePresetId } from "@/types/ipod-state";

// ─── Mechanical Ground Truth (millimetres) ──────────────────────────────────────────
//
// Every geometric token below is DERIVED from Apple's own engineering drawing of the
// device — "iPod classic 160GB / 80GB Dimensional Drawing", Case Design Guidelines for
// Apple Devices, Release R11, Figures 3-53/3-54 (Apple Computer, Inc. title block,
// dimensions in millimetres). The two figures carry identical face geometry; only body
// depth differs between the thick 160GB (13.5mm) and thin 80/120GB (10.5mm) chassis.
//
// Printed dimensions read straight off the drawing:
//   body        61.8 × 103.5, face plate step 0.4 proud of the steel rim
//   screen      aperture 52.0 × 39.5, aperture CENTRE 24.7 below the top edge
//   click wheel Ø38.0, centre 30.4 above the bottom edge, on the width centreline (30.9)
//   button      Ø13.7, concentric with the wheel
//
// Values Apple leaves undimensioned were measured off the drawing's own outline
// (the sheet is drawn to scale; 8.18 px/mm at our render): body corner radius 6.4
// (circle-fit residual < 0.1mm), screen aperture corner radius ≈ 1.0 — nearly crisp.
//
// The relationship that makes the face read "Apple": the screen aperture reveal is
// EQUAL on top and sides — (61.8 − 52.0)/2 = 4.9 ≈ 24.7 − 39.5/2 = 4.95. Any drift in
// one token breaks that symmetry, which is exactly what reads as "not quite real".
export const IPOD_CLASSIC_MM = {
	body: { width: 61.8, height: 103.5, cornerRadius: 6.4, depthThin: 10.5, depthThick: 13.5, faceStep: 0.4 },
	screen: { apertureWidth: 52.0, apertureHeight: 39.5, apertureCenterFromTop: 24.7, cornerRadius: 3.0 },
	wheel: { diameter: 38.0, buttonDiameter: 13.7, centerFromBottom: 30.4 },
	// ── Chassis edge features (Fig 3-53 top/bottom edge views, read at 600 DPI) ──
	// All are machined INTO the steel — recessed openings, never proud of the
	// silhouette (an earlier jack torus poked above the outline and was subtracted).
	// Cross-depth seats are near-centred on both chassis depths; the drawing's own
	// cross-depth callouts (5.9 jack / 7.5+4.2 hold / 5.4 dock, thick body) sit
	// within 0.9mm of centre, so the 3D model centres them — invisible at render
	// scale and valid for both the 10.5 and 13.5 bodies.
	top: {
		// 3.5mm TRS jack: drawing pins the bore centre 8.1 from the left edge; the
		// bore itself is undimensioned (it IS the plug standard, Ø3.5).
		headphoneJack: { centerFromLeft: 8.1, boreDiameter: 3.5 },
		// Hold-switch slot: feature lines at 20.2 / 9.5 from the right edge bound a
		// 10.7-long slot; cross-depth callouts 7.5 + 4.2 on the 13.5 body leave a
		// 1.8 slit. The slider nub rides inside it (drawing shows it at the inboard
		// end — the unlocked rest position).
		holdSwitch: { slotNearFromRight: 9.5, slotFarFromRight: 20.2, slotWidth: 1.8 },
	},
	bottom: {
		// 30-pin dock: opening 21.8 × 2.8, centred on the width centreline (30.9).
		dockConnector: { width: 21.8, height: 2.8 },
	},
} as const;

/** Round to 0.1px — keeps drawing precision without noisy long fractions in the tokens. */
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Project the millimetre ground truth into preset pixel tokens at a given shell height.
 *
 * This is the single mm→px bridge for the FACE GEOMETRY (shell outline, screen
 * aperture, wheel circles, and the box-model seats between them). UI-content tokens
 * (fonts, status bar, artwork columns) stay hand-tuned per preset — they describe the
 * software, not the machine. Derivation, not transcription: a preset cannot drift from
 * the drawing because its geometry is computed from it.
 */
function machinedGeometry(shellHeightPx: number) {
	const mm = IPOD_CLASSIC_MM;
	const px = (v: number) => (v * shellHeightPx) / mm.body.height;

	// The aperture's even reveal: 4.95 top, 4.9 sides (see ground-truth note above).
	const apertureTopMm = mm.screen.apertureCenterFromTop - mm.screen.apertureHeight / 2;
	const sideRevealMm = (mm.body.width - mm.screen.apertureWidth) / 2;
	// Wheel seat: Ø38 disc, centre 30.4 up from the bottom edge.
	const wheelTopFromTopMm = mm.body.height - mm.wheel.centerFromBottom - mm.wheel.diameter / 2;
	const apertureBottomMm = apertureTopMm + mm.screen.apertureHeight;

	const radius = r1(px(mm.body.cornerRadius));
	const outerRadius = r1(px(mm.screen.cornerRadius));
	return {
		shell: {
			width: r1(px(mm.body.width)),
			height: shellHeightPx,
			radius,
			innerRadius: r1(radius - 1),
			paddingX: r1(px(sideRevealMm)),
			paddingTop: r1(px(apertureTopMm)),
			paddingBottom: r1(px(mm.wheel.centerFromBottom - mm.wheel.diameter / 2)),
			controlMarginTop: r1(px(wheelTopFromTopMm - apertureBottomMm)),
		},
		screen: {
			frameWidth: r1(px(mm.screen.apertureWidth)),
			frameHeight: r1(px(mm.screen.apertureHeight)),
			outerRadius,
			// Softly-rounded screen corners (designer call — the machined 1mm radius
			// read as a hard, sharp corner). The white content frame MUST share the
			// aperture's radius exactly: a smaller (sharper) content radius made the
			// white corner poke out past the rounded bezel; a larger one would let a
			// dark bezel arc peek through. Equal = the content tucks flush, no sharp
			// corner, no dark seam.
			innerRadius: outerRadius,
		},
		wheel: {
			size: r1(px(mm.wheel.diameter)),
			centerSize: r1(px(mm.wheel.buttonDiameter)),
		},
	};
}

// The canonical 6G face at the two shell scales the presets use.
const GEOMETRY_580 = machinedGeometry(580);
const GEOMETRY_620 = machinedGeometry(620);

interface ShellPresetTokens {
	width: number;
	height: number;
	radius: number;
	innerRadius: number;
	paddingX: number;
	paddingTop: number;
	paddingBottom: number;
	controlMarginTop: number;
}

interface ScreenPresetTokens {
	frameWidth: number;
	frameHeight: number;
	outerRadius: number;
	innerRadius: number;
	statusBarHeight: number;
	statusBarPaddingX: number;
	contentHeight: number;
	contentPaddingX: number;
	contentPaddingTop: number;
	contentGapX: number;
	artworkSize: number;
	artworkColumnWidth: number;
	progressHeight: number;
	progressBottom: number;
	progressPaddingX: number;
	progressPaddingTop: number;
	titleFontSize: number;
	artistFontSize: number;
	albumFontSize: number;
	metaFontSize: number;
	titleMarginBottom: number;
	artistMarginBottom: number;
	albumMarginBottom: number;
	metaMarginBottom: number;
}

interface WheelPresetTokens {
	size: number;
	centerSize: number;
	labelFontSize: number;
	labelTracking: string;
	sideIconSize: number;
	playPauseIconSize: number;
}

/**
 * Where the printed labels sit in the touch annulus, as a fraction of the band
 * from the outer rim (0 = on the rim, 1 = on the centre-button edge). The print
 * is seated on the band's radial midline: equidistant from rim and button, so
 * MENU / ⏮ / ⏭ / ⏯ form one concentric ring — a relationship that holds from
 * any camera angle, which hand-tuned per-edge insets never did.
 */
export const WHEEL_LABEL_SEAT = 0.5;

/**
 * Distance (px) from the wheel's outer rim to a label's optical centre.
 *
 * Derived, not transcribed: the seat follows the same Ø38.0 / Ø13.7 machined
 * circles the wheel itself is projected from, so label placement can no more
 * drift from the drawing than the wheel can. All four labels share this one
 * value — radial symmetry by construction.
 */
export function wheelLabelSeatPx(wheel: { size: number; centerSize: number }): number {
	const bandPx = (wheel.size - wheel.centerSize) / 2;
	return r1(bandPx * WHEEL_LABEL_SEAT);
}

export interface IpodClassicPresetDefinition {
	id: IpodHardwarePresetId;
	label: string;
	shortLabel: string;
	yearLabel: string;
	notes: string;
	/**
	 * Engraved/advertised storage of this hardware revision, e.g. "160GB". The
	 * single source of truth for capacity — both the on-screen title and the laser
	 * etching on the steel back read this one value, so they can never drift apart.
	 */
	capacityLabel: string;
	/**
	 * True chassis depth in millimetres — the one dimension a flat 2D preset cannot
	 * encode. Drives the 3D body thickness per revision: the 2007 160GB is the thick
	 * 13.5mm chassis; the 80/120GB and Late-2009 bodies are the thin 10.5mm one.
	 */
	depthMm: number;
	defaultShellColor: string;
	defaultBackdropColor: string;
	/**
	 * Optional curated wheel colours. When present they take precedence over
	 * `deriveWheelColors(defaultShellColor)` — used where the mathematically
	 * derived ring would sit too close to the case (e.g. the black 2008's ring
	 * is hand-tuned a step lighter so the wheel still reads as its own part).
	 */
	defaultRingColor?: string;
	defaultCenterColor?: string;
	shell: ShellPresetTokens;
	screen: ScreenPresetTokens;
	wheel: WheelPresetTokens;
}

// Default to black iPod Classic 2008 (6th generation)
export const DEFAULT_HARDWARE_PRESET_ID: IpodHardwarePresetId = "classic-2008-black";

export const IPOD_CLASSIC_PRESETS: readonly IpodClassicPresetDefinition[] = [
	{
		id: "classic-2007",
		label: "Classic 2007 · 6th Gen",
		shortLabel: "2007",
		yearLabel: "2007",
		capacityLabel: "160GB",
		notes: "Original all-metal iPod classic launch proportions.",
		depthMm: IPOD_CLASSIC_MM.body.depthThick,
		defaultShellColor: DEFAULT_SHELL_COLOR,
		defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
		shell: GEOMETRY_580.shell,
		screen: {
			...GEOMETRY_580.screen,
			statusBarHeight: 18,
			statusBarPaddingX: 8,
			contentHeight: 138,
			contentPaddingX: 12,
			contentPaddingTop: 10,
			contentGapX: 12,
			artworkSize: 132,
			artworkColumnWidth: 144,
			progressHeight: 34,
			progressBottom: 4,
			progressPaddingX: 12,
			progressPaddingTop: 4,
			titleFontSize: 14.5,
			artistFontSize: 11.2,
			albumFontSize: 11.2,
			metaFontSize: 10.5,
			titleMarginBottom: 4,
			artistMarginBottom: 4,
			albumMarginBottom: 10,
			metaMarginBottom: 6,
		},
		wheel: {
			...GEOMETRY_580.wheel,
			labelFontSize: 11.2,
			labelTracking: "0.18em",
			sideIconSize: 22,
			playPauseIconSize: 18,
		},
	},
	{
		id: "classic-2008",
		label: "Classic 2008 · 6.5 Gen",
		shortLabel: "2008",
		yearLabel: "2008",
		capacityLabel: "120GB",
		notes: "The refined 120GB revision with improved display density.",
		depthMm: IPOD_CLASSIC_MM.body.depthThin,
		defaultShellColor: "#E8E8E8",
		defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
		shell: GEOMETRY_580.shell,
		screen: {
			...GEOMETRY_580.screen,
			statusBarHeight: 18,
			statusBarPaddingX: 8,
			contentHeight: 138,
			contentPaddingX: 12,
			contentPaddingTop: 10,
			contentGapX: 12,
			artworkSize: 132,
			artworkColumnWidth: 144,
			progressHeight: 34,
			progressBottom: 4,
			progressPaddingX: 12,
			progressPaddingTop: 4,
			titleFontSize: 14.5,
			artistFontSize: 11.2,
			albumFontSize: 11.2,
			metaFontSize: 10.5,
			titleMarginBottom: 4,
			artistMarginBottom: 4,
			albumMarginBottom: 10,
			metaMarginBottom: 6,
		},
		wheel: {
			...GEOMETRY_580.wheel,
			labelFontSize: 11.5,
			labelTracking: "0.08em",
			sideIconSize: 20,
			playPauseIconSize: 15,
		},
	},
	{
		id: "classic-2008-black",
		label: "Classic 2008 · Black",
		shortLabel: "2008 Black",
		yearLabel: "2008",
		capacityLabel: "120GB",
		notes: "Black version of the 120GB revision.",
		depthMm: IPOD_CLASSIC_MM.body.depthThin,
		defaultShellColor: "#1b1818",
		// The canonical "Noir" stage — the studio's signature blue field, ratified
		// from the curated look (spec: 3d-studio-presentation, Noir factory default).
		defaultBackdropColor: "#0048FF",
		// Hand-tuned wheel: derivation lands on #242020, one step too close to the
		// case — the curated ring is lifted to keep the wheel a distinct part.
		defaultRingColor: "#313030",
		defaultCenterColor: "#141212",
		shell: GEOMETRY_580.shell,
		screen: {
			...GEOMETRY_580.screen,
			statusBarHeight: 18,
			statusBarPaddingX: 8,
			contentHeight: 138,
			contentPaddingX: 12,
			contentPaddingTop: 10,
			contentGapX: 12,
			artworkSize: 132,
			artworkColumnWidth: 144,
			progressHeight: 34,
			progressBottom: 4,
			progressPaddingX: 12,
			progressPaddingTop: 4,
			titleFontSize: 14.5,
			artistFontSize: 11.2,
			albumFontSize: 11.2,
			metaFontSize: 10.5,
			titleMarginBottom: 4,
			artistMarginBottom: 4,
			albumMarginBottom: 10,
			metaMarginBottom: 6,
		},
		wheel: {
			...GEOMETRY_580.wheel,
			labelFontSize: 11.5,
			labelTracking: "0.08em",
			sideIconSize: 20,
			playPauseIconSize: 15,
		},
	},
	{
		id: "classic-2008-silver",
		label: "Classic 2008 · Silver",
		shortLabel: "2008 Silver",
		yearLabel: "2008",
		capacityLabel: "120GB",
		notes: "Silver version of the 120GB revision.",
		depthMm: IPOD_CLASSIC_MM.body.depthThin,
		defaultShellColor: "#E8E8E8",
		defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
		shell: GEOMETRY_580.shell,
		screen: {
			...GEOMETRY_580.screen,
			statusBarHeight: 18,
			statusBarPaddingX: 8,
			contentHeight: 138,
			contentPaddingX: 12,
			contentPaddingTop: 10,
			contentGapX: 12,
			artworkSize: 132,
			artworkColumnWidth: 144,
			progressHeight: 34,
			progressBottom: 4,
			progressPaddingX: 12,
			progressPaddingTop: 4,
			titleFontSize: 14.5,
			artistFontSize: 11.2,
			albumFontSize: 11.2,
			metaFontSize: 10.5,
			titleMarginBottom: 4,
			artistMarginBottom: 4,
			albumMarginBottom: 10,
			metaMarginBottom: 6,
		},
		wheel: {
			...GEOMETRY_580.wheel,
			labelFontSize: 11.5,
			labelTracking: "0.08em",
			sideIconSize: 20,
			playPauseIconSize: 15,
		},
	},
	{
		id: "classic-2009",
		label: "Classic 2009 · Late 160GB",
		shortLabel: "2009",
		yearLabel: "2009",
		capacityLabel: "160GB",
		notes: "Late thin revision with tighter wheel and calmer screen chrome.",
		depthMm: IPOD_CLASSIC_MM.body.depthThin,
		defaultShellColor: "#F7F7F7",
		defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
		shell: GEOMETRY_620.shell,
		screen: {
			...GEOMETRY_620.screen,
			statusBarHeight: 17,
			statusBarPaddingX: 8,
			contentHeight: 134,
			contentPaddingX: 9,
			contentPaddingTop: 8,
			contentGapX: 8,
			artworkSize: 126,
			artworkColumnWidth: 136,
			progressHeight: 31,
			progressBottom: 2,
			progressPaddingX: 8,
			progressPaddingTop: 3,
			titleFontSize: 14.0,
			artistFontSize: 11.0,
			albumFontSize: 11.0,
			metaFontSize: 10.0,
			titleMarginBottom: 4,
			artistMarginBottom: 4,
			albumMarginBottom: 9,
			metaMarginBottom: 5,
		},
		wheel: {
			...GEOMETRY_620.wheel,
			labelFontSize: 10.9,
			labelTracking: "0.16em",
			sideIconSize: 18,
			playPauseIconSize: 14,
		},
	},
] as const;

const PRESET_LOOKUP = new Map(IPOD_CLASSIC_PRESETS.map((preset) => [preset.id, preset]));

export function getIpodClassicPreset(presetId: IpodHardwarePresetId): IpodClassicPresetDefinition {
	return PRESET_LOOKUP.get(presetId) ?? PRESET_LOOKUP.get(DEFAULT_HARDWARE_PRESET_ID)!;
}
