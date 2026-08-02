import { describe, expect, it } from "vitest";

import {
	arcballDelta,
	arcballRotation,
	ARCBALL_RADIUS,
	projectToSphere,
	rotateVec3,
	type ScreenPoint,
	type Viewport,
} from "./arcball";

const VIEWPORT: Viewport = { width: 1920, height: 1080 };
const CENTRE: ScreenPoint = { x: 960, y: 540 };
const REACH = 120;

/** The projection's own scale, restated here so the expectations are derived, not copied. */
const SCALE = (ARCBALL_RADIUS * Math.min(VIEWPORT.width, VIEWPORT.height)) / 2;
const D = REACH / SCALE;

const ANGLES = Array.from({ length: 16 }, (_, k) => (k * 2 * Math.PI) / 16);

function dragTo(theta: number): ScreenPoint {
	return { x: CENTRE.x + REACH * Math.cos(theta), y: CENTRE.y + REACH * Math.sin(theta) };
}

/**
 * The ruling this file pins: a diagonal drag is ONE rotation about ONE axis. Two Euler sliders
 * would compose a yaw and a pitch, and a composition is order-dependent — so the same drag
 * would land in two places. The assertions are by value at 16 angles.
 */
describe("a drag is a single rotation", () => {
	it("turns about an axis perpendicular to both projected points", () => {
		for (const theta of ANGLES) {
			const from = projectToSphere(CENTRE, VIEWPORT);
			const to = projectToSphere(dragTo(theta), VIEWPORT);
			const { axis } = arcballRotation(CENTRE, dragTo(theta), VIEWPORT);
			expect(axis[0] * from[0] + axis[1] * from[1] + axis[2] * from[2]).toBeCloseTo(0, 12);
			expect(axis[0] * to[0] + axis[1] * to[1] + axis[2] * to[2]).toBeCloseTo(0, 12);
		}
	});

	it("places the axis at (sin θ, cos θ, 0) — one axis, named by value", () => {
		for (const theta of ANGLES) {
			const { axis } = arcballRotation(CENTRE, dragTo(theta), VIEWPORT);
			expect(axis[0]).toBeCloseTo(Math.sin(theta), 12);
			expect(axis[1]).toBeCloseTo(Math.cos(theta), 12);
			expect(axis[2]).toBeCloseTo(0, 12);
		}
	});

	it("turns by twice the arc — the same amount at every angle, since the reach is the same", () => {
		const expected = 2 * Math.asin(D);
		for (const theta of ANGLES) {
			expect(arcballRotation(CENTRE, dragTo(theta), VIEWPORT).angle).toBeCloseTo(expected, 12);
		}
	});

	it("is the identity when the pointer has not moved", () => {
		expect(arcballRotation(CENTRE, CENTRE, VIEWPORT).angle).toBe(0);
		expect(arcballDelta(CENTRE, CENTRE, VIEWPORT)).toEqual({ azimuth: 0, elevation: 0 });
	});
});

describe("the delta read off that rotation", () => {
	it("moves azimuth alone on a horizontal drag and elevation alone on a vertical one", () => {
		const horizontal = arcballDelta(CENTRE, { x: CENTRE.x + REACH, y: CENTRE.y }, VIEWPORT);
		expect(horizontal.elevation).toBeCloseTo(0, 12);
		expect(horizontal.azimuth).toBeCloseTo((2 * Math.asin(D) * 180) / Math.PI, 10);

		const vertical = arcballDelta(CENTRE, { x: CENTRE.x, y: CENTRE.y + REACH }, VIEWPORT);
		expect(vertical.azimuth).toBeCloseTo(0, 12);
		// Dragging down lowers the camera.
		expect(vertical.elevation).toBeCloseTo((-2 * Math.asin(D) * 180) / Math.PI, 10);
	});

	it("differs from the yaw-then-pitch composition of the same drag", () => {
		// The failure this guards: implementing the drag as two independent axis deltas. It
		// agrees on the axis-aligned cases and diverges everywhere between them, which is
		// exactly where it would ship unnoticed.
		for (const theta of ANGLES) {
			const dx = REACH * Math.cos(theta);
			const dy = REACH * Math.sin(theta);
			const single = arcballDelta(CENTRE, dragTo(theta), VIEWPORT);
			const composed = {
				azimuth: arcballDelta(CENTRE, { x: CENTRE.x + dx, y: CENTRE.y }, VIEWPORT).azimuth,
				elevation: arcballDelta(CENTRE, { x: CENTRE.x, y: CENTRE.y + dy }, VIEWPORT).elevation,
			};
			const axisAligned = Math.abs(dx) < 1e-9 || Math.abs(dy) < 1e-9;
			const gap =
				Math.abs(single.azimuth - composed.azimuth) +
				Math.abs(single.elevation - composed.elevation);
			if (axisAligned) expect(gap).toBeCloseTo(0, 10);
			else expect(gap).toBeGreaterThan(0.2);
		}
	});
});

describe("the projection", () => {
	it("returns the pole at the centre and a unit vector everywhere", () => {
		expect(projectToSphere(CENTRE, VIEWPORT)).toEqual([0, 0, 1]);
		for (const theta of ANGLES) {
			for (const reach of [10, 240, 486, 900, 4000]) {
				const point = {
					x: CENTRE.x + reach * Math.cos(theta),
					y: CENTRE.y + reach * Math.sin(theta),
				};
				const [x, y, z] = projectToSphere(point, VIEWPORT);
				expect(Math.hypot(x, y, z)).toBeCloseTo(1, 12);
			}
		}
	});

	it("keeps turning past the rim instead of sticking — Bell's hyperbolic sheet", () => {
		let previous = 0;
		for (const reach of [400, 600, 900, 1400, 2000]) {
			const angle = arcballRotation(
				CENTRE,
				{ x: CENTRE.x + reach, y: CENTRE.y },
				VIEWPORT,
			).angle;
			expect(angle).toBeGreaterThan(previous);
			previous = angle;
		}
	});

	it("degrades to the pole rather than dividing by zero on an empty viewport", () => {
		expect(projectToSphere(CENTRE, { width: 0, height: 0 })).toEqual([0, 0, 1]);
	});
});

describe("rotateVec3", () => {
	it("preserves length", () => {
		const rotation = arcballRotation(CENTRE, dragTo(Math.PI / 3), VIEWPORT);
		const rotated = rotateVec3(rotation, [0.3, -0.5, Math.sqrt(1 - 0.09 - 0.25)]);
		expect(Math.hypot(...rotated)).toBeCloseTo(1, 12);
	});
});
