import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	createClipPoseSampler,
	documentClip,
	findStudioClip,
	STUDIO_CLIPS,
	type StudioClip,
} from "../studio-clip-presets";
import type { StudioPose } from "../studio-camera";
import { CATALOGUE_DOCS } from "./catalogue";
import { motionDocHash, type MotionDoc, type MotionOverrides, type MotionTrack } from "./doc";
import {
	MAX_REPEAT,
	MIN_DURATION_SEC,
	type MotionCadence,
} from "./motion-state";
import { MOTION_SHELF_STORAGE_KEY } from "@/lib/workspace-storage";
import {
	MAX_SAVED_MOTIONS,
	deleteMotion,
	findMotionDoc,
	flownMotionDoc,
	loadSavedMotions,
	motionCatalogue,
	motionClipFor,
	nextMotionLabel,
	overwriteMotion,
	persistSavedMotions,
	renameMotion,
	resolveFlownDoc,
	resolveMotionDocById,
	openSavedMotion,
	saveMotionAs,
} from "./motion-shelf";

/**
 * THE SHELF'S ONE INVERTED RULE, tested directly.
 *
 * A theme stores its rig by NAME plus a sparse override, so a later revision of the preset
 * reaches it. A shelf entry stores the document WHOLE, because "Orbit — slow" must NOT
 * change when Orbit changes — that is the whole meaning of having saved it. The two are
 * consistent (a theme's rig is a reference; a shelf entry is a definition) and the
 * difference is only checkable by mutating the origin and sampling the copy, which is what
 * §4b.3 asks for.
 *
 * The second claim here is §4b.4's: a dangling `docId` heals in exactly ONE place. Deletion
 * deliberately leaves the pointer dangling rather than rewriting it, so two healers would be
 * two places that can disagree about what the motion became.
 */

/**
 * The cadence a save captures — what the TRANSPORT was set to, which is not the document's own
 * natural cycle. A shelf row states this, so it has to be stored rather than re-derived.
 */
const CADENCE: MotionCadence = { repeat: 2, durationSec: 8, timeMap: { kind: "loop" } };

const HERO: StudioPose = { azimuth: 24, elevation: -8, reach: 2.6, target: [0, 0.05, 0] };
const PHASES = Array.from({ length: 33 }, (_, i) => i / 32);

/** Every pose a document flies across one cycle — the only definition of "samples the same". */
function cycle(doc: MotionDoc): StudioPose[] {
	const sample = createClipPoseSampler(documentClip(doc), HERO);
	return PHASES.map(sample);
}

/** A hand-authored track: the shape only a document can express. */
const TUNED: MotionTrack = {
	keyframes: [
		{ at: 0, value: 0, easing: [0.12, 0.83, 0.4, 0.97] },
		{ at: 0.5, value: -9.5, easing: "easeInOutCubic" },
		{ at: 1, value: 0 },
	],
	phase: 0.37,
};

/** A stand-in for a catalogue entry a later revision edits. Deep enough to mutate safely. */
function mutableOrigin(): MotionDoc {
	const base = CATALOGUE_DOCS.orbit;
	return {
		...base,
		tracks: Object.fromEntries(
			Object.entries(base.tracks).map(([key, track]) => [
				key,
				{ ...track, keyframes: track.keyframes.map((kf) => ({ ...kf })) },
			]),
		),
	};
}

describe("a saved motion stops tracking what it came from", () => {
	it("samples identically after the document it was derived from changes", () => {
		const origin = mutableOrigin();
		const [entry] = saveMotionAs([], origin, CADENCE, "saved-1", "Orbit — slow");
		const atSaveTime = cycle(entry.doc);

		// The catalogue revises the move: a different sway amplitude on the azimuth track.
		origin.tracks.azimuth.keyframes[1].value = -40;
		origin.naturalCycleSeconds = 12;

		expect(cycle(origin)).not.toEqual(atSaveTime); // the revision is real, not a no-op
		expect(cycle(entry.doc)).toEqual(atSaveTime); // and the save did not follow it
	});

	it("copies keyframe objects rather than aliasing them", () => {
		const origin = mutableOrigin();
		const [entry] = saveMotionAs([], origin, CADENCE, "saved-1");
		expect(entry.doc.tracks.azimuth).not.toBe(origin.tracks.azimuth);
		expect(entry.doc.tracks.azimuth.keyframes[0]).not.toBe(origin.tracks.azimuth.keyframes[0]);
	});

	it("saves what was FLYING — the resolved document, re-identified", () => {
		const flown = resolveFlownDoc("orbit", { tracks: { azimuth: TUNED } });
		const [entry] = saveMotionAs([], flown, CADENCE, "saved-1", "Mine");

		expect(entry.doc.id).toBe("saved-1");
		expect(entry.doc.label).toBe("Mine");
		// The tuning is the saved document's own data, not a diff against Orbit.
		expect(entry.doc.tracks.azimuth.keyframes).toEqual(TUNED.keyframes);
		expect(cycle(entry.doc)).toEqual(cycle(flown));
	});

	it("keeps its identity across a rename — a label never moved a camera", () => {
		const saved = saveMotionAs([], CATALOGUE_DOCS.crane, CADENCE, "saved-1", "Before");
		const renamed = renameMotion(saved, "saved-1", "After");
		expect(renamed[0].id).toBe("saved-1");
		expect(motionDocHash(renamed[0].doc)).toBe(motionDocHash(saved[0].doc));
		expect(renameMotion(saved, "saved-1", "   ")).toEqual(saved); // blank is a no-op
	});
});

