/**
 * Toggleable feature flags to control which optional UI elements render
 * in the iPod Classic workbench. Set to false to strip down the UI.
 * Change a flag to true to restore the archived element.
 */
export const FEATURE_FLAGS = {
	/**
	 * "Physical Revision" picker — lets the user switch the device to a different
	 * physical iPod revision. ARCHIVED (hidden from the public frontend) because each
	 * revision is a distinct physical assembly whose geometry/build is not finished;
	 * shipping the selector would let users choose a build that doesn't exist yet. When
	 * false, the picker is hidden everywhere and the device stays on the one finished
	 * build (Classic 2008 Black, the store default). Flip to true to restore the picker.
	 */
	SHOW_PHYSICAL_REVISION: false,
	/** Show non-default hardware presets (2007, 6.5 Gen, Silver, Late 160GB). When false, only the default Classic 2008 Black renders. Moot while SHOW_PHYSICAL_REVISION is false (the whole picker is hidden). */
	SHOW_EXTRA_HARDWARE_PRESETS: true,
	/** "iPod OS Original" interaction mode button */
	SHOW_IPOD_OS_ORIGINAL: true,
	/** OKLCH Spectrum case color palette grid */
	SHOW_OKLCH_SPECTRUM: true,
	/** OKLCH Ambient background color palette grid */
	SHOW_OKLCH_AMBIENT: true,
	/** "3D Experience" view mode button */
	SHOW_3D_VIEW_MODE: true,
	/** "Focus Mode" view mode button */
	SHOW_FOCUS_VIEW_MODE: true,
	/** "ASCII Mode" view mode button */
	SHOW_ASCII_VIEW_MODE: true,
	/** Materiality VFX — directional specular sheen, noise texture, rim light, cavity groove, and concave center button shading */
	ENABLE_MATERIALITY: true,
	/** Mechanical center button — deeper press animation with spring-back, enhanced shadow recess, and a distinct physical click sound via Web Audio API */
	ENABLE_MECHANICAL_CENTER_CLICK: true,
} as const;
