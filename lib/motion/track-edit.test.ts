import { describe, expect, it } from "vitest";

import type { StudioPose } from "../studio-camera";
import { createClipPoseSampler, documentClip } from "../studio-clip-presets";
import { EASINGS } from "../theatre/easings";
import { CATALOGUE_DOCS } from "./catalogue";
import type { MotionTrack } from "./doc";
import {
	applyTrackEdit,
	curveLabel,
	isPristineTrack,
	MAX_TRACK_GAIN,
	orderedTrackKeys,
	PRISTINE_TRACK_EDIT,
	readTrackEdit,
	trackCurveLabel,
	trackLabel,
	trackPeak,
	trackReadout,
	unifiedEase,
} from "./track-edit";
import { DEFAULT_TURNAROUND } from "./transport";

const ORBIT = CATALOGUE_DOCS.orbit;
const TURNTABLE = CATALOGUE_DOCS.turntable;
const HERO: StudioPose = { azimuth: 30, elevation: -10, reach: 2.4, target: [0, 0.1, 0] };

describe("track readout — the value a row carries beside its name", () => {
	it("reads a symmetric sway as ±amplitude", () => {
		// §6.2's example, and the spec scenario "a control shows its value".
		expect(trackReadout("azimuth", ORBIT.tracks.azimuth)).toBe("±17°");
		expect(trackReadout("elevation", ORBIT.tracks.elevation)).toBe("±2°");
	});

	it("reads a full turn as the turn, not as half of it either side", () => {
		// The case that forces three shapes: ±180° would name a move the turntable is not.
		expect(trackReadout("azimuth", TURNTABLE.tracks.azimuth)).toBe("360°");
	});

	it("reads a one-directional dolly as its extent", () => {
		expect(trackReadout("reach", TURNTABLE.tracks.reach)).toBe("1.00");
	});

	it("reads an offset dolly as the range it covers", () => {
		// Orbit's reach is a raised cosine with a DC term: it is neither symmetric about the
		// hero nor anchored at it, and a single number would misstate where it sits.
		expect(trackReadout("reach", ORBIT.tracks.reach)).toBe("-0.15…0.65");
	});

	it("names unknown track keys from the key itself", () => {
		expect(trackLabel("azimuth")).toBe("Azimuth");
		expect(trackLabel("targetX")).toBe("Target X");
		expect(trackLabel("keyLightIntensity")).toBe("Key Light Intensity");
	});

	it("orders known axes first and anything else after, deterministically", () => {
		expect(orderedTrackKeys({ reach: ORBIT.tracks.reach, azimuth: ORBIT.tracks.azimuth })).toEqual(
			["azimuth", "reach"],
		);
		expect(
			orderedTrackKeys({ zzz: ORBIT.tracks.azimuth, aaa: ORBIT.tracks.azimuth, reach: ORBIT.tracks.reach }),
		).toEqual(["reach", "aaa", "zzz"]);
	});
});

describe("the edit round trip", () => {
	it("recovers every catalogue track exactly — read then apply is the identity", () => {
		// The strong claim: it must hold for a MIXED track (alternating quarter sines), a
		// UNIFIED one (turntable's linear azimuth), and a FITTED one (crane's elevation,
		// whose every segment carries a different hand-fitted tuple).
		for (const doc of Object.values(CATALOGUE_DOCS)) {
			for (const [key, base] of Object.entries(doc.tracks)) {
				const round = applyTrackEdit(base, readTrackEdit(base, base));
				expect(isPristineTrack(base, round), `${doc.id}.${key}`).toBe(true);
			}
		}
	});

	it("stores no override for an untouched track", () => {
		const round = applyTrackEdit(ORBIT.tracks.azimuth, PRISTINE_TRACK_EDIT);
		expect(isPristineTrack(ORBIT.tracks.azimuth, round)).toBe(true);
	});

	it("derives every edit from the base, so a drag away and back is exact", () => {
		// Chaining edit onto edit would leave 17 × 0.4 × 2.5 = 16.999999999999996 and a
		// track that is permanently, invisibly off the catalogue.
		const base = ORBIT.tracks.azimuth;
		const away = applyTrackEdit(base, { ...PRISTINE_TRACK_EDIT, gain: 0.4 });
		expect(isPristineTrack(base, away)).toBe(false);
		const back = applyTrackEdit(base, { ...PRISTINE_TRACK_EDIT, gain: 1 });
		expect(isPristineTrack(base, back)).toBe(true);
	});

	it("recovers the gain a stored track represents", () => {
		const base = ORBIT.tracks.azimuth;
		const stored = applyTrackEdit(base, { ...PRISTINE_TRACK_EDIT, gain: 0.5 });
		expect(trackPeak(stored)).toBe(8.5);
		expect(readTrackEdit(base, stored).gain).toBe(0.5);
		expect(trackReadout("azimuth", stored)).toBe("±8.5°");
	});

	it("reports pristine for a flat base rather than dividing by zero", () => {
		const flat: MotionTrack = { keyframes: [{ at: 0, value: 0 }, { at: 1, value: 0 }] };
		expect(readTrackEdit(flat, flat).gain).toBe(1);
	});

	it("wraps a stored phase into the cycle both ways", () => {
		const base = ORBIT.tracks.azimuth;
		expect(readTrackEdit(base, applyTrackEdit(base, { ...PRISTINE_TRACK_EDIT, phase: 1.25 })).phase)
			.toBeCloseTo(0.25, 12);
		expect(readTrackEdit(base, applyTrackEdit(base, { ...PRISTINE_TRACK_EDIT, phase: -0.25 })).phase)
			.toBeCloseTo(0.75, 12);
	});

	it("writes only the track it is given", () => {
		const edited = applyTrackEdit(ORBIT.tracks.azimuth, { ...PRISTINE_TRACK_EDIT, phase: 0.3 });
		expect(edited.phase).toBe(0.3);
		expect(ORBIT.tracks.azimuth.phase).toBeUndefined();
		expect(ORBIT.tracks.elevation.phase).toBeUndefined();
	});
});

