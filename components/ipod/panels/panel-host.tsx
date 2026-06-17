"use client";

import { IpodStoreContext } from "@/lib/xstate/store";
import { FloatingPanel } from "./floating-panel";
import {
	useIsCompact,
	usePanelLayoutSync,
	useResolvedPanels,
	useViewportSize,
} from "./use-panel-layout";

/**
 * Renders the visible floating panels for the current view mode (spec: floating-panel-system).
 *
 * Mounted once globally inside the store provider. Below the compact breakpoint it renders
 * nothing — tool surfaces fall back to the existing docked / bottom-sheet layout and no
 * drag/resize affordances appear — preserving the mobile-stability guarantees. On desktop it
 * hosts the resolved panels; each is clamped into the viewport on mount and on resize.
 */
export function PanelHost() {
	usePanelLayoutSync();
	const viewport = useViewportSize();
	const isCompact = useIsCompact();
	const panels = useResolvedPanels(viewport);
	const { send } = IpodStoreContext.useActorRef();

	if (isCompact) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-40" data-panel-host>
			{panels.map(({ spec, frame }) => (
				<FloatingPanel
					key={spec.id}
					spec={spec}
					frame={frame}
					onCommitFrame={(patch) =>
						send({ type: "SET_PANEL_FRAME", payload: { id: spec.id, frame: patch } })
					}
					onFocus={() => send({ type: "FOCUS_PANEL", payload: { id: spec.id } })}
					onToggleCollapsed={() =>
						send({
							type: "SET_PANEL_COLLAPSED",
							payload: { id: spec.id, collapsed: !frame.collapsed },
						})
					}
					onClose={() => send({ type: "SET_PANEL_VISIBLE", payload: { id: spec.id, visible: false } })}
				/>
			))}
		</div>
	);
}