describe("resolving an id", () => {
	const saved = saveMotionAs([], CATALOGUE_DOCS.crane, CADENCE, "saved-1", "Mine");

	it("finds catalogue, shelf and moment documents in one list", () => {
		expect(findMotionDoc("orbit")?.label).toBe("Orbit");
		expect(findMotionDoc("saved-1", saved)?.label).toBe("Mine");
		expect(findMotionDoc("nothing-by-this-name")).toBeUndefined();
	});

	it("heals a dangling pointer to Orbit — deletion leaves it dangling on purpose", () => {
		const afterDelete = deleteMotion(saved, "saved-1");
		expect(afterDelete).toHaveLength(0);
		expect(resolveMotionDocById("saved-1", afterDelete).id).toBe("orbit");
	});

	it("lists shipped moves first, then saved, then moments behind the dev toggle", () => {
		const shipped = Object.keys(CATALOGUE_DOCS).length;
		expect(motionCatalogue(saved)).toHaveLength(shipped + 1);
		expect(motionCatalogue(saved)[shipped].id).toBe("saved-1");
		expect(motionCatalogue(saved, { includeMoments: true }).length).toBeGreaterThan(shipped + 1);
	});
});

describe("which engine flies a motion", () => {
	const saved = saveMotionAs([], CATALOGUE_DOCS.crane, CADENCE, "saved-1", "Mine");

	it("keeps the generator for an untouched preset — swapping it is §2.9's gated move", () => {
		expect(motionClipFor("orbit", undefined).kind).toBe("procedural");
	});

	it("switches to the document the moment an override exists", () => {
		const clip = motionClipFor("orbit", { tracks: { azimuth: TUNED } });
		expect(clip.kind).toBe("document");
		// There is no generator for "Orbit, but the azimuth curve dragged": the clip flies the
		// resolved document, tuning included.
		const flown = PHASES.map(createClipPoseSampler(clip, HERO));
		expect(flown).toEqual(cycle(resolveFlownDoc("orbit", { tracks: { azimuth: TUNED } })));
		expect(flown).not.toEqual(cycle(CATALOGUE_DOCS.orbit));
	});

	it("flies a saved motion as a document", () => {
		expect(motionClipFor("saved-1", undefined, saved).kind).toBe("document");
	});

	it("heals an unknown id to Orbit rather than refusing to fly", () => {
		const clip = motionClipFor("deleted-yesterday", undefined, []);
		expect(clip.kind).toBe("document");
		expect(clip.id).toBe("orbit");
	});
});

/**
 * THE DECISION HAS TO REACH THE RIG, and `flownMotionDoc` is how it travels.
 *
 * `CameraPreviewState.doc` and `ClipRenderOptions.doc` take a document, not a clip, so the
 * "present IFF the document engine flies it" invariant has to hold somewhere checkable.
 * Handing them `resolveFlownDoc` instead would swap the engine under an untouched preset —
 * §2.9's gated 0.2116° move — because every preset resolves to a document whether or not
 * anything was tuned.
 *
 * The last case is the defect this closed: the proof planned poses from `motionClipFor`
 * (§5.5) while the rig resolved `move: string` through `findStudioClip`, so a tuned motion
 * was proved tuned and flown untuned. The reading is recorded at the assertion.
 */
