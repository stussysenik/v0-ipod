/**
 * Toggleable feature flags to control which optional UI elements render
 * in the iPod Classic workbench. Set to false to strip down the UI.
 * Change a flag to true to restore the archived element.
 */
export const FEATURE_FLAGS = {
	/** Show non-default hardware presets (2007, 6.5 Gen, Silver, Late 160GB). When false, only the default Classic 2008 Black renders. */
	SHOW_EXTRA_HARDWARE_PRESETS: false,
	/** "iPod OS Original" interaction mode button */
	SHOW_IPOD_OS_ORIGINAL: false,
	/** OKLCH Spectrum case color palette grid */
	SHOW_OKLCH_SPECTRUM: false,
	/** OKLCH Ambient background color palette grid */
	SHOW_OKLCH_AMBIENT: false,
	/** "3D Experience" view mode button */
	SHOW_3D_VIEW_MODE: false,
	/** "Focus Mode" view mode button */
	SHOW_FOCUS_VIEW_MODE: false,
	/** "ASCII Mode" view mode button */
	SHOW_ASCII_VIEW_MODE: false,
} as const;
