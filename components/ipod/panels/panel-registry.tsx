"use client";

import type { ReactNode } from "react";

import type { PanelFrame, PanelId } from "@/lib/ipod-state/model";
import { ViewModePanelBody } from "./view-mode-panel-body";

export interface PanelSpec {
	id: PanelId;
	title: string;
	/** Collapsed footprint — the panel's "ideal smallness" (title bar / nub only). */
	idealMinSize: { w: number; h: number };
	/** Smallest the expanded panel may be resized to. */
	minSize: { w: number; h: number };
	/** Registry default frame; user edits merge over this and a reset restores it. */
	defaultFrame: PanelFrame;
	/** Rendered inside the panel body. */
	content: ReactNode;
}

/**
 * The single source of truth for floating tool panels (spec: floating-panel-system).
 * The host renders these by id, the persistence layer keys frames by id, and the command
 * palette builds summon/toggle/collapse commands from the same ids.
 *
 * Panels default `visible: false` and are summoned from the ⌘K palette, so mounting the
 * host globally adds zero default chrome and cannot regress the mobile-stability layout.
 * The registry is seeded with one real, migrated control (view-mode switching); further
 * dock controls migrate in panel-by-panel (spec tasks §6).
 */
export const PANEL_REGISTRY: Record<PanelId, PanelSpec> = {
	view: {
		id: "view",
		title: "View",
		idealMinSize: { w: 200, h: 36 },
		minSize: { w: 180, h: 150 },
		defaultFrame: { x: 24, y: 88, w: 220, h: 232, collapsed: false, visible: false, z: 1 },
		content: <ViewModePanelBody />,
	},
};

export const PANEL_IDS = Object.keys(PANEL_REGISTRY);
