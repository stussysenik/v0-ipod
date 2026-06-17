"use client";

import { CommandPalette } from "@/components/ipod/command/command-palette";
import { PanelHost } from "./panel-host";

/**
 * The floating-panel system mount point: the panel host + the global ⌘K command palette
 * (specs: floating-panel-system, command-palette).
 *
 * Rendered inside each route's interactive client tree (the workbench and the 3D stage)
 * rather than the root layout: in this Next setup the layout's client-component siblings of
 * `{children}` are server-rendered but not hydrated, so their key listeners never bind. The
 * page client trees hydrate reliably and share the same store via context, so the palette is
 * still effectively global wherever a primary surface is mounted.
 */
export function PanelSystem() {
	return (
		<>
			<PanelHost />
			<CommandPalette />
		</>
	);
}
