import type { IpodViewMode, PanelFrame, PanelId, PanelLayoutState } from "./model";

/**
 * Pure layout operations for the floating-panel system (spec: floating-panel-system).
 *
 * The store keeps a sparse `[viewMode][panelId] -> Partial<PanelFrame>` map. These
 * helpers merge user edits immutably and resolve a sparse frame against a registry
 * default. Keeping them framework-free makes the geometry unit-testable and lets the
 * XState machine stay generic — it never needs to know a panel's default size, because
 * a reset simply deletes the entry and the host re-derives the default.
 */

/** Minimum px of a panel's title bar that must stay on-screen so it's grabbable. */
export const PANEL_TITLE_MIN_VISIBLE = 48;

export function getModeLayout(
	layout: PanelLayoutState,
	mode: IpodViewMode,
): Partial<Record<PanelId, Partial<PanelFrame>>> {
	return layout[mode] ?? {};
}

/** Immutably merge a partial frame patch into `[mode][id]`. */
export function mergePanelFrame(
	layout: PanelLayoutState,
	mode: IpodViewMode,
	id: PanelId,
	patch: Partial<PanelFrame>,
): PanelLayoutState {
	const mode_ = getModeLayout(layout, mode);
	return {
		...layout,
		[mode]: { ...mode_, [id]: { ...mode_[id], ...patch } },
	};
}

/** Highest z currently used in a mode (0 when empty). */
export function topZ(layout: PanelLayoutState, mode: IpodViewMode): number {
	const mode_ = getModeLayout(layout, mode);
	return Object.values(mode_).reduce((max, frame) => Math.max(max, frame?.z ?? 0), 0);
}

/** Bring a panel to the front of its mode's stack. */
export function focusPanel(
	layout: PanelLayoutState,
	mode: IpodViewMode,
	id: PanelId,
): PanelLayoutState {
	return mergePanelFrame(layout, mode, id, { z: topZ(layout, mode) + 1 });
}

/** Show + expand + focus a panel (the palette "summon" action). */
export function summonPanel(
	layout: PanelLayoutState,
	mode: IpodViewMode,
	id: PanelId,
): PanelLayoutState {
	return mergePanelFrame(layout, mode, id, {
		visible: true,
		collapsed: false,
		z: topZ(layout, mode) + 1,
	});
}

/** Drop a single panel back to its registry default (delete its stored frame). */
export function resetPanel(
	layout: PanelLayoutState,
	mode: IpodViewMode,
	id: PanelId,
): PanelLayoutState {
	const mode_ = { ...getModeLayout(layout, mode) };
	delete mode_[id];
	return { ...layout, [mode]: mode_ };
}

/** Drop every panel in a mode back to defaults (delete the mode's whole map). */
export function resetModeLayout(layout: PanelLayoutState, mode: IpodViewMode): PanelLayoutState {
	const next = { ...layout };
	delete next[mode];
	return next;
}

/**
 * Resolve a sparse stored frame against the registry default. Any field the user
 * never touched (or any field missing from an old snapshot) falls back cleanly.
 */
export function resolveFrame(
	stored: Partial<PanelFrame> | undefined,
	def: PanelFrame,
): PanelFrame {
	return {
		x: stored?.x ?? def.x,
		y: stored?.y ?? def.y,
		w: stored?.w ?? def.w,
		h: stored?.h ?? def.h,
		collapsed: stored?.collapsed ?? def.collapsed,
		visible: stored?.visible ?? def.visible,
		z: stored?.z ?? def.z,
	};
}

export interface SafeInsets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/**
 * Compute how far the spatial canvas must inset on each side so visible panels never
 * permanently occlude the centred model (spec: Spatial Canvas Symbiosis). Each panel
 * pushes in the side its centre sits nearest; the inset is capped at 40% per axis so the
 * model can never be squeezed to nothing.
 */
export function computeSafeInsets(
	frames: PanelFrame[],
	viewportWidth: number,
	viewportHeight: number,
): SafeInsets {
	let left = 0;
	let right = 0;
	let top = 0;
	let bottom = 0;
	for (const f of frames) {
		const cx = f.x + f.w / 2;
		const cy = f.y + f.h / 2;
		if (cx < viewportWidth / 2) left = Math.max(left, f.x + f.w);
		else right = Math.max(right, viewportWidth - f.x);
		if (cy < viewportHeight / 2) top = Math.max(top, f.y + f.h);
		else bottom = Math.max(bottom, viewportHeight - f.y);
	}
	const capX = viewportWidth * 0.4;
	const capY = viewportHeight * 0.4;
	return {
		left: Math.max(0, Math.min(left, capX)),
		right: Math.max(0, Math.min(right, capX)),
		top: Math.max(0, Math.min(top, capY)),
		bottom: Math.max(0, Math.min(bottom, capY)),
	};
}

/**
 * Clamp a frame so it stays usable inside the viewport: never wider/taller than the
 * viewport, and never dragged so far that its title bar is unreachable. A persisted
 * panel can therefore never be stranded off-screen after a window resize.
 */
export function clampFrameToViewport(
	frame: PanelFrame,
	viewportWidth: number,
	viewportHeight: number,
): PanelFrame {
	const w = Math.min(frame.w, viewportWidth);
	const h = Math.min(frame.h, viewportHeight);
	const maxX = Math.max(0, viewportWidth - PANEL_TITLE_MIN_VISIBLE);
	const maxY = Math.max(0, viewportHeight - PANEL_TITLE_MIN_VISIBLE);
	return {
		...frame,
		w,
		h,
		x: Math.min(Math.max(frame.x, 0), maxX),
		y: Math.min(Math.max(frame.y, 0), maxY),
	};
}
