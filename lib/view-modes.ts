import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { IpodViewMode } from "@/lib/ipod-state/model";

export interface ViewModeOption {
	id: IpodViewMode;
	label: string;
	enabled: boolean;
}

/**
 * The view modes offered across the UI, with their feature gating in one place so the
 * floating-panel "View" panel and the command palette agree on what is switchable.
 * `flat` and `preview` are always on; the richer modes ride feature flags.
 */
export function availableViewModes(): ViewModeOption[] {
	const modes: ViewModeOption[] = [
		{ id: "flat", label: "Flat", enabled: true },
		{ id: "preview", label: "Preview", enabled: true },
		{ id: "3d", label: "3D Experience", enabled: FEATURE_FLAGS.SHOW_3D_VIEW_MODE },
		{ id: "focus", label: "Focus Mode", enabled: FEATURE_FLAGS.SHOW_FOCUS_VIEW_MODE },
		{ id: "ascii", label: "ASCII Mode", enabled: FEATURE_FLAGS.SHOW_ASCII_VIEW_MODE },
	];
	return modes.filter((mode) => mode.enabled);
}
