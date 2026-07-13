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
	/**
	 * Inline "3D Experience" view mode — a second, lesser 3D iPod rendered *inside* the 2D
	 * workbench. ARCHIVED: `/3d` is the one 3D truth (spec: surface-mode-switching), and the
	 * rail now navigates there instead of toggling an inline mode. The inline render path and
	 * its `viewMode:"3d"` are left intact behind this flag; flip to true to restore.
	 */
	SHOW_3D_VIEW_MODE: false,
	/** "Focus Mode" view mode. ARCHIVED — not a proven surface; the rail ships flat/preview only. */
	SHOW_FOCUS_VIEW_MODE: false,
	/** "ASCII Mode" view mode. ARCHIVED — shipped as WIP; flip to true to restore. */
	SHOW_ASCII_VIEW_MODE: false,
	/**
	 * Transport + reset on the `/` rail. ARCHIVED: the device's own click wheel already plays
	 * and pauses, so a second transport is a duplicate control surface; reset lives in ⌘K.
	 */
	SHOW_WORKBENCH_TRANSPORT: false,
	/**
	 * The 2D export rail on `/` (PNG still, GIF, MP4). ARCHIVED: `/3d` owns the real export
	 * dock, and on the shared link these read as authoring chrome rather than the product.
	 * The whole 2D export pipeline is intact behind this flag — flip to true to restore it
	 * (tests/export-downloads.spec.ts drives these buttons and is skipped while it is false).
	 */
	SHOW_WORKBENCH_EXPORTS: false,
	/**
	 * User-authored camera points on `/3d` — the saved studio shots (`＋ Shot` + its chips in
	 * the camera bar) and the camera cockpit's numeric "Save pose" presets.
	 *
	 * ARCHIVED (spec: camera-control-truth): the camera must move deterministically, and a
	 * user-saved point is an arbitrary pose whose framing is not guaranteed to fit the
	 * viewport it is recalled on. `/3d` ships the SIX named angle presets only — a closed,
	 * proven set. The shots/presets code paths and their persisted store entries are intact;
	 * flip to true to restore both surfaces.
	 */
	SHOW_CUSTOM_CAMERA_POSES: false,
	/** Materiality VFX — directional specular sheen, noise texture, rim light, cavity groove, and concave center button shading */
	ENABLE_MATERIALITY: true,
	/** Mechanical center button — deeper press animation with spring-back, enhanced shadow recess, and a distinct physical click sound via Web Audio API */
	ENABLE_MECHANICAL_CENTER_CLICK: true,
} as const;
