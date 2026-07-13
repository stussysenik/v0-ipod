import type { StudioPose } from "@/lib/studio-camera";
import type { PoseFraming, SavedPose, ShotLook, StudioShot } from "@/lib/studio-camera-poses";

/**
 * One versioned home for everything the /3d camera remembers — the locked hero pose,
 * the saved studio shots, and the cockpit's numeric pose presets.
 *
 * These used to live in three ad-hoc keys written by three different components, which
 * is what let three camera surfaces drift apart. The store is a plain value; the three
 * legacy keys are read once and folded in, then retired.
 */

export const CAMERA_STORE_KEY = "ipod-3d-camera.v1";

const LEGACY_LOCKED_POSE_KEY = "ipod-3d-locked-pose";
const LEGACY_SHOTS_KEY = "ipod-3d-studio-shots";
const LEGACY_PRESETS_KEY = "ipod-3d-camera-presets";

export const LEGACY_CAMERA_KEYS = [
	LEGACY_LOCKED_POSE_KEY,
	LEGACY_SHOTS_KEY,
	LEGACY_PRESETS_KEY,
] as const;

export interface CameraStore {
	/** The locked hero perspective, or null when the camera is free. */
	lockedPose: StudioPose | null;
	shots: StudioShot[];
	presets: SavedPose[];
}

export const EMPTY_CAMERA_STORE: CameraStore = { lockedPose: null, shots: [], presets: [] };

/** The shape saved shots had before framing folded into the pose. */
interface LegacyShot {
	id: string;
	pose: StudioPose;
	look: Partial<ShotLook> & { skinColor: string; backColor: string };
	/** Some shots were written while a focus mode was active. */
	focus?: PoseFraming;
}

const parse = <T,>(raw: string | null): T | null => {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null; // malformed storage is the same as no storage
	}
};

/**
 * Lift a legacy shot into the unified shape: its `focus` (when it had one) becomes the
 * pose's framing, and the edge color falls back to the back color for shots saved
 * before the edge zone existed — so an old shot recalls exactly as it always did.
 */
function liftShot(shot: LegacyShot): StudioShot {
	const look = shot.look;
	return {
		id: shot.id,
		pose: shot.pose,
		framing: shot.focus ?? "product",
		look: {
			skinColor: look.skinColor,
			ringColor: look.ringColor ?? look.skinColor,
			centerColor: look.centerColor ?? look.skinColor,
			backColor: look.backColor,
			edgeColor: look.edgeColor ?? look.backColor,
			bezelColor: look.bezelColor ?? "#0f0f0f",
			bgColor: look.bgColor ?? "#0048FF",
		},
	};
}

/**
 * Read the camera store, folding in the legacy keys the first time. Pure in its
 * `storage` argument so the migration is testable without a browser.
 */
export function readCameraStore(storage: Pick<Storage, "getItem">): CameraStore {
	const current = parse<CameraStore>(storage.getItem(CAMERA_STORE_KEY));
	if (current) {
		return {
			lockedPose: current.lockedPose ?? null,
			shots: current.shots ?? [],
			presets: current.presets ?? [],
		};
	}
	return {
		lockedPose: parse<StudioPose>(storage.getItem(LEGACY_LOCKED_POSE_KEY)),
		shots: (parse<LegacyShot[]>(storage.getItem(LEGACY_SHOTS_KEY)) ?? []).map(liftShot),
		presets: parse<SavedPose[]>(storage.getItem(LEGACY_PRESETS_KEY)) ?? [],
	};
}

/** Write the store and retire the legacy keys it superseded. */
export function writeCameraStore(
	storage: Pick<Storage, "setItem" | "removeItem">,
	store: CameraStore,
): void {
	try {
		storage.setItem(CAMERA_STORE_KEY, JSON.stringify(store));
		for (const key of LEGACY_CAMERA_KEYS) storage.removeItem(key);
	} catch {
		// ignore quota / private-mode failures
	}
}
