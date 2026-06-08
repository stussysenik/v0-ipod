import * as THREE from "three";

/**
 * Studio coordinates — a designer-facing language for the camera.
 *
 * A motion-control product rig (a Mark Roberts Bolt, the "8-axis cinebot") isn't
 * programmed in raw XYZ; it's programmed in terms of what's framed (the TARGET)
 * and where the head sits relative to it. We mirror that with three intuitive
 * dials, so "az 24°, elev 12°, reach 14" describes a pose the way a DP would say
 * it — not as an opaque vector.
 *
 *   • azimuth   — the plan-view dial ("from the top", looking straight down +Y).
 *                 0° = dead front (+Z). Positive swings the camera toward +X,
 *                 i.e. off the device's right edge.
 *   • elevation — height angle above the turntable plane. 0° = eye-level/equator;
 *                 positive cranes up and looks DOWN onto the device.
 *   • reach     — distance from the target = apparent size (the dolly axis).
 *   • target    — the world point the lens is locked onto.
 *
 * A *move* is a path through this space over time, shaped by eased S-curves — the
 * accel/decel that separates a cinebot from a turntable.
 */
export interface StudioPose {
	/** Plan-view dial, degrees. 0 = dead front (+Z); + swings toward +X (frame-right). */
	azimuth: number;
	/** Height angle above the equator, degrees. 0 = eye-level; + cranes down onto it. */
	elevation: number;
	/** Distance from target = apparent size (dolly). */
	reach: number;
	/** World point the camera frames. */
	target: [number, number, number];
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

/** Studio pose → world-space camera position. */
export function poseToPosition(p: StudioPose, out = new THREE.Vector3()): THREE.Vector3 {
	const az = p.azimuth * DEG2RAD;
	const el = p.elevation * DEG2RAD;
	const cosEl = Math.cos(el);
	return out.set(
		p.target[0] + p.reach * cosEl * Math.sin(az),
		p.target[1] + p.reach * Math.sin(el),
		p.target[2] + p.reach * cosEl * Math.cos(az),
	);
}

/** World-space camera position + target → studio pose (inverse of poseToPosition). */
export function positionToPose(
	position: THREE.Vector3,
	target: [number, number, number] = DEFAULT_TARGET,
): StudioPose {
	const dx = position.x - target[0];
	const dy = position.y - target[1];
	const dz = position.z - target[2];
	const reach = Math.hypot(dx, dy, dz) || 1e-6;
	return {
		azimuth: Math.atan2(dx, dz) * RAD2DEG,
		elevation: Math.asin(THREE.MathUtils.clamp(dy / reach, -1, 1)) * RAD2DEG,
		reach,
		target,
	};
}

/** Smootherstep S-curve — eased accel + decel, flat derivative at both ends. */
export function easeInOut(t: number): number {
	const x = THREE.MathUtils.clamp(t, 0, 1);
	return x * x * x * (x * (x * 6 - 15) + 10);
}

// ─── Moves ─────────────────────────────────────────────────────────────────────────
// Each move maps loop time t ∈ [0,1) to a pose, anchored on a `hero` framing (the
// pose the user composed). Phases are whole turns of sin/cos so pose(1) === pose(0)
// — derivatives included — giving a seam-free IG loop with no first/last-frame pop.

export type CameraMove = "orbit" | "robo" | "turntable" | "sweep";

export interface MoveSpec {
	id: CameraMove;
	label: string;
	hint: string;
}

export const CAMERA_MOVES: readonly MoveSpec[] = [
	{ id: "orbit", label: "Orbit", hint: "gentle 3/4 sway" },
	{ id: "turntable", label: "Turntable", hint: "Z-axis 360 spin" },
	{ id: "sweep", label: "Sweep", hint: "overhead arc" },
	{ id: "robo", label: "Robo", hint: "diagonal dolly" },
] as const;

/**
 * Natural cycle time per move, in seconds — the length of ONE satisfying loop
 * of the motion at IG cadence (a turntable revolution, an orbit sway, a sweep
 * arc). A clip of any length repeats this cycle a whole number of times rather
 * than stretching a single loop across the whole duration, so the cadence stays
 * constant and lively whether the clip is 5s or 60s.
 */
export const MOVE_CYCLE_SECONDS: Record<CameraMove, number> = {
	orbit: 5,
	turntable: 6,
	sweep: 7,
	robo: 6,
};

/**
 * How many whole motion cycles fill a clip of `durationSec`. Rounded to the
 * nearest integer (min 1) so a 30s turntable spins ~5× and a 60s ~10× — a crisp,
 * constant cadence at any length — while the INTEGER count guarantees the global
 * progress maps phase 0 → 1 → 0, i.e. pose(end) === pose(start): a seam-free IG
 * loop with no first/last-frame pop. See `phaseForProgress`.
 */
export function cyclesForDuration(move: CameraMove, durationSec: number): number {
	return Math.max(1, Math.round(durationSec / MOVE_CYCLE_SECONDS[move]));
}

/**
 * Map global clip progress `p ∈ [0,1)` (0 = start of clip, 1 = end) to the
 * per-cycle phase a pose generator expects, repeating `cycles` whole loops. At
 * p=1 the phase is `cycles % 1 === 0`, so the export's final frame (i=total-1)
 * sits just shy of the seam and the loop closes cleanly back onto the hero pose.
 */
export function phaseForProgress(p: number, cycles: number): number {
	return (p * cycles) % 1;
}

/**
 * The base orbit: a gentle multi-axis sway centered on the hero framing —
 * the product at rest, barely breathing. Tight dolly keeps the device the
 * same apparent size through the loop so it reads as one clean shot.
 */
export function orbitPose(t: number, hero: StudioPose): StudioPose {
	const phase = t * Math.PI * 2;
	return {
		azimuth: hero.azimuth + 17 * Math.sin(phase),
		elevation: hero.elevation - 2 * Math.cos(phase),
		reach: hero.reach + 0.25 - 0.4 * Math.cos(phase),
		target: hero.target,
	};
}

/**
 * Robo diagonal dolly — the cinebot look. Azimuth and elevation sweep IN PHASE,
 * so the device tracks corner-to-corner across the 9:16 frame (lower-left ↔
 * upper-right) instead of a flat left/right pan — a true diagonal. A dolly
 * breathes closest at the hero beat (t=0/1) and eases back mid-loop, raking the
 * studio light down the chrome edge as it goes.
 */
export function roboDiagonalPose(t: number, hero: StudioPose): StudioPose {
	const phase = t * Math.PI * 2;
	const sweep = Math.sin(phase);
	return {
		azimuth: hero.azimuth + 18 * sweep,
		elevation: hero.elevation + 8 * sweep,
		reach: hero.reach + 0.9 - 0.9 * Math.cos(phase),
		target: hero.target,
	};
}

/**
 * Turntable — classic Z-axis product spin. A constant 360°/loop azimuth
 * rotation (front → right → back → left → front) is the backbone —
 * naturally seamless because 360° = 0° at the seam. A gentle elevation nod
 * and subtle dolly breathe add organic weightlessness so it reads as a
 * floating product showcase, not a mechanical turntable. At 60fps this is
 * a slow 6°/s jewel-case rotation; at 30fps/5s (IG loop) it's a crisp 72°/s
 * spin. The device stays consistently framed: dolly amplitude is tight and
 * reach always returns to hero at the loop seam.
 */
export function turntablePose(t: number, hero: StudioPose): StudioPose {
	const phase = t * Math.PI * 2;
	return {
		azimuth: hero.azimuth + 360 * t,
		elevation: hero.elevation + 4 * Math.sin(phase),
		reach: hero.reach + 0.5 - 0.5 * Math.cos(phase),
		target: hero.target,
	};
}

/**
 * Sweep — a cinema overhead arc that cranes the camera up in a single
 * clean vertical pass, showing the device from eye-level → top-down →
 * eye-level. Elevation swings ~28° (not 45° — that pushed the lens
 * nearly vertical, foreshortening the device into a thin sliver). Dolly
 * breathes only ±0.8 units so the product retains its form proportions
 * through the full arc — no shrinking, no stretching. A whisper of azimuth
 * sway keeps the framing from feeling mechanically locked on one plane.
 * All parameters are sin/cos-driven with matching derivatives at t=0/1
 * for a true seamless loop.
 */
export function sweepPose(t: number, hero: StudioPose): StudioPose {
	const phase = t * Math.PI * 2;
	return {
		azimuth: hero.azimuth + 5 * Math.sin(phase),
		elevation: hero.elevation + 28 * Math.sin(phase),
		reach: hero.reach + 0.8 - 0.8 * Math.cos(phase),
		target: hero.target,
	};
}

/** Resolve a move id to its pose generator. */
export function poseForMove(move: CameraMove, t: number, hero: StudioPose): StudioPose {
	switch (move) {
		case "turntable":
			return turntablePose(t, hero);
		case "sweep":
			return sweepPose(t, hero);
		case "robo":
			return roboDiagonalPose(t, hero);
		default:
			return orbitPose(t, hero);
	}
}

// ─── Authoring guards ────────────────────────────────────────────────────────────────
// Clamp HUD edits / composed poses to the same envelope OrbitRig allows, so a saved
// hero can never push the move out of frame or through the floor.

export const REACH_RANGE: readonly [number, number] = [5.5, 19];
export const ELEVATION_RANGE: readonly [number, number] = [-78, 78];

export function clampPose(p: StudioPose): StudioPose {
	return {
		azimuth: p.azimuth,
		elevation: THREE.MathUtils.clamp(p.elevation, ELEVATION_RANGE[0], ELEVATION_RANGE[1]),
		reach: THREE.MathUtils.clamp(p.reach, REACH_RANGE[0], REACH_RANGE[1]),
		target: p.target,
	};
}
