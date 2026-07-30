import { describe, expect, it } from "vitest";

import { CATALOGUE_DOCS } from "@/lib/motion/catalogue";
import { resolveMotionDoc } from "@/lib/motion/doc";
import {
	applyTrackEdit,
	isPristineTrack,
	PRISTINE_TRACK_EDIT,
	readTrackEdit,
} from "@/lib/motion/track-edit";

import { createInitialStudioState } from "./model";
import type { IpodWorkbenchModel } from "./model";
import { ipodWorkbenchReducer } from "./update";

/**
 * THE OVERRIDE LIFECYCLE — set, clear, and the difference between the two ways of getting
 * back to where you started.
 *
 * A tuned track stores a whole `MotionTrack` laid over the catalogue document (D7). The
 * inspector's drag can end on the shipped values, and at that instant the look has a
 * choice: store a copy of the base, or drop the override. They sample identically today and
 * diverge the moment the catalogue document is revised — a stored copy stops tracking it,
 * which is exactly the defect `update-studio-theme-authoring` measured on a saved theme's
 * rig. `CLEAR_MOTION_TRACK` is what makes the second reachable from the surface.
 */

const ORBIT = CATALOGUE_DOCS.orbit;

function baseModel(): IpodWorkbenchModel {
	// Motion patches only the studio slice (patchMotion → patchStudio).
	return { studio: createInitialStudioState() } as IpodWorkbenchModel;
}

const HALF_AZIMUTH = applyTrackEdit(ORBIT.tracks.azimuth, { ...PRISTINE_TRACK_EDIT, gain: 0.5 });
const SHIFTED_ELEVATION = applyTrackEdit(ORBIT.tracks.elevation, {
	...PRISTINE_TRACK_EDIT,
	phase: 0.25,
});

describe("tuning one track", () => {
	it("creates the override map on the first edit and leaves siblings tracking the base", () => {
		const next = ipodWorkbenchReducer(baseModel(), {
			type: "SET_MOTION_TRACK",
			payload: { trackKey: "azimuth", track: HALF_AZIMUTH },
		});
		expect(Object.keys(next.studio.motion.overrides?.tracks ?? {})).toEqual(["azimuth"]);

		const flown = resolveMotionDoc(ORBIT, next.studio.motion.overrides);
		expect(readTrackEdit(ORBIT.tracks.azimuth, flown.tracks.azimuth).gain).toBe(0.5);
		expect(flown.tracks.elevation).toBe(ORBIT.tracks.elevation);
		expect(flown.tracks.reach).toBe(ORBIT.tracks.reach);
	});

	it("accumulates a second track without disturbing the first", () => {
		const model = [
			{ type: "SET_MOTION_TRACK", payload: { trackKey: "azimuth", track: HALF_AZIMUTH } },
			{ type: "SET_MOTION_TRACK", payload: { trackKey: "elevation", track: SHIFTED_ELEVATION } },
		].reduce<IpodWorkbenchModel>(
			(next, action) => ipodWorkbenchReducer(next, action as never),
			baseModel(),
		);
		expect(Object.keys(model.studio.motion.overrides?.tracks ?? {}).sort()).toEqual([
			"azimuth",
			"elevation",
		]);
		expect(model.studio.motion.overrides?.tracks?.azimuth).toEqual(HALF_AZIMUTH);
	});
});

describe("untuning one track", () => {
	function tuned(): IpodWorkbenchModel {
		return [
			{ type: "SET_MOTION_TRACK", payload: { trackKey: "azimuth", track: HALF_AZIMUTH } },
			{ type: "SET_MOTION_TRACK", payload: { trackKey: "elevation", track: SHIFTED_ELEVATION } },
		].reduce<IpodWorkbenchModel>(
			(next, action) => ipodWorkbenchReducer(next, action as never),
			baseModel(),
		);
	}

	it("drops the track rather than storing a copy of the base", () => {
		const cleared = ipodWorkbenchReducer(tuned(), {
			type: "CLEAR_MOTION_TRACK",
			payload: "azimuth",
		});
		expect(cleared.studio.motion.overrides?.tracks).not.toHaveProperty("azimuth");
		expect(cleared.studio.motion.overrides?.tracks?.elevation).toEqual(SHIFTED_ELEVATION);
		// Tracking the catalogue again means the SAME object, not an equal one.
		expect(resolveMotionDoc(ORBIT, cleared.studio.motion.overrides).tracks.azimuth).toBe(
			ORBIT.tracks.azimuth,
		);
	});

	it("collapses to pristine once the last track is dropped", () => {
		// `{ tracks: {} }` samples identically and is not pristine: it survives the codec, so
		// a look that was tuned and untuned would encode differently from one never touched.
		const cleared = ["azimuth", "elevation"].reduce<IpodWorkbenchModel>(
			(next, key) => ipodWorkbenchReducer(next, { type: "CLEAR_MOTION_TRACK", payload: key }),
			tuned(),
		);
		expect(cleared.studio.motion.overrides).toBeUndefined();
		expect("overrides" in cleared.studio.motion).toBe(false);
	});

	it("is a no-op for a track that was never tuned", () => {
		const model = tuned();
		expect(ipodWorkbenchReducer(model, { type: "CLEAR_MOTION_TRACK", payload: "reach" }).studio
			.motion.overrides).toBe(model.studio.motion.overrides);
	});

	it("leaves a cleared track sampling exactly as the catalogue does", () => {
		const cleared = ipodWorkbenchReducer(tuned(), {
			type: "CLEAR_MOTION_TRACK",
			payload: "azimuth",
		});
		const flown = resolveMotionDoc(ORBIT, cleared.studio.motion.overrides);
		expect(isPristineTrack(ORBIT.tracks.azimuth, flown.tracks.azimuth)).toBe(true);
	});
});

describe("switching documents", () => {
	it("clears the overrides, because a diff belongs to the base it was authored against", () => {
		const tuned = ipodWorkbenchReducer(baseModel(), {
			type: "SET_MOTION_TRACK",
			payload: { trackKey: "azimuth", track: HALF_AZIMUTH },
		});
		const switched = ipodWorkbenchReducer(tuned, { type: "SET_MOTION_DOC", payload: "crane" });
		expect(switched.studio.motion.docId).toBe("crane");
		expect(switched.studio.motion.overrides).toBeUndefined();
	});
});
