import { describe, expect, it } from "vitest";

import { matchNamedPose, NAMED_POSES } from "./studio-camera-poses";
import {
	CAMERA_STORE_KEY,
	EMPTY_CAMERA_STORE,
	LEGACY_CAMERA_KEYS,
	readCameraStore,
	writeCameraStore,
	type CameraStore,
} from "./studio-camera-store";

/**
 * The camera used to remember itself in three ad-hoc localStorage keys written by three
 * components. Consolidating them is only safe if a returning user's saved work survives
 * the move — so the migration is the thing under test, not the happy path.
 */

/** A localStorage stand-in, so the migration is testable without a browser. */
function fakeStorage(seed: Record<string, string> = {}) {
	const map = new Map(Object.entries(seed));
	return {
		map,
		getItem: (k: string) => map.get(k) ?? null,
		setItem: (k: string, v: string) => void map.set(k, v),
		removeItem: (k: string) => void map.delete(k),
	};
}

const POSE = { azimuth: 20, elevation: 12, reach: 14, target: [0, 0, 0] as [number, number, number] };

describe("camera store migration", () => {
	it("reads an empty store when nothing is persisted", () => {
		expect(readCameraStore(fakeStorage())).toEqual(EMPTY_CAMERA_STORE);
	});

	it("lifts legacy shots, poses and presets into the unified store", () => {
		const storage = fakeStorage({
			"ipod-3d-locked-pose": JSON.stringify(POSE),
			"ipod-3d-studio-shots": JSON.stringify([
				{
					id: "S1",
					pose: POSE,
					focus: "back",
					look: { skinColor: "#111", backColor: "#eee", bezelColor: "#000", bgColor: "#0048FF" },
				},
			]),
			"ipod-3d-camera-presets": JSON.stringify([{ id: "P1", pose: POSE }]),
		});

		const store = readCameraStore(storage);

		expect(store.lockedPose).toEqual(POSE);
		expect(store.presets).toEqual([{ id: "P1", pose: POSE }]);
		expect(store.shots).toHaveLength(1);
		// The legacy `focus` field becomes the pose's framing — the concept moved, not the data.
		expect(store.shots[0].framing).toBe("back");
		// A shot saved before the edge zone existed still recalls: edge falls back to back.
		expect(store.shots[0].look.edgeColor).toBe("#eee");
		expect(store.shots[0].look.skinColor).toBe("#111");
	});

	it("defaults framing to product for shots saved with no focus", () => {
		const storage = fakeStorage({
			"ipod-3d-studio-shots": JSON.stringify([
				{ id: "S1", pose: POSE, look: { skinColor: "#111", backColor: "#eee" } },
			]),
		});
		expect(readCameraStore(storage).shots[0].framing).toBe("product");
	});

	it("round-trips a written store and retires the legacy keys", () => {
		const storage = fakeStorage({
			"ipod-3d-locked-pose": JSON.stringify(POSE),
			"ipod-3d-camera-presets": JSON.stringify([{ id: "P1", pose: POSE }]),
		});

		const migrated = readCameraStore(storage);
		writeCameraStore(storage, migrated);

		expect(readCameraStore(storage)).toEqual(migrated);
		expect(storage.map.has(CAMERA_STORE_KEY)).toBe(true);
		for (const key of LEGACY_CAMERA_KEYS) expect(storage.map.has(key)).toBe(false);
	});

	it("prefers the v1 store over stale legacy keys once migrated", () => {
		const store: CameraStore = { lockedPose: null, shots: [], presets: [{ id: "P9", pose: POSE }] };
		const storage = fakeStorage({
			[CAMERA_STORE_KEY]: JSON.stringify(store),
			"ipod-3d-camera-presets": JSON.stringify([{ id: "STALE", pose: POSE }]),
		});
		expect(readCameraStore(storage).presets).toEqual([{ id: "P9", pose: POSE }]);
	});

	it("treats malformed storage as empty rather than throwing", () => {
		const storage = fakeStorage({ [CAMERA_STORE_KEY]: "{not json" });
		expect(readCameraStore(storage)).toEqual(EMPTY_CAMERA_STORE);
	});
});

describe("named pose matching", () => {
	it("matches the pose the camera is actually sitting on", () => {
		const back = NAMED_POSES.find((p) => p.id === "back")!;
		expect(matchNamedPose({ ...POSE, azimuth: back.azimuth, elevation: back.elevation })?.id).toBe(
			"back",
		);
	});

	it("matches across the ±180° azimuth seam", () => {
		expect(matchNamedPose({ ...POSE, azimuth: -179, elevation: 0 })?.id).toBe("back");
	});

	it("deselects under free orbit — no pose is a lie", () => {
		expect(matchNamedPose({ ...POSE, azimuth: 55, elevation: 40 })).toBeNull();
		expect(matchNamedPose(null)).toBeNull();
	});
});
