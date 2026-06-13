import { IPOD_CLASSIC_MM, type IpodClassicPresetDefinition } from "./ipod-classic-presets";

/**
 * Derives 3D scene geometry from the canonical 2D preset tokens.
 *
 * The 2D presets in `ipod-classic-presets.ts` are the dimensional authority for
 * the device — shell, screen, and wheel are all expressed there in pixels at a
 * faithful 6th-generation ratio. This module is the single bridge that maps
 * those pixel tokens into Three.js world units so the 3D model is a true
 * projection of the 2D design rather than a hand-tuned approximation.
 *
 * Depth is the one dimension the 2D presets cannot encode (a flat design has no
 * thickness), so we recover it from the real iPod classic physical ratio.
 */

// Scene anchor: the device body height in world units. Chosen so the default
// camera framing stays stable across presets — everything else scales from it.
const SCENE_HEIGHT = 6.25;

// Real iPod classic body height — the mm→world anchor. The preset pixel tokens
// are themselves derived from Apple's dimensional drawing (see IPOD_CLASSIC_MM in
// `ipod-classic-presets.ts`), so projecting them here lands the 3D model on the
// true machined geometry. Depth is the one dimension a flat preset cannot encode;
// each preset carries its revision's real `depthMm` (10.5 thin / 13.5 thick 160GB).
const PHYSICAL_HEIGHT_MM = 103.5;

// ── Click-wheel form — projected directly from the 2D preset tokens ──
// The presets now derive the wheel from the drawing: Ø38.0 of the 61.8 body
// (0.615 of width), select button Ø13.7, centre 30.4mm above the bottom edge.
// Earlier hand-tuned passes swung from 0.55×width (too small, dead lower face)
// to 0.78×width (a 27% oversize that crowded the side margins and broke the
// face's proportional trust). Projection from the mm spec ends that drift.
//
// The touch annulus's inner edge is seated just inside the select button so the
// button laps slightly over it — one clean disc in the ring, no deep recessed
// groove pooling into a hard black moat (a fidelity note carried from review).
const WHEEL_INNER_TO_BUTTON = 0.92; // annulus inner radius ÷ select-button radius

export interface Ipod3DDimensions {
	/** World units per preset pixel — the master conversion factor. */
	unit: number;
	width: number;
	height: number;
	depth: number;
	radius: number;
	/** Parting-seam inset where the aluminum face seats into the steel lip. */
	seam: number;
	screenW: number;
	screenH: number;
	screenRadius: number;
	/** Screen center Y, derived from the 2D shell padding + screen layout. */
	screenCenterY: number;
	wheelOuterR: number;
	wheelInnerR: number;
	centerR: number;
	/** Wheel center Y, derived from the 2D control margin + shell layout. */
	wheelCenterY: number;
	/** Pixel dimensions of the live HTML overlays (match the 2D components 1:1). */
	screenHtmlPx: { width: number; height: number };
	wheelHtmlPx: { width: number; height: number };
	/** World units per millimetre — for chassis features dimensioned in mm on the drawing. */
	mmToWorld: number;
	/**
	 * Chassis edge features (headphone jack, hold switch, dock connector), projected
	 * from the drawing's mm callouts into world units. X is signed from the body
	 * centreline (the drawing measures from the left/right edges); each feature is
	 * a recess seated FLUSH on the top (+y) or bottom (−y) wall.
	 */
	ports: {
		/** 3.5mm jack on the top wall — bore centre + radius. */
		jack: { centerX: number; radius: number };
		/** Hold-switch slot on the top wall — centre, length (along width), slit width (along depth). */
		hold: { centerX: number; length: number; width: number };
		/** 30-pin dock opening on the bottom wall — centred; length (along width) × width (along depth). */
		dock: { length: number; width: number };
	};
}

/**
 * Project a preset's 2D tokens into the 3D scene.
 *
 * Vertical placement mirrors the 2D shell box model exactly: the screen sits
 * below the top padding and the wheel sits below the screen by the control
 * margin, so the 3D layout lines up with what the 2D workbench renders.
 */
