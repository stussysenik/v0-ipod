/**
 * ARCBALL — pointer delta to one rotation, not to two stacked ones.
 *
 * A 2D device driving a 3D rotation was measured, and the virtual sphere won: Chen, Mountford
 * & Sellen (*A study in interactive 3-D rotation using 2-D control devices*, SIGGRAPH '88)
 * compared the candidate mappings, and Shoemake formalised the winner (*ARCBALL*, GI '92).
 *
 * THE PROPERTY THAT MATTERS HERE: both screen points are projected onto a unit sphere and the
 * result is the single rotation that carries the first to the second — one axis, one angle.
 * Two independent Euler sliders would instead compose a yaw and a pitch, and a composition is
 * order-dependent, so the same diagonal drag would land in two different places depending on
 * which axis was applied first. `arcballDelta` reads azimuth and elevation OFF that one
 * rotation rather than authoring them separately.
 *
 * The projection uses Bell's hyperbolic sheet outside `r/√2` rather than a hard clamp at the
 * silhouette, so a drag that leaves the sphere keeps turning instead of sticking at the rim.
 *
 * Pure, allocation-light, and a function of (start, current, viewport, radius) only — no camera
 * state, no clock. The same drag replays to the same rotation.
 */

export type Vec3 = readonly [number, number, number];

/** Any pointer-like value. `PointerSample` satisfies this structurally. */
export interface ScreenPoint {
	x: number;
	y: number;
}

export interface Viewport {
	width: number;
	height: number;
}

export interface ArcballRotation {
	/** Unit axis in view space: +x right, +y up, +z toward the viewer. */
	axis: Vec3;
	/** Radians, right-handed about `axis`. */
	angle: number;
}

/**
 * Sphere radius as a fraction of half the viewport's short side. Below 1 the sphere sits inside
 * the frame, so the hyperbolic region is reachable without leaving the canvas.
 */
export const ARCBALL_RADIUS = 0.9;

/** A drag shorter than this in sphere-space produces no rotation rather than a noisy axis. */
const EPSILON = 1e-9;

export const IDENTITY_ROTATION: ArcballRotation = { axis: [0, 1, 0], angle: 0 };

/**
 * Screen pixel → unit vector on the virtual sphere.
 *
 * Screen `y` grows downward and the sphere's `y` grows upward, so the mapping flips it once,
 * here, and nothing downstream flips it again.
 */
export function projectToSphere(
	point: ScreenPoint,
	viewport: Viewport,
	radius: number = ARCBALL_RADIUS,
): Vec3 {
	const scale = (radius * Math.min(viewport.width, viewport.height)) / 2;
	if (!(scale > 0)) return [0, 0, 1];
	const nx = (point.x - viewport.width / 2) / scale;
	const ny = (viewport.height / 2 - point.y) / scale;
	const squared = nx * nx + ny * ny;
	// Inside r/√2 the sphere itself; outside it, Bell's hyperbolic sheet — the two meet with a
	// continuous tangent, which is why a drag across the rim does not jump.
	const z = squared <= 0.5 ? Math.sqrt(1 - squared) : 0.5 / Math.sqrt(squared);
	const length = Math.hypot(nx, ny, z);
	return [nx / length, ny / length, z / length];
}

/** The one rotation carrying `start` to `current` across the sphere. */
export function arcballRotation(
	start: ScreenPoint,
	current: ScreenPoint,
	viewport: Viewport,
	radius: number = ARCBALL_RADIUS,
): ArcballRotation {
	const from = projectToSphere(start, viewport, radius);
	const to = projectToSphere(current, viewport, radius);
	const cx = from[1] * to[2] - from[2] * to[1];
	const cy = from[2] * to[0] - from[0] * to[2];
	const cz = from[0] * to[1] - from[1] * to[0];
	const sine = Math.hypot(cx, cy, cz);
	if (sine <= EPSILON) return IDENTITY_ROTATION;
	const cosine = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
	// Arcball turns by TWICE the arc between the projected points: the quaternion
	// (p₀·p₁, p₀×p₁) has half-angle θ, so the rotation it names is 2θ. Dragging the far side
	// of the sphere to the near side is a half turn, which is the mapping's whole appeal.
	return { axis: [cx / sine, cy / sine, cz / sine], angle: 2 * Math.atan2(sine, cosine) };
}

/** Rodrigues' rotation formula. */
export function rotateVec3(rotation: ArcballRotation, v: Vec3): Vec3 {
	const [ax, ay, az] = rotation.axis;
	const cosine = Math.cos(rotation.angle);
	const sine = Math.sin(rotation.angle);
	const dot = ax * v[0] + ay * v[1] + az * v[2];
	const cx = ay * v[2] - az * v[1];
	const cy = az * v[0] - ax * v[2];
	const cz = ax * v[1] - ay * v[0];
	return [
		v[0] * cosine + cx * sine + ax * dot * (1 - cosine),
		v[1] * cosine + cy * sine + ay * dot * (1 - cosine),
		v[2] * cosine + cz * sine + az * dot * (1 - cosine),
	];
}

/** The camera's forward axis at rest — the vector the delta is read against. */
const FORWARD: Vec3 = [0, 0, 1];

const DEGREES = 180 / Math.PI;

/**
 * The orbit delta a drag asks for, in degrees, read off the single arcball rotation.
 *
 * Azimuth and elevation come OUT of one rotation here; they never go into two. That is the
 * difference this module exists to hold, and the reason a diagonal drag is one move.
 */
export function arcballDelta(
	start: ScreenPoint,
	current: ScreenPoint,
	viewport: Viewport,
	radius: number = ARCBALL_RADIUS,
): { azimuth: number; elevation: number } {
	const [x, y, z] = rotateVec3(arcballRotation(start, current, viewport, radius), FORWARD);
	return {
		azimuth: Math.atan2(x, z) * DEGREES,
		elevation: Math.asin(Math.min(1, Math.max(-1, y))) * DEGREES,
	};
}
