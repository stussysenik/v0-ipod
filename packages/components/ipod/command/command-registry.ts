import { PANEL_REGISTRY } from "@ipod/components/ipod/panels/panel-registry";
import { FEATURE_FLAGS } from "@ipod/lib/feature-flags";
import type { IpodViewMode, PanelLayoutState } from "@ipod/lib/ipod-state/model";
import { getModeLayout, resolveFrame } from "@ipod/lib/ipod-state/panel-layout";
import type { IpodMachineEvent } from "@ipod/lib/xstate/central-machine";
import { availableViewModes } from "@ipod/lib/view-modes";

/**
 * Two-tier palette (spec: command-palette §Triage). `primary` commands surface immediately;
 * `secondary` commands stay tucked behind the "more" toggle (still fully searchable) so the
 * immediate list reads as "what matters" while nothing is actually removed. Promote/demote a
 * command by flipping its `tier` here — that is the on/off knob.
 */
export type CommandTier = "primary" | "secondary";

export interface PaletteCommand {
	id: string;
	group: string;
	label: string;
	keywords: string[];
	tier: CommandTier;
	run: () => void;
}

interface BuildArgs {
	viewMode: IpodViewMode;
	layout: PanelLayoutState;
	send: (event: IpodMachineEvent) => void;
	navigate: (href: string) => void;
	close: () => void;
}

/**
 * The live command source (spec: command-palette §Live Command Source). Built fresh from
 * the current machine state on every render so available modes (feature-gated) and the
 * registered panels are always represented accurately — no reload needed.
 */
export function buildCommands({ viewMode, layout, send, navigate, close }: BuildArgs): PaletteCommand[] {
	const commands: PaletteCommand[] = [];
	const run = (event: IpodMachineEvent) => () => {
		send(event);
		close();
	};
	const go = (href: string) => () => {
		navigate(href);
		close();
	};

	// Open the dedicated /3d studio — a real navigation to the focused fullscreen R3F surface,
	// distinct from the inline "Switch to 3D Experience" mode toggle below. Gated by the same
	// flag so the two 3D affordances appear and disappear together.
	if (FEATURE_FLAGS.SHOW_3D_VIEW_MODE) {
		commands.push({
			id: "nav:3d-studio",
			group: "Switch mode",
			label: "Open 3D studio (/3d)",
			keywords: ["3d", "studio", "render", "stage", "navigate", "open", "fullscreen"],
			tier: "primary",
			run: go("/3d"),
		});
	}

	// Mode switching — only modes the feature flags expose. Switching restores that mode's
	// own persisted panel arrangement (the layout is keyed by mode).
	for (const mode of availableViewModes()) {
		if (mode.id === viewMode) continue;
		commands.push({
			id: `mode:${mode.id}`,
			group: "Switch mode",
			label: `Switch to ${mode.label}`,
			keywords: ["mode", "view", mode.id, mode.label],
			tier: "primary",
			run: run({ type: "SET_VIEW_MODE", payload: mode.id }),
		});
	}

	// Panel management — summon / toggle / collapse per registered panel. Summon is the
	// headline action (primary); the redundant show/hide + collapse live in the secondary tier.
	const modeLayout = getModeLayout(layout, viewMode);
	for (const spec of Object.values(PANEL_REGISTRY)) {
		const frame = resolveFrame(modeLayout[spec.id], spec.defaultFrame);
		commands.push({
			id: `panel:summon:${spec.id}`,
			group: "Panels",
			label: `Summon ${spec.title} panel`,
			keywords: ["panel", "summon", "open", "show", spec.title],
			tier: "primary",
			run: run({ type: "SUMMON_PANEL", payload: { id: spec.id } }),
		});
		commands.push({
			id: `panel:toggle:${spec.id}`,
			group: "Panels",
			label: `${frame.visible ? "Hide" : "Show"} ${spec.title} panel`,
			keywords: ["panel", "toggle", "hide", "show", spec.title],
			tier: "secondary",
			run: run({ type: "SET_PANEL_VISIBLE", payload: { id: spec.id, visible: !frame.visible } }),
		});
		commands.push({
			id: `panel:collapse:${spec.id}`,
			group: "Panels",
			label: `${frame.collapsed ? "Expand" : "Collapse"} ${spec.title} panel`,
			keywords: ["panel", "collapse", "expand", "minimize", spec.title],
			tier: "secondary",
			run: run({ type: "SET_PANEL_COLLAPSED", payload: { id: spec.id, collapsed: !frame.collapsed } }),
		});
	}

	// Layout reset for the current mode.
	commands.push({
		id: "layout:reset",
		group: "Layout",
		label: "Reset panel layout",
		keywords: ["reset", "layout", "default", "panels"],
		tier: "secondary",
		run: run({ type: "RESET_PANEL_LAYOUT" }),
	});

	return commands;
}
