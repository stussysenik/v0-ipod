/**
 * THE INTERFACE MOTION TOKENS — durations and easings named by job, not by length.
 *
 * WHY THE MODULE EXISTS. Before this module there was no motion in this repo: every
 * transition was Tailwind's default by omission, so no surface could match another on
 * purpose — only by coincidence. A surface asks for the transition it needs and cannot
 * ask for a number.
 *
 * THE SHIPPED READING (§1.2). The loved row's fade — the reveal of Rename / Save over /
 * Delete on a saved-motion row — is the Tailwind default: 150ms at cubic-bezier(0.4, 0,
 * 0.2, 1). It is recorded here as the `fade` job, measured once and never re-derived.
 *
 * THE GATE. A duration or easing literal in application markup is a gate failure naming
 * the offending file and value (the gate lives in `lib/motion-tokens.test.ts`). This
 * module is the one sanctioned home for those literals — every `className` here is a
 * deliberate literal, and the gate exempts exactly this file.
 *
 * NOT PART OF THE FIGMA BRIDGE. Interface motion is execution, not visual truth: these
 * values are how the surface behaves, not what the surface looks like, so they are not
 * exported through the design-token bridge and its three collections are unchanged.
 *
 * HOW A JOB IS USED. `className` carries the utility the job compiles to — UnoCSS scans
 * this file's source, so the classes are generated — and `durationMs`/`easing` feed
 * inline `transition` styles. One source for both spellings, so a surface that switches
 * from a class to an inline style cannot drift from its own job.
 */

export interface MotionJob {
	/** The job this transition serves — why it exists, not how long it is. */
	readonly job: string;
	/** Duration in milliseconds. */
	readonly durationMs: number;
	/** The CSS easing function the job pairs with. */
	readonly easing: string;
	/** Utility classes the job compiles to, written out so UnoCSS generates them. */
	readonly className: string;
}

/**
 * Fade — 150ms, the Tailwind default, measured on the loved row's command reveal. The
 * quick acknowledgement: opacity and state swaps, hover fills, checkmarks. This is the
 * shipped reading recorded so no later task re-derives it.
 */
export const FADE_JOB: MotionJob = {
	job: "fade",
	durationMs: 150,
	easing: "cubic-bezier(0.4, 0, 0.2, 1)",
	className: "duration-150",
};

/**
 * Press — 100ms ease-out. The tactile acknowledgement: a click wheel's pressed ring, a
 * swatch's press scale, a progress bar filling. Faster than a state change and it exits
 * eagerly, because it is feedback for a finger, not a change of state.
 *
 * THE CONSOLIDATED READING. The press gesture previously read 75–150ms across the app:
 * the click wheel's pressed-ring fade at 75ms, its ring transform at 80ms, its pad and
 * the export progress fill at 100ms, the swatch presses and icon-button hover at 150ms.
 * One gesture, one job: they all hold 100ms ease-out now.
 */
export const PRESS_JOB: MotionJob = {
	job: "press",
	durationMs: 100,
	easing: "cubic-bezier(0, 0, 0.2, 1)",
	className: "duration-100 ease-out",
};

/**
 * Pop — 200ms. A small surface appearing: panels, palettes, toggles. One step above a
 * fade because something arrived; one step below a settle because nothing else moved.
 */
export const POP_JOB: MotionJob = {
	job: "pop",
	durationMs: 200,
	easing: "cubic-bezier(0.4, 0, 0.2, 1)",
	className: "duration-200",
};

/**
 * Settle — 300ms. A state change on a surface that is already there: dimming, fills,
 * switches, toolboxes. The surface does not arrive; it settles into a new state.
 */
export const SETTLE_JOB: MotionJob = {
	job: "settle",
	durationMs: 300,
	easing: "cubic-bezier(0.4, 0, 0.2, 1)",
	className: "duration-300",
};

/**
 * Shift — 500ms. A big-surface cross-fade: the stage background, a device variant swap,
 * a modal. Slow enough to read as a scene change rather than a state change.
 */
export const SHIFT_JOB: MotionJob = {
	job: "shift",
	durationMs: 500,
	easing: "cubic-bezier(0.4, 0, 0.2, 1)",
	className: "duration-500",
};

/**
 * Sweep — 700ms. The longest transitions: a view cross-fading on the workbench. Slow
 * enough that the eye can track two scenes at once.
 */