describe("carrying the engine decision to the rig", () => {
	const TUNING: MotionOverrides = { tracks: { azimuth: TUNED } };
	/** 2000 phases, half-open: phase 1 is the next cycle's phase 0 and measures nothing new. */
	const DENSE = Array.from({ length: 2000 }, (_, i) => i / 2000);

	function worstAzimuth(a: StudioClip, b: StudioClip): number {
		const left = createClipPoseSampler(a, HERO);
		const right = createClipPoseSampler(b, HERO);
		return Math.max(...DENSE.map((t) => Math.abs(left(t).azimuth - right(t).azimuth)));
	}

	it("hands the rig nothing for any untouched catalogue entry, generators included", () => {
		for (const clip of STUDIO_CLIPS) {
			expect(flownMotionDoc(motionClipFor(clip.id, undefined))).toBeUndefined();
		}
	});

	it("hands the rig the flown document the moment a curve is tuned", () => {
		const doc = flownMotionDoc(motionClipFor("orbit", TUNING));
		expect(doc).toBeDefined();
		expect(cycle(doc!)).toEqual(cycle(resolveFlownDoc("orbit", TUNING)));
	});

	it("hands the rig a saved motion's own document, not the move it was derived from", () => {
		const shelf = saveMotionAs([], resolveFlownDoc("orbit", TUNING), CADENCE, "saved-1", "Mine");
		const doc = flownMotionDoc(motionClipFor("saved-1", undefined, shelf));
		expect(doc).toBeDefined();
		expect(cycle(doc!)).toEqual(cycle(shelf[0].doc));
	});

	it("flies what the proof proves — and the path it replaces is a different camera", () => {
		const proved = motionClipFor("orbit", TUNING); // §5.5's `flownClip`, what the proof plans from
		const flown = documentClip(flownMotionDoc(proved)!); // what the rig now builds from the prop
		expect(cycle(flown.doc)).toEqual(PHASES.map(createClipPoseSampler(proved, HERO)));

		// Not a no-op: the rig used to resolve `move: string` through `findStudioClip`, which for
		// this tuning is 25.9822° of azimuth away at its worst — 260× the export fingerprint's
		// 0.1° pose quantisation, so the screen was a visibly different camera AND would have
		// keyed a different cache entry than the proof it was shown beside.
		const stale = findStudioClip("orbit")!;
		expect(worstAzimuth(flown, stale)).toBeCloseTo(25.9822, 4);
	});
});

describe("shelf storage", () => {
	function fakeStorage() {
		const map = new Map<string, string>();
		return {
			getItem: (k: string) => map.get(k) ?? null,
			setItem: (k: string, v: string) => void map.set(k, v),
			removeItem: (k: string) => void map.delete(k),
			clear: () => map.clear(),
		};
	}

	let storage: ReturnType<typeof fakeStorage>;
	beforeEach(() => {
		storage = fakeStorage();
		vi.stubGlobal("window", { localStorage: storage });
	});
	afterEach(() => vi.unstubAllGlobals());

	const write = (value: unknown) =>
		storage.setItem(MOTION_SHELF_STORAGE_KEY, JSON.stringify(value));

	it("round-trips a saved motion through the one key", () => {
		const saved = saveMotionAs(
			[],
			resolveFlownDoc("orbit", { tracks: { azimuth: TUNED } }),
			CADENCE,
			"s1",
			"Mine",
		);
		persistSavedMotions(saved);
		const [loaded] = loadSavedMotions();
		expect(loaded.label).toBe("Mine");
		expect(cycle(loaded.doc)).toEqual(cycle(saved[0].doc));
	});

	it("never throws on hostile storage — it drops what cannot fly", () => {
		write("not an array");
		expect(loadSavedMotions()).toEqual([]);
		storage.setItem(MOTION_SHELF_STORAGE_KEY, "{ not json");
		expect(loadSavedMotions()).toEqual([]);
		write([
			null,
			{ id: "", label: "Nameless", doc: {} },
			// A track needs two keyframes to describe motion; one is a constant offset.
			{ id: "thin", label: "Thin", doc: { tracks: { azimuth: { keyframes: [{ at: 0, value: 1 }] } } } },
		]);
		expect(loadSavedMotions()).toEqual([]);
	});

	it("caps the shelf so it stays a shelf rather than a file browser", () => {
		let shelf = saveMotionAs([], CATALOGUE_DOCS.orbit, CADENCE, "s0", "M0");
		for (let i = 1; i < MAX_SAVED_MOTIONS + 10; i++) {
			shelf = saveMotionAs(shelf, CATALOGUE_DOCS.orbit, CADENCE, `s${i}`, `M${i}`);
		}
		expect(shelf).toHaveLength(MAX_SAVED_MOTIONS);
	});

	it("names the next save without demanding a dialog first", () => {
		const shelf = saveMotionAs([], CATALOGUE_DOCS.orbit, CADENCE, "s1", "Motion 01");
		expect(nextMotionLabel(shelf)).toBe("Motion 02");
		expect(nextMotionLabel([])).toBe("Motion 01");
	});

	it("overwrites in place — the 'change one curve in a motion I already like' path", () => {
		const shelf = saveMotionAs([], CATALOGUE_DOCS.orbit, CADENCE, "s1", "Mine");
		const replaced = overwriteMotion(shelf, "s1", CATALOGUE_DOCS.crane, {
			...CADENCE,
			repeat: 4,
		});
		expect(replaced[0].id).toBe("s1");
		expect(replaced[0].label).toBe("Mine"); // not "Motion 04"
		expect(cycle(replaced[0].doc)).toEqual(cycle(CATALOGUE_DOCS.crane));
		expect(replaced[0].cadence.repeat).toBe(4); // the cadence is overwritten too
	});
});

