import { describe, expect, it } from "vitest";

import { createInitialIpodWorkbenchModel, normalizeModel } from "./update";
import type { IpodWorkbenchModel, PanelFrame } from "./model";
import {
	clampFrameToViewport,
	focusPanel,
	mergePanelFrame,
	PANEL_TITLE_MIN_VISIBLE,
	resetModeLayout,
	resetPanel,
	resolveFrame,
	summonPanel,
	topZ,
} from "./panel-layout";

/**
 * Floating-panel layout state (spec: floating-panel-system). Pins the foundation
 * invariants: an old snapshot without `panelLayout` normalizes to empty (so every
 * panel resolves to its registry default), per-mode keying is independent, frames
 * resolve sparsely, and a stranded frame clamps back into the viewport.
 */
const DEFAULT_FRAME: PanelFrame = {
	x: 100,
	y: 80,
	w: 320,
	h: 240,
	collapsed: false,
	visible: false,
	z: 1,
};

describe("panelLayout normalization", () => {
	it("defaults a fresh model to an empty layout", () => {
		expect(createInitialIpodWorkbenchModel().panelLayout).toEqual({});
	});

	it("normalizes an old snapshot missing panelLayout to empty", () => {
		const legacy = { ...createInitialIpodWorkbenchModel() } as IpodWorkbenchModel;
		// Simulate a pre-feature snapshot.
		delete (legacy as Partial<IpodWorkbenchModel>).panelLayout;
		expect(normalizeModel(legacy).panelLayout).toEqual({});
	});
});

describe("panel frame resolution", () => {
	it("falls back to the registry default for every untouched field", () => {
		expect(resolveFrame(undefined, DEFAULT_FRAME)).toEqual(DEFAULT_FRAME);
		expect(resolveFrame({ x: 5, collapsed: true }, DEFAULT_FRAME)).toEqual({
			...DEFAULT_FRAME,
			x: 5,
			collapsed: true,
		});
	});
});

describe("per-mode keying", () => {
	it("keeps each mode's arrangement independent", () => {
		let layout = mergePanelFrame({}, "flat", "p", { x: 10 });
		layout = mergePanelFrame(layout, "3d", "p", { x: 999 });
		expect(layout.flat?.p?.x).toBe(10);
		expect(layout["3d"]?.p?.x).toBe(999);
	});
});

describe("focus / summon z-order", () => {
	it("focus brings a panel above the current top", () => {
		let layout = mergePanelFrame({}, "flat", "a", { z: 3 });
		layout = mergePanelFrame(layout, "flat", "b", { z: 1 });
		layout = focusPanel(layout, "flat", "b");
		expect(layout.flat?.b?.z).toBe(4);
		expect(topZ(layout, "flat")).toBe(4);
	});

	it("summon makes a panel visible, expanded and frontmost", () => {
		const layout = summonPanel(mergePanelFrame({}, "flat", "a", { z: 2 }), "flat", "a");
		expect(layout.flat?.a).toMatchObject({ visible: true, collapsed: false, z: 3 });
	});
});

describe("reset", () => {
	it("resetPanel deletes one panel; resetModeLayout clears the mode", () => {
		let layout = mergePanelFrame({}, "flat", "a", { x: 1 });
		layout = mergePanelFrame(layout, "flat", "b", { x: 2 });
		expect(resetPanel(layout, "flat", "a").flat?.a).toBeUndefined();
		expect(resetPanel(layout, "flat", "a").flat?.b?.x).toBe(2);
		expect(resetModeLayout(layout, "flat").flat).toBeUndefined();
	});
});

describe("viewport clamping", () => {
	it("keeps the title bar reachable and the frame within bounds", () => {
		const stranded: PanelFrame = { ...DEFAULT_FRAME, x: 5000, y: 5000, w: 9999, h: 9999 };
		const clamped = clampFrameToViewport(stranded, 1000, 800);
		expect(clamped.w).toBe(1000);
		expect(clamped.h).toBe(800);
		expect(clamped.x).toBe(1000 - PANEL_TITLE_MIN_VISIBLE);
		expect(clamped.y).toBe(800 - PANEL_TITLE_MIN_VISIBLE);
	});
});