export const SWEEP_JOB: MotionJob = {
	job: "sweep",
	durationMs: 700,
	easing: "cubic-bezier(0.4, 0, 0.2, 1)",
	className: "duration-700",
};

/**
 * Sheet — 500ms on the sheet's own spring. The mobile control surface's slide and the
 * export page's sheet. The curve was authored inert — a bare `cubic-bezier(...)` token
 * in a className generates no utility, so the live sheet slid on the default ease while
 * the exported HTML (a real CSS string) actually used the spring. Declaring the curve
 * here as a real ease-[...] makes the intended spring real everywhere.
 *
 * THE CONSOLIDATED READING. The exported page's sheet read 0.4s; the live surface read
 * 500ms. One gesture, one job: both hold 500ms now.
 */
export const SHEET_JOB: MotionJob = {
	job: "sheet",
	durationMs: 500,
	easing: "cubic-bezier(0.16, 1, 0.3, 1)",
	className: "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
};

/**
 * Hover — 130ms on the instrument's ease. The precision-instrument control language's
 * acknowledgement: quick, with the instrument curve (ease-out, no bounce). This is the
 * shipped reading from the studio controls' own timing table, absorbed here.
 */
export const HOVER_JOB: MotionJob = {
	job: "hover",
	durationMs: 130,
	easing: "cubic-bezier(0.22, 1, 0.36, 1)",
	className: "duration-[130ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
};

/**
 * Select — 220ms on the instrument's ease. The precision-instrument control language's
 * deliberate state change: selection fills, focus rings. Slower than hover because it
 * is a commitment, not an acknowledgement.
 */
export const SELECT_JOB: MotionJob = {
	job: "select",
	durationMs: 220,
	easing: "cubic-bezier(0.22, 1, 0.36, 1)",
	className: "duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
};

/**
 * Shutter flash — 600ms ease-out. The camera shutter's white flash on export. A
 * keyframed animation, so the job holds the whole `animate-[...]` string.
 */
export const SHUTTER_FLASH_JOB: MotionJob = {
	job: "shutter-flash",
	durationMs: 600,
	easing: "ease-out",
	className: "animate-[shutterFlash_0.6s_ease-out_forwards]",
};

/**
 * Shutter blade — 600ms on the blade curve. One half of the shutter's closing aperture.
 * The blade pairs share a name family because they share a gesture.
 */
export const SHUTTER_BLADE_JOB: MotionJob = {
	job: "shutter-blade",
	durationMs: 600,
	easing: "cubic-bezier(0.19, 1, 0.22, 1)",
	className: "animate-[shutterBladeDown_0.6s_cubic-bezier(0.19,1,0.22,1)_forwards]",
};

/**
 * Shutter blade — the aperture's other half. Same timing as `shutter-blade`, different
 * keyframe: the two halves close toward each other.
 */
export const SHUTTER_BLADE_UP_JOB: MotionJob = {
	job: "shutter-blade-up",
	durationMs: 600,
	easing: "cubic-bezier(0.19, 1, 0.22, 1)",
	className: "animate-[shutterBladeUp_0.6s_cubic-bezier(0.19,1,0.22,1)_forwards]",
};

/**
 * Shutter scan — 500ms linear, looping. The aperture's scanning line. Linear because it
 * is a mechanism, not a gesture.
 */
export const SHUTTER_SCAN_JOB: MotionJob = {
	job: "shutter-scan",
	durationMs: 500,
	easing: "linear",
	className: "animate-[shutterScan_0.5s_infinite_linear]",
};

/** Every named job, keyed by the job it serves. No two entries share a name. */
export const interfaceMotion = {
	fade: FADE_JOB,
	press: PRESS_JOB,
	pop: POP_JOB,
	settle: SETTLE_JOB,
	shift: SHIFT_JOB,
	sweep: SWEEP_JOB,
	sheet: SHEET_JOB,
	hover: HOVER_JOB,
	select: SELECT_JOB,
	"shutter-flash": SHUTTER_FLASH_JOB,
	"shutter-blade": SHUTTER_BLADE_JOB,
	"shutter-blade-up": SHUTTER_BLADE_UP_JOB,
	"shutter-scan": SHUTTER_SCAN_JOB,
} as const satisfies Record<string, MotionJob>;