export function deriveIpod3DDimensions(
	preset: IpodClassicPresetDefinition,
): Ipod3DDimensions {
	const { shell, screen, wheel } = preset;
	const unit = SCENE_HEIGHT / shell.height;

	const halfH = shell.height / 2;

	// Screen vertical center (px from shell center, +y up), then → world units.
	const screenCenterPx = halfH - shell.paddingTop - screen.frameHeight / 2;

	// ── Wheel circles, projected straight from the 2D wheel tokens ──
	// Same authority as the screen: the wheel reads at the design's true scale, so
	// it fills the lower face the way the 2D workbench (and the real device) does.
	const wheelDiameterPx = wheel.size;
	const wheelOuterR = (wheelDiameterPx / 2) * unit;
	const centerR = (wheel.centerSize / 2) * unit;
	const wheelInnerR = centerR * WHEEL_INNER_TO_BUTTON;

	// Seat the wheel the 2D way: a fixed control-margin gap below the screen (NOT
	// centered in the open region, which floated it low and opened a dead band
	// right under the screen). This lands the center at ~0.74H — the real face.
	const wheelTopPx = halfH - shell.paddingTop - screen.frameHeight - shell.controlMarginTop;
	const wheelCenterPx = wheelTopPx - wheelDiameterPx / 2;

	// ── Chassis edge features — straight mm→world projection ──
	// The face tokens go mm→px→world (the presets are the pixel authority for the
	// FACE); the edge ports never had a 2D life, so they project directly from the
	// drawing. Same anchor (body height), so both paths agree to rounding.
	const mmToWorld = SCENE_HEIGHT / PHYSICAL_HEIGHT_MM;
	const halfWmm = IPOD_CLASSIC_MM.body.width / 2;
	const { headphoneJack, holdSwitch } = IPOD_CLASSIC_MM.top;
	const { dockConnector } = IPOD_CLASSIC_MM.bottom;
	const holdCenterFromRightMm =
		(holdSwitch.slotNearFromRight + holdSwitch.slotFarFromRight) / 2;

	return {
		unit,
		mmToWorld,
		ports: {
			jack: {
				centerX: (headphoneJack.centerFromLeft - halfWmm) * mmToWorld,
				radius: (headphoneJack.boreDiameter / 2) * mmToWorld,
			},
			hold: {
				centerX: (halfWmm - holdCenterFromRightMm) * mmToWorld,
				length: (holdSwitch.slotFarFromRight - holdSwitch.slotNearFromRight) * mmToWorld,
				width: holdSwitch.slotWidth * mmToWorld,
			},
			dock: {
				length: dockConnector.width * mmToWorld,
				width: dockConnector.height * mmToWorld,
			},
		},
		width: shell.width * unit,
		height: SCENE_HEIGHT,
		// True chassis depth per hardware revision (the 2007 160GB is the thick body).
		depth: SCENE_HEIGHT * (preset.depthMm / PHYSICAL_HEIGHT_MM),
		radius: shell.radius * unit,
		// Hairline parting line where the aluminum face meets the steel edge.
		// Kept thin so the front reads as one clean aluminum plane rather than a
		// black-framed inset; the chrome only shows at the rolled rim.
		seam: (0.35 / PHYSICAL_HEIGHT_MM) * SCENE_HEIGHT,
		screenW: screen.frameWidth * unit,
		screenH: screen.frameHeight * unit,
		screenRadius: screen.outerRadius * unit,
		screenCenterY: screenCenterPx * unit,
		wheelOuterR,
		wheelInnerR,
		centerR,
		wheelCenterY: wheelCenterPx * unit,
		screenHtmlPx: { width: screen.frameWidth, height: screen.frameHeight },
		// The live label/hit overlay matches the corrected wheel diameter so MENU
		// and the transport icons land on the real annulus, not the oversized one.
		wheelHtmlPx: { width: wheelDiameterPx, height: wheelDiameterPx },
	};
}
