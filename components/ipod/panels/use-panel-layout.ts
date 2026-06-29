"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PanelFrame } from "@/lib/ipod-state/model";
import {
	clampFrameToViewport,
	computeSafeInsets,
	resolveFrame,
	type SafeInsets,
} from "@/lib/ipod-state/panel-layout";
import { loadPanelLayout, savePanelLayout } from "@/lib/ipod-state/storage";
import { IpodStoreContext } from "@/lib/xstate/store";
import { PANEL_REGISTRY, type PanelSpec } from "./panel-registry";

/** Below this width the floating panels degrade to the docked/sheet fallback. */
export const COMPACT_BREAKPOINT = 768;

export interface ResolvedPanel {
	spec: PanelSpec;
	frame: PanelFrame;
}

export interface ViewportSize {
	width: number;
	height: number;
}

export function useViewportSize(): ViewportSize {
	const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
	useEffect(() => {
		const read = () => setSize({ width: window.innerWidth, height: window.innerHeight });
		read();
		window.addEventListener("resize", read, { passive: true });
		window.addEventListener("orientationchange", read, { passive: true });
		return () => {
			window.removeEventListener("resize", read);
			window.removeEventListener("orientationchange", read);
		};
	}, []);
	return size;
}

export function useIsCompact(): boolean {
	const { width } = useViewportSize();
	return width > 0 && width < COMPACT_BREAKPOINT;
}

/**
 * Hydrate the persisted panel layout into the store once on mount and persist every
 * change back out. Layout rides its own localStorage key (it's editor-local chrome), so
 * it round-trips across reloads without disturbing the song-snapshot schema.
 */
export function usePanelLayoutSync(): void {
	const { send } = IpodStoreContext.useActorRef();
	const layout = IpodStoreContext.useSelector((s) => s.context.panelLayout);
	// The store's pre-hydration layout (SSR/default `{}`). Captured on first render and never
	// persisted, so the empty default can't clobber a stored layout during the hydration window.
	const initialLayout = useRef(layout);

	useEffect(() => {
		const stored = loadPanelLayout();
		if (Object.keys(stored).length > 0) {
			send({ type: "HYDRATE_PANEL_LAYOUT", payload: stored });
		}
		// Hydrate exactly once on mount. Panels default to `visible: false` and are summoned
		// from the ⌘K palette, so none are on screen at first paint — there is no pre-hydration
		// clobber window here, and a post-paint effect is sufficient (unlike the device model,
		// whose shell IS painted immediately; see ipod-classic-workbench's layout-effect restore).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// Persist only once the live layout diverges from the untouched initial value — by the
		// hydrate above or a real user edit. Comparing by value (not mount count) makes this
		// safe under React StrictMode's dev double-mount, which would otherwise let a second
		// mount persist the stale `{}` and wipe the stored layout.
		if (layout === initialLayout.current) return;
		savePanelLayout(layout);
	}, [layout]);
}

/**
 * The visible panels for the current mode, each resolved against its registry default
 * and clamped into the viewport so a persisted frame can never strand a panel off-screen.
 * Sorted by z so later DOM order matches focus order.
 */
export function useResolvedPanels(viewport: ViewportSize): ResolvedPanel[] {
	// Select the raw per-mode slice (stable ref; undefined when a mode has no layout yet).
	// Switching modes changes this reference, so the memo recomputes without needing the
	// mode id in its deps — and we never return a fresh `{}` that would churn the selector.
	const modeLayout = IpodStoreContext.useSelector(
		(s) => s.context.panelLayout[s.context.presentation.viewMode],
	);

	return useMemo(() => {
		if (viewport.width === 0) return [];
		const layout = modeLayout ?? {};
		const panels: ResolvedPanel[] = [];
		for (const spec of Object.values(PANEL_REGISTRY)) {
			const frame = resolveFrame(layout[spec.id], spec.defaultFrame);
			if (!frame.visible) continue;
			panels.push({ spec, frame: clampFrameToViewport(frame, viewport.width, viewport.height) });
		}
		return panels.sort((a, b) => a.frame.z - b.frame.z);
	}, [modeLayout, viewport.width, viewport.height]);
}

/**
 * Safe insets for canvas symbiosis: derived from the same resolved, visible, non-collapsed
 * panels the host renders, so whatever is on screen is what the canvas reflows around.
 */
export function useSafeInsets(viewport: ViewportSize): SafeInsets {
	const panels = useResolvedPanels(viewport);
	return useMemo(() => {
		const frames = panels.filter((p) => !p.frame.collapsed).map((p) => p.frame);
		return computeSafeInsets(frames, viewport.width, viewport.height);
	}, [panels, viewport.width, viewport.height]);
}
