/**
 * THE SUMMONED WHEEL — geometry and vocabulary for a radial menu that appears under the hand.
 *
 * WHY RADIAL. A wedge is a direction rather than a distance, so its effective target width is
 * unbounded and Fitts's law stops charging for travel (Callahan, Hopkins, Weiser &
 * Shneiderman, CHI '88). Summoning it to the cursor rather than parking it at an edge is the
 * Toolglass reading — the tool travels to the work (Bier, Stone, Pier, Buxton & DeRose,
 * SIGGRAPH '93).
 *
 * ONE RESOLVER, TWO SKILL LEVELS. `wedgeAtDirection` is called with the cursor offset while
 * the wheel is drawn, and with the release velocity when it is not. The novice path and the
 * expert path are therefore the same arithmetic on the same vector, which is the property
 * that makes practice transfer instead of resetting (Kurtenbach & Buxton, CHI '93). A second
 * resolver for the flick would be a second menu that has to agree with the first by
 * inspection.
 *
 * THE DEAD ZONE IS THE CANCEL. A release near the centre travelled in no direction, so it
 * names no wedge — that is what lets a summon be abandoned without a Cancel wedge spending a
 * direction on doing nothing.
 *
 * CLAMPED, NEVER CLIPPED. A summon one radius from an edge draws the whole wheel by moving
 * the wheel, not by dropping wedges: an interface whose contents depend on where it was
 * opened is one the hand cannot learn. The offset between the clamped centre and the pointer
 * is the caller's to draw as a tether.
 */

/** A wedge: a noun the surface owns, never a sentence about what it does. */
export interface WheelItem {
	id: string;
	label: string;
}

/**
 * The top level. Six nouns, each naming a part of the object or the room it sits in — the
 * whole surface, enumerated once, so nothing on the stage has to be permanent to be reachable.
 */
export const WHEEL_ROOT: readonly WheelItem[] = [
	{ id: "case", label: "Case" },
	{ id: "wheel", label: "Wheel" },
	{ id: "screen", label: "Screen" },
	{ id: "light", label: "Light" },
	{ id: "motion", label: "Motion" },
	{ id: "views", label: "Views" },
];

/** Outer radius in CSS pixels. Sized so six 11px labels sit on the ring without crowding. */
export const WHEEL_RADIUS_PX = 92;

/** Inside this radius a release names no wedge and the summon is abandoned. */
export const WHEEL_DEAD_ZONE_PX = 22;

/**
 * A flick must carry at least this, in CSS pixels per millisecond, to name a wedge without a
 * wheel. Below it the release is a press that went nowhere, which is the same non-answer the
 * dead zone gives — one threshold in velocity, one in distance, both meaning "no direction".
 */
export const WHEEL_FLICK_SPEED = 0.35;

/** A rectangle in viewport CSS pixels. */
export interface WheelViewport {
	width: number;
	height: number;
}

export interface WheelCenter {
	x: number;
	y: number;
}

/**
 * Where the wheel actually draws, given where it was asked for.
 *
 * Clamped by one radius on every side, so the outermost pixel of the outermost wedge is
 * inside the viewport at any summon position. A viewport narrower than two radii has no
 * position that satisfies both edges; it centres, which is the only answer that clips
 * symmetrically rather than losing one side entirely.
 */
export function clampWheelCenter(
	at: WheelCenter,
	viewport: WheelViewport,
	radius: number = WHEEL_RADIUS_PX,
): WheelCenter {
	const axis = (value: number, extent: number) =>
		extent < radius * 2 ? extent / 2 : Math.min(Math.max(value, radius), extent - radius);
	return { x: axis(at.x, viewport.width), y: axis(at.y, viewport.height) };
}

/** Radians per wedge. */
export function wedgeStep(count: number): number {
	return (Math.PI * 2) / Math.max(1, count);
}

/**
 * Centre angle of a wedge, in radians clockwise from twelve o'clock.
 *
 * Twelve o'clock first because the first item of a list is the one at the top, and clockwise
 * because that is the direction the click wheel this object is named for turns.
 */
export function wedgeAngle(index: number, count: number): number {
	return index * wedgeStep(count);
}

/**
 * The wedge a direction names, or `-1` for none.
 *
 * `dy` grows downward, as the DOM and the pointer both report it, so a negative `dy` is up
 * and lands on index 0. `magnitude` is compared against `threshold` in whatever unit the
 * caller's vector carries — pixels for a hover, pixels per millisecond for a flick — which is
 * what lets one function serve both without knowing which it was handed.
 */
export function wedgeAtDirection(
	dx: number,
	dy: number,
	count: number,
	threshold: number,
): number {
	const magnitude = Math.hypot(dx, dy);
	if (!(magnitude > threshold) || count < 1) return -1;
	const step = wedgeStep(count);
	// atan2(x, -y) measures clockwise from up, which is the order the wedges are laid out in.
	let angle = Math.atan2(dx, -dy);
	if (angle < 0) angle += Math.PI * 2;
	return Math.round(angle / step) % count;
}

/** Keyboard traversal of the same ring, wrapping in both directions. */
export function stepWedge(index: number, delta: number, count: number): number {
	if (count < 1) return -1;
	const from = index < 0 ? 0 : index;
	return (((from + delta) % count) + count) % count;
}

/**
 * The command a direction names, or `null`.
 *
 * §3.3 in one function: the release handler of a drawn wheel and the release handler of a
 * flick that never drew one both call this, so the expert path cannot drift from the novice
 * path by an off-by-one in a second lookup.
 */
export function wheelCommandFor(
	items: readonly WheelItem[],
	dx: number,
	dy: number,
	threshold: number,
): WheelItem | null {
	const index = wedgeAtDirection(dx, dy, items.length, threshold);
	return index < 0 ? null : (items[index] ?? null);
}

/** Unit offset of a wedge's label from the centre, at `radius`. `y` grows downward. */
export function wedgeLabelOffset(index: number, count: number, radius: number): WheelCenter {
	const angle = wedgeAngle(index, count);
	return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}
