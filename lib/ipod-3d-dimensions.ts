import type { IpodClassicPresetDefinition } from "./ipod-classic-presets";

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

// Real iPod classic (6th gen, 80/120GB thin chassis): 103.5mm tall, 10.5mm deep.
// We carry the true depth-to-height ratio so the model reads with correct
// thickness instead of the wafer-thin slab the earlier hard-coded dims implied.
const PHYSICAL_HEIGHT_MM = 103.5;
const PHYSICAL_DEPTH_MM = 10.5;
const DEPTH_RATIO = PHYSICAL_DEPTH_MM / PHYSICAL_HEIGHT_MM;

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
	// Wheel vertical center, stacked below the screen by the control margin.
	const wheelCenterPx =
		halfH -
		shell.paddingTop -
		screen.frameHeight -
		shell.controlMarginTop -
		wheel.size / 2;

	const centerR = (wheel.centerSize / 2) * unit;

	return {
		unit,
		width: shell.width * unit,
		height: SCENE_HEIGHT,
		depth: SCENE_HEIGHT * DEPTH_RATIO,
		radius: shell.radius * unit,
		// Hairline parting line where the aluminum face meets the steel edge.
		// Kept thin so the front reads as one clean aluminum plane rather than a
		// black-framed inset; the chrome only shows at the rolled rim.
		seam: (0.35 / PHYSICAL_HEIGHT_MM) * SCENE_HEIGHT,
		screenW: screen.frameWidth * unit,
		screenH: screen.frameHeight * unit,
		screenRadius: screen.outerRadius * unit,
		screenCenterY: screenCenterPx * unit,
		wheelOuterR: (wheel.size / 2) * unit,
		// The touch ring's inner edge — a small gap around the center button.
		wheelInnerR: centerR + wheel.centerSize * 0.18 * unit,
		centerR,
		wheelCenterY: wheelCenterPx * unit,
		screenHtmlPx: { width: screen.frameWidth, height: screen.frameHeight },
		wheelHtmlPx: { width: wheel.size, height: wheel.size },
	};
}
