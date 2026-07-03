import posthog from "posthog-js";

/**
 * Centralized, vendor-neutral analytics surface.
 *
 * Call sites import `track` + a name from ANALYTICS_EVENTS — they never touch the
 * PostHog client directly, so swapping the backend (or turning it off) is a
 * one-file change. `track` no-ops cleanly until the client is initialized (e.g.
 * local dev with no key), so adding a `track()` call can never throw or block an
 * interaction.
 *
 * Autocapture already records DOM clicks/taps (the click wheel, menu items). Use
 * these named events for semantic signals autocapture can't infer — canvas
 * drag-orbit, exports, and other non-DOM gestures.
 */
export const ANALYTICS_EVENTS = {
	wheelScrub: "ipod.wheel_scrub",
	menuSelect: "ipod.menu_select",
	threeDOrbit: "ipod.3d_orbit",
	threeDFocusChange: "ipod.3d_focus_change",
	threeDExport: "ipod.3d_export",
	configShareLink: "ipod.config_share_link",
	configExportFile: "ipod.config_export_file",
	configImportFile: "ipod.config_import_file",
} as const;

export type AnalyticsEvent =
	(typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export function track(
	event: AnalyticsEvent,
	props?: Record<string, unknown>,
): void {
	if (typeof window === "undefined") return;
	if (!posthog.__loaded) return;
	posthog.capture(event, props);
}
