/**
 * Keep-out stage geometry.
 *
 * The device owns an inviolable region (the keep-out zone). Every control rail
 * lives in a region that is, by construction, a disjoint partition of the stage —
 * so a rail can never overlap the device regardless of z-index or breakpoint.
 *
 * Pure functions only: no DOM, no React, no viewport reads. This is what makes
 * the layout unit-testable without a browser and deterministic at any embed size.
 * The companion CSS (container queries) mirrors this partition; this module is the
 * source of truth that the tests pin.
 */

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

export type RailMode = "rows" | "columns";

export type StageLayout = {
	mode: RailMode;
	/** The keep-out zone. Nothing else may intersect it. */
	device: Rect;
	/** Disjoint control regions outside the keep-out zone. */
	rails: Rect[];
	/** Total laid-out height; may exceed `stage.height` in rows mode (container scrolls). */
	contentHeight: number;
};

export type LayoutOpts = {
	/** Device width / height. iPod classic body 61.8 × 103.5mm ≈ 0.597 (IPOD_CLASSIC_MM). */
	deviceAspect: number;
	/** Container width below which rails reflow into rows beneath the device. */
	breakpoint: number;
	/** Rows mode: device width as a fraction of container width (width-locked). */
	rowDeviceWidthFraction: number;
	/** Rows mode: number of rail bands stacked below the device. */
	rowRailCount: number;
	/** Rows mode: each rail band's height as a fraction of the device height. */
	rowRailHeightFraction: number;
	/** Columns mode: each side rail's width as a fraction of container width. */
	columnRailFraction: number;
};

const DEFAULTS: LayoutOpts = {
	deviceAspect: 0.597,
	breakpoint: 560,
	rowDeviceWidthFraction: 0.78,
	rowRailCount: 3,
	rowRailHeightFraction: 0.16,
	columnRailFraction: 0.2,
};

/**
 * Sub-pixel tolerance. Contiguous partitions (a rail flush against the next) can
 * differ by a floating-point ULP; anything under this threshold is touching, not
 * overlapping. Far below a CSS pixel, so it never masks a real overlap.
 */
const EPSILON = 1e-6;

/** True only when the two rects share meaningful area. Edge-touching is not overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
	const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
	const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
	return overlapX > EPSILON && overlapY > EPSILON;
}

/** Wide containers get side-column rails; narrow ones stack rails as rows below. */
export function railLayoutMode(containerWidth: number, breakpoint = DEFAULTS.breakpoint): RailMode {
	return containerWidth >= breakpoint ? "columns" : "rows";
}

/**
 * Partition the stage into a device keep-out zone and disjoint rail regions.
 *
 * Rows mode (narrow): device is sized off WIDTH and pinned to the top; rails are
 * full-width bands stacked beneath it. Because device sizing ignores container
 * height, a transient height change (URL bar, keyboard) cannot rescale the device —
 * the container scrolls instead. Disjointness holds because every region occupies a
 * distinct y-band.
 *
 * Columns mode (wide): side rails take the left/right gutters; the device fits the
 * center column by height; a bottom rail sits beneath the device within that column.
 * Disjointness holds because the side rails own distinct x-bands and the bottom rail
 * owns a distinct y-band within the center column.
 */
export function computeStageLayout(stage: Size, opts: Partial<LayoutOpts> = {}): StageLayout {
	const o = { ...DEFAULTS, ...opts };
	return railLayoutMode(stage.width, o.breakpoint) === "rows"
		? rowsLayout(stage, o)
		: columnsLayout(stage, o);
}

function rowsLayout(stage: Size, o: LayoutOpts): StageLayout {
	const deviceWidth = stage.width * o.rowDeviceWidthFraction;
	const deviceHeight = deviceWidth / o.deviceAspect;
	const device: Rect = {
		x: (stage.width - deviceWidth) / 2,
		y: 0,
		width: deviceWidth,
		height: deviceHeight,
	};

	const railHeight = deviceHeight * o.rowRailHeightFraction;
	const rails: Rect[] = Array.from({ length: o.rowRailCount }, (_, i) => ({
		x: 0,
		y: device.height + i * railHeight,
		width: stage.width,
		height: railHeight,
	}));

	return { mode: "rows", device, rails, contentHeight: device.height + o.rowRailCount * railHeight };
}

function columnsLayout(stage: Size, o: LayoutOpts): StageLayout {
	const railWidth = stage.width * o.columnRailFraction;
	const centerX = railWidth;
	const centerWidth = stage.width - 2 * railWidth;

	// Reserve a bottom band in the center column for the shots/tab rail, then fit
	// the device by height into what remains.
	const bottomRailHeight = stage.height * 0.14;
	const deviceRegionHeight = stage.height - bottomRailHeight;

	let deviceHeight = deviceRegionHeight;
	let deviceWidth = deviceHeight * o.deviceAspect;
	if (deviceWidth > centerWidth) {
		deviceWidth = centerWidth;
		deviceHeight = deviceWidth / o.deviceAspect;
	}
	const device: Rect = {
		x: centerX + (centerWidth - deviceWidth) / 2,
		y: (deviceRegionHeight - deviceHeight) / 2,
		width: deviceWidth,
		height: deviceHeight,
	};

	const rails: Rect[] = [
		{ x: 0, y: 0, width: railWidth, height: stage.height }, // left
		{ x: stage.width - railWidth, y: 0, width: railWidth, height: stage.height }, // right
		{ x: centerX, y: deviceRegionHeight, width: centerWidth, height: bottomRailHeight }, // bottom
	];

	return { mode: "columns", device, rails, contentHeight: stage.height };
}
