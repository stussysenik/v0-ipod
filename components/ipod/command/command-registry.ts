import { PANEL_REGISTRY } from "@/components/ipod/panels/panel-registry";
import type { IpodViewMode, PanelLayoutState } from "@/lib/ipod-state/model";
import { getModeLayout, resolveFrame } from "@/lib/ipod-state/panel-layout";
import type { IpodMachineEvent } from "@/lib/xstate/central-machine";
import { availableViewModes } from "@/lib/view-modes";

export interface PaletteCommand {
	id: string;
	group: string;
	label: string;
	keywords: string[];
	run: () => void;
}

interface BuildArgs {
	viewMode: IpodViewMode;
	layout: PanelLayoutState;
	send: (event: IpodMachineEvent) => void;
	close: () => void;
}

/**
 * The live command source (spec: command-palette §Live Command Source). Built fresh from
 * the current machine state on every render so available modes (feature-gated) and the
 * registered panels are always represented accurately — no reload needed.
 */
export function buildCommands({ viewMode, layout, send, close }: BuildArgs): PaletteCommand[] {
	const commands: PaletteCommand[] = [];
	const run = (event: IpodMachineEvent) => () => {
		send(event);
		close();
	};

	// Mode switching — only modes the feature flags expose. Switching restores that mode's
	// own persisted panel arrangement (the layout is keyed by mode).
	for (const mode of availableViewModes()) {
		if (mode.id === viewMode) continue;
		commands.push({
			id: `mode:${mode.id}`,
			group: "Switch mode",
			label: `Switch to ${mode.label}`,
			keywords: ["mode", "view", mode.id, mode.label],
			run: run({ type: "SET_VIEW_MODE", payload: mode.id }),
		});
	}

	// Panel management — summon / toggle / collapse per registered panel.
	const modeLayout = getModeLayout(layout, viewMode);
	for (const spec of Object.values(PANEL_REGISTRY)) {
		const frame = resolveFrame(modeLayout[spec.id], spec.defaultFrame);
		commands.push({
			id: `panel:summon:${spec.id}`,
			group: "Panels",
			label: `Summon ${spec.title} panel`,
			keywords: ["panel", "summon", "open", "show", spec.title],
			run: run({ type: "SUMMON_PANEL", payload: { id: spec.id } }),
		});
		commands.push({
			id: `panel:toggle:${spec.id}`,
			group: "Panels",
			label: `${frame.visible ? "Hide" : "Show"} ${spec.title} panel`,
			keywords: ["panel", "toggle", "hide", "show", spec.title],
			run: run({ type: "SET_PANEL_VISIBLE", payload: { id: spec.id, visible: !frame.visible } }),
		});
		commands.push({
			id: `panel:collapse:${spec.id}`,
			group: "Panels",
			label: `${frame.collapsed ? "Expand" : "Collapse"} ${spec.title} panel`,
			keywords: ["panel", "collapse", "expand", "minimize", spec.title],
			run: run({ type: "SET_PANEL_COLLAPSED", payload: { id: spec.id, collapsed: !frame.collapsed } }),
		});
	}

	// Layout reset for the current mode.
	commands.push({
		id: "layout:reset",
		group: "Layout",
		label: "Reset panel layout",
		keywords: ["reset", "layout", "default", "panels"],
		run: run({ type: "RESET_PANEL_LAYOUT" }),
	});

	return commands;
}