/**
 * THE CADENCE IS PART OF WHAT WAS SAVED (§6.7).
 *
 * A shelf row states `3× · 1.7s · seamless`, and a control shows the value it HOLDS — so the
 * count, the clip length and the time map are stored beside the document rather than read off
 * whatever the transport happens to be set to when the row is drawn. The playhead is not: where
 * you are in a clip is a fact about the session, which is the line `withoutTransport` draws.
 */
describe("the cadence a shelf entry holds", () => {
	const BOOMERANG: MotionCadence = {
		repeat: 3,
		durationSec: 6,
		timeMap: { kind: "boomerang", turnaround: [0.5, 0, 0.5, 1] },
	};

	it("stores what was flying, and copies the time map rather than aliasing it", () => {
		const [entry] = saveMotionAs([], CATALOGUE_DOCS.orbit, BOOMERANG, "s1", "Mine");
		expect(entry.cadence).toEqual(BOOMERANG);
		expect(entry.cadence.timeMap).not.toBe(BOOMERANG.timeMap);
	});

	it("keeps its cadence across a rename", () => {
		const shelf = saveMotionAs([], CATALOGUE_DOCS.orbit, BOOMERANG, "s1", "Before");
		expect(renameMotion(shelf, "s1", "After")[0].cadence).toEqual(BOOMERANG);
	});

	it("opens as a whole motion slice, and DROPS the outgoing overrides", () => {
		const [entry] = saveMotionAs([], CATALOGUE_DOCS.orbit, BOOMERANG, "s1", "Mine");
		const state = openSavedMotion(entry, { playhead: 0.42, playing: true });
		expect(state).toEqual({
			docId: "s1",
			repeat: 3,
			durationSec: 6,
			timeMap: BOOMERANG.timeMap,
			playhead: 0.42,
			playing: true,
		});
		// Absent, not empty: an override is a diff against a specific base, and a shelf entry
		// stores its document whole. Carrying one in would apply a curve authored elsewhere.
		expect("overrides" in state).toBe(false);
	});
});

describe("healing a stored cadence", () => {
	function fakeStorage() {
		const map = new Map<string, string>();
		return {
			getItem: (k: string) => map.get(k) ?? null,
			setItem: (k: string, v: string) => void map.set(k, v),
			removeItem: (k: string) => void map.delete(k),
			clear: () => map.clear(),
		};
	}

	let storage: ReturnType<typeof fakeStorage>;
	beforeEach(() => {
		storage = fakeStorage();
		vi.stubGlobal("window", { localStorage: storage });
	});
	afterEach(() => vi.unstubAllGlobals());

	/** One legal entry with whatever cadence the case is testing. */
	const written = (cadence: unknown, doc: Partial<MotionDoc> = {}) => {
		const [entry] = saveMotionAs([], CATALOGUE_DOCS.orbit, CADENCE, "s1", "Mine");
		storage.setItem(
			MOTION_SHELF_STORAGE_KEY,
			JSON.stringify([{ ...entry, doc: { ...entry.doc, ...doc }, cadence }]),
		);
		return loadSavedMotions()[0];
	};

	it("defaults a record that has no cadence at all", () => {
		expect(written(undefined).cadence).toEqual({
			repeat: 1,
			durationSec: 5,
			timeMap: { kind: "loop" },
		});
	});

	it("clamps rather than refuses — the clamps have one owner", () => {
		const healed = written({ repeat: 1e9, durationSec: 0.1, timeMap: { kind: "nonsense" } });
		expect(healed.cadence.repeat).toBe(MAX_REPEAT);
		expect(healed.cadence.durationSec).toBe(MIN_DURATION_SEC);
		expect(healed.cadence.timeMap).toEqual({ kind: "loop" });
	});

	/**
	 * The `SanitizeMotionOptions.naturalCycleSeconds` case that was documented and had no
	 * caller: a legacy `speed` converts against the cycle length of the document it was
	 * recorded against, and a shelf document's is not in the catalogue. Without it the
	 * conversion falls back to one cycle and the entry silently loses its cadence — the same
	 * inert-migration defect the four model boundaries shipped.
	 */
	it("converts a legacy speed against the ENTRY's cycle, not the catalogue's", () => {
		const healed = written({ durationSec: 20, speed: 1 }, { naturalCycleSeconds: 10 });
		expect(healed.doc.naturalCycleSeconds).toBe(10);
		expect(healed.cadence.repeat).toBe(2); // 20s / 10s, not the DEFAULT_REPEAT fallback
	});
});