describe("gain zero is the hero, in closed form", () => {
	it("flies the composed pose at every phase", () => {
		// The same claim `poseAtProgress` makes for `repeat: 0`: a document's tracks are
		// offsets, so zero amplitude IS the composed pose. The two knobs mean one thing at
		// their zero rather than two things that resemble each other. Asserted on the POSE
		// rather than the offsets, because a `-2 × 0` offset is `-0` and `hero + -0` is the
		// hero — the sign of a zero offset is not a property of the camera.
		const held = {
			...ORBIT,
			tracks: Object.fromEntries(
				Object.entries(ORBIT.tracks).map(([key, track]) => [
					key,
					applyTrackEdit(track, { ...PRISTINE_TRACK_EDIT, gain: 0 }),
				]),
			),
		};
		const sample = createClipPoseSampler(documentClip(held), HERO);
		for (let i = 0; i < 200; i += 1) {
			expect(sample(i / 200), `phase ${i / 200}`).toEqual(HERO);
		}
	});
});

describe("the curve a track carries", () => {
	it("reads a pristine alternating track as Mixed, not as a curve it does not have", () => {
		expect(unifiedEase(ORBIT.tracks.azimuth)).toBeNull();
		expect(trackCurveLabel(ORBIT.tracks.azimuth)).toBe("Mixed");
	});

	it("reads a uniformly authored track by its name", () => {
		expect(unifiedEase(TURNTABLE.tracks.azimuth)).toBe("linear");
		expect(trackCurveLabel(TURNTABLE.tracks.azimuth)).toBe("linear");
	});

	it("ignores the last keyframe, whose outgoing curve is never read", () => {
		// The catalogue leaves it unset; counting it would report every track as Mixed.
		expect(TURNTABLE.tracks.azimuth.keyframes.at(-1)?.easing).toBeUndefined();
		expect(unifiedEase(TURNTABLE.tracks.azimuth)).not.toBeNull();
	});

	it("unifies every segment when a curve is dragged, and leaves the closing keyframe", () => {
		const edited = applyTrackEdit(ORBIT.tracks.azimuth, {
			...PRISTINE_TRACK_EDIT,
			curve: "easeInOutSine",
		});
		expect(edited.keyframes.slice(0, -1).every((kf) => kf.easing === "easeInOutSine")).toBe(true);
		expect(edited.keyframes.at(-1)?.easing).toBe(ORBIT.tracks.azimuth.keyframes.at(-1)?.easing);
		expect(trackCurveLabel(edited)).toBe("easeInOutSine");
		expect(isPristineTrack(ORBIT.tracks.azimuth, edited)).toBe(false);
	});

	it("names a dragged tuple that lands exactly on the vocabulary, and Custom otherwise", () => {
		expect(curveLabel([...EASINGS.easeInOutSine])).toBe("easeInOutSine");
		expect(curveLabel([0.4, 0.1, 0.6, 0.9])).toBe("Custom");
	});

	it("compares a named curve and its control points as the same track", () => {
		const named = applyTrackEdit(ORBIT.tracks.azimuth, {
			...PRISTINE_TRACK_EDIT,
			curve: "easeInOutSine",
		});
		const tuple = applyTrackEdit(ORBIT.tracks.azimuth, {
			...PRISTINE_TRACK_EDIT,
			curve: [...EASINGS.easeInOutSine],
		});
		expect(isPristineTrack(named, tuple)).toBe(true);
	});

	it("pins the boomerang turnaround as unnamed", () => {
		// [0.5, 0, 0.5, 1] is a measured pick, not a vocabulary entry — the row reads Custom
		// and that is correct. If a named curve ever equals it, this test says so.
		expect(curveLabel(DEFAULT_TURNAROUND)).toBe("Custom");
	});
});

describe("the gain ceiling", () => {
	it("is a control bound, and the format holds anything", () => {
		const wide = applyTrackEdit(ORBIT.tracks.azimuth, {
			...PRISTINE_TRACK_EDIT,
			gain: MAX_TRACK_GAIN,
		});
		expect(trackPeak(wide)).toBe(34);
		expect(readTrackEdit(ORBIT.tracks.azimuth, wide).gain).toBe(MAX_TRACK_GAIN);
	});
});
