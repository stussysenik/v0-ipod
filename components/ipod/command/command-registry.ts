import { toast } from "sonner";

import { PANEL_REGISTRY } from "@/components/ipod/panels/panel-registry";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics/events";
import type { IpodViewMode, IpodWorkbenchModel, PanelLayoutState } from "@/lib/ipod-state/model";
import { getModeLayout, resolveFrame } from "@/lib/ipod-state/panel-layout";
import { copyShareLink, downloadConfigFile, pickConfigFile } from "@/lib/ipod-state/share";
import type { IpodMachineEvent } from "@/lib/xstate/central-machine";
import { availableViewModes } from "@/lib/view-modes";

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
	/** Snapshot accessor for share/export commands — read at run time, not render time. */
	getModel: () => IpodWorkbenchModel;
}

/**
 * The live command source (spec: command-palette §Live Command Source). Built fresh from
 * the current machine state on every render so available modes (feature-gated) and the
 * registered panels are always represented accurately — no reload needed.
 */
export function buildCommands({ viewMode, layout, send, navigate, close, getModel }: BuildArgs): PaletteCommand[] {
	const commands: PaletteCommand[] = [];
	const run = (event: IpodMachineEvent) => () => {
		send(event);
		close();
	};
	const go = (href: string) => () => {
		navigate(href);
		close();
	};

	// Open the dedicated /3d studio. This is the ONE 3D truth (spec: surface-mode-switching),
	// so it is deliberately NOT gated on SHOW_3D_VIEW_MODE — that flag archives the *inline*
	// 3D render mode, and gating this on it would remove the only palette route to /3d. The
	// inline mode's own command disappears on its own via `availableViewModes()` below.
	commands.push({
		id: "nav:3d-studio",
		group: "Switch mode",
		label: "Open 3D studio (/3d)",
		keywords: ["3d", "studio", "render", "stage", "navigate", "open", "fullscreen"],
		tier: "primary",
		run: go("/3d"),
	});

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

	// Reset the device to defaults. The rail's Reset button is archived behind
	// SHOW_WORKBENCH_TRANSPORT, so the palette is now its only trigger (design D7).
	commands.push({
		id: "model:reset",
		group: "Configuration",
		label: "Reset to defaults",
		keywords: ["reset", "defaults", "clear", "start over", "revert"],
		tier: "secondary",
		run: run({ type: "RESET_MODEL" }),
	});

	// Layout reset for the current mode.
	commands.push({
		id: "layout:reset",
		group: "Layout",
		label: "Reset panel layout",
		keywords: ["reset", "layout", "default", "panels"],
		tier: "secondary",
		run: run({ type: "RESET_PANEL_LAYOUT" }),
	});

	// Portable state (spec: portable-customizer-state) — the current look as a link
	// or a config file, and the reverse. Restores route through RESTORE_MODEL so an
	// imported config takes the exact path a persisted model does.
	commands.push({
		id: "config:share-link",
		group: "Configuration",
		label: "Copy share link",
		keywords: ["share", "link", "copy", "url", "config", "state"],
		tier: "primary",
		run: () => {
			close();
			void copyShareLink(getModel()).then((copied) => {
				toast(copied ? "Share link copied" : "Couldn't copy the link");
				if (copied) track(ANALYTICS_EVENTS.configShareLink, {});
			});
		},
	});
	commands.push({
		id: "config:export-file",
		group: "Configuration",
		label: "Export config file",
		keywords: ["export", "config", "file", "json", "save", "download", "state"],
		tier: "secondary",
		run: () => {
			close();
			downloadConfigFile(getModel());
			track(ANALYTICS_EVENTS.configExportFile, {});
		},
	});
	commands.push({
		id: "config:import-file",
		group: "Configuration",
		label: "Import config file",
		keywords: ["import", "config", "file", "json", "load", "open", "state"],
		tier: "secondary",
		run: () => {
			close();
			void pickConfigFile().then((model) => {
				if (!model) {
					toast("That file didn't contain a valid config");
					return;
				}
				// Panel geometry is device-local and never travels — keep the user's.
				send({ type: "RESTORE_MODEL", payload: { ...model, panelLayout: getModel().panelLayout } });
				toast("Config imported");
				track(ANALYTICS_EVENTS.configImportFile, {});
			});
		},
	});

	return commands;
}
