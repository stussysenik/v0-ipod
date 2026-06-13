import { getProject, types } from "@theatre/core";

import {
	CAMERA_OBJECT_KEY,
	CAMERA_PROP_RANGES,
	CAMERA_SHEET_ID,
	defaultCameraProps,
	THEATRE_PROJECT_ID,
} from "./studio-project";

/**
 * Browser-side Theatre.js wiring.
 *
 * This is the AUTHORING half of the integration — the studio timeline GUI a
 * designer uses to keyframe the camera. It is deliberately decoupled from
 * `@react-three/fiber`: the `@theatre/r3f` editor extension still targets R3F 8
 * and is unverified on our R3F 9 scene, so we drive the studio purely through
 * `@theatre/core` numeric props (azimuth / elevation / reach / target). The
 * designer keyframes those, exports the project state JSON, and that state drops
 * straight into the moment-card catalogue — read back by the same pure sampler the
 * export pipeline uses (proven identical by the parity test).
 *
 * Studio is loaded dynamically and only outside production, so it never ships in
 * the production bundle and never touches the export path.
 */

/** Build the camera object's animatable numeric props from the studio ranges. */
export function cameraObjectProps() {
	const d = defaultCameraProps();
	const range = (name: keyof typeof CAMERA_PROP_RANGES): [number, number] => [
		CAMERA_PROP_RANGES[name].min,
		CAMERA_PROP_RANGES[name].max,
	];
	return {
		azimuth: types.number(d.azimuth, { range: range("azimuth") }),
		elevation: types.number(d.elevation, { range: range("elevation") }),
		reach: types.number(d.reach, { range: range("reach") }),
		targetX: types.number(d.targetX, { range: range("targetX") }),
		targetY: types.number(d.targetY, { range: range("targetY") }),
		targetZ: types.number(d.targetZ, { range: range("targetZ") }),
	};
}

/** Get (or lazily create) the camera sheet + object for the studio. */
export function getCameraSheet() {
	const sheet = getProject(THEATRE_PROJECT_ID).sheet(CAMERA_SHEET_ID);
	const object = sheet.object(CAMERA_OBJECT_KEY, cameraObjectProps());
	return { sheet, object };
}

/**
 * The live studio instance, cached after the first successful init. Theatre's
 * `studio.initialize()` can only run once per page (it wires global listeners and a
 * full-screen overlay), so the toggle never re-initializes — it flips visibility via
 * `studio.ui.hide()` / `studio.ui.restore()` on this same instance.
 */
type TheatreStudio = Awaited<typeof import("@theatre/studio")>["default"];
let studioInstance: TheatreStudio | null = null;
let initPromise: Promise<TheatreStudio | null> | null = null;

/**
 * Lazily initialize the Theatre.js studio GUI for camera authoring. Dev/browser
 * only, idempotent (the in-flight promise is shared so concurrent enables don't
 * double-init), and fully guarded — any incompatibility fails soft (logged, never
 * crashing the app) since the studio is an optional authoring aid.
 */
export async function initTheatreStudioDev(): Promise<TheatreStudio | null> {
	if (typeof window === "undefined") return null;
	if (studioInstance) return studioInstance;
	if (initPromise) return initPromise;
	initPromise = (async () => {
		try {
			const studio = (await import("@theatre/studio")).default;
			studio.initialize();
			// Register the camera object so it appears in the studio outline + timeline.
			getCameraSheet();
			studioInstance = studio;
			return studio;
		} catch (error) {
			console.warn("[theatre] studio init skipped:", error);
			initPromise = null; // allow a later retry
			return null;
		}
	})();
	return initPromise;
}

/**
 * Show or hide the studio overlay. Enabling lazily initializes on first use; once
 * the heavy studio is alive we only toggle its UI, so re-enabling is instant and the
 * authored timeline state is preserved across toggles. Used by the cockpit switch and
 * by the export pipeline (force-hide during a bake so the overlay never leaks into a
 * rendered frame or steals pointer/keyboard focus mid-capture).
 */
export async function setTheatreStudioVisible(visible: boolean): Promise<void> {
	if (typeof window === "undefined") return;
	if (!visible && !studioInstance) return; // nothing to hide; don't pay init cost
	const studio = await initTheatreStudioDev();
	if (!studio) return;
	try {
		if (visible) {
			if (studio.ui.isHidden) studio.ui.restore();
		} else if (!studio.ui.isHidden) {
			studio.ui.hide();
		}
	} catch (error) {
		console.warn("[theatre] studio visibility toggle skipped:", error);
	}
}
