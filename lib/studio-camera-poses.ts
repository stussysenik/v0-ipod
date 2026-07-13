import type { StudioPose } from "@/lib/studio-camera";

/**
 * The one camera model for /3d.
 *
 * A *pose* is where the camera stands (azimuth / elevation / reach) plus the
 * *framing* it stands for — which face of the device the shot is about. Framing
 * used to be a separate user-facing "focus mode" control sitting next to the
 * orientation gizmo, so two bars both said "Front" and meant different things.
 * Now framing is folded into the named pose: picking `Front` IS the front framing.
 *
 * Named poses deliberately omit `reach`: a pose re-aims the camera, it does not
 * dolly. The framing supplies the rest distance and the rig's responsive fit floor
 * keeps the device framed on a phone.
 */

/** Which face the shot is about — supplies the camera target + rest distance. */
export type PoseFraming = "product" | "front" | "back";

export interface NamedPose {
	id: string;
	label: string;
	azimuth: number;
	elevation: number;
	framing: PoseFraming;
}

/**
 * The six canonical product views — the surviving bar. Order matches the gizmo the
 * user kept: the four cardinal faces, then Top, then the ¾ hero.
 *
 * `Front` and `Back` carry the framing that squares the camera to that face, which is
 * what the deleted "focus mode" segment used to do behind a second, identically-labelled
 * control. The turntable views (Right / Left / Top / ¾) frame the whole product.
 */
export const NAMED_POSES: readonly NamedPose[] = [
	{ id: "front", label: "Front", azimuth: 0, elevation: 0, framing: "front" },
	{ id: "right", label: "Right", azimuth: 90, elevation: 0, framing: "product" },
	{ id: "back", label: "Back", azimuth: 180, elevation: 0, framing: "back" },
	{ id: "left", label: "Left", azimuth: -90, elevation: 0, framing: "product" },
	{ id: "top", label: "Top", azimuth: 0, elevation: 70, framing: "product" },
	{ id: "hero", label: "¾", azimuth: 20, elevation: 12, framing: "product" },
] as const;

/** A saved studio shot: the composed angle *and* the finish, recalled as one look. */
export interface ShotLook {
	skinColor: string;
	ringColor: string;
	centerColor: string;
	backColor: string;
	edgeColor: string;
	bezelColor: string;
	bgColor: string;
}

export interface StudioShot {
	id: string;
	pose: StudioPose;
	/** The framing the shot was composed under, so recall restores the same target. */
	framing: PoseFraming;
	look: ShotLook;
}

export interface SavedPose {
	id: string;
	pose: StudioPose;
}

/** Shortest signed angular distance a→b in degrees, in [-180, 180]. */
export function angleDelta(a: number, b: number): number {
	const d = (((b - a) % 360) + 540) % 360;
	return d - 180;
}

/**
 * Which named pose the live camera is currently sitting on, or null under free orbit.
 * The bar highlights by *where the camera actually is*, not by what was last tapped —
 * so dragging away from a pose honestly deselects it.
 */
export function matchNamedPose(pose: StudioPose | null, tolerance = 8): NamedPose | null {
	if (!pose) return null;
	return (
		NAMED_POSES.find(
			(p) =>
				Math.abs(angleDelta(p.azimuth, pose.azimuth)) < tolerance &&
				Math.abs(p.elevation - pose.elevation) < tolerance,
		) ?? null
	);
}
