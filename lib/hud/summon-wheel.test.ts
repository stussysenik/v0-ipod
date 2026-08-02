import { describe, expect, it } from "vitest";

import {
	clampWheelCenter,
	stepWedge,
	WHEEL_DEAD_ZONE_PX,
	WHEEL_FLICK_SPEED,
	WHEEL_RADIUS_PX,
	WHEEL_ROOT,
	wedgeAngle,
	wedgeAtDirection,
	wedgeLabelOffset,
	wedgeStep,
} from "./summon-wheel";

const COUNT = WHEEL_ROOT.length;
const VIEWPORT = { width: 1440, height: 900 };

describe("the vocabulary", () => {
	/** §3.2 — a wedge label is a noun. No verbs, no sentences, no second person. */
	it("labels every wedge with a single capitalised noun", () => {
		expect(WHEEL_ROOT.map((item) => item.label)).toEqual([
			"Case",
			"Wheel",
			"Screen",
			"Light",
			"Motion",
			"Views",
		]);
		for (const item of WHEEL_ROOT) expect(item.label).toMatch(/^[A-Z][a-z]+$/);
	});

	it("keys every wedge uniquely", () => {
		expect(new Set(WHEEL_ROOT.map((item) => item.id)).size).toBe(COUNT);
	});
});

describe("clampWheelCenter", () => {
	/**
	 * §3.5 — a summon within one radius of each of the four edges clamps with zero clipped
	 * wedges. The check is the whole ring, not the centre: a clamp that satisfies the centre
	 * and clips a label is the defect this test exists to catch.
	 */
	it("keeps every wedge inside the viewport at all four edges", () => {
		const corners = [
			{ x: 4, y: 4 },
			{ x: VIEWPORT.width - 4, y: 4 },
			{ x: 4, y: VIEWPORT.height - 4 },
			{ x: VIEWPORT.width - 4, y: VIEWPORT.height - 4 },
		];
		for (const at of corners) {
			const centre = clampWheelCenter(at, VIEWPORT);
			for (let i = 0; i < COUNT; i += 1) {
				const offset = wedgeLabelOffset(i, COUNT, WHEEL_RADIUS_PX);
				expect(centre.x + offset.x).toBeGreaterThanOrEqual(0);
				expect(centre.x + offset.x).toBeLessThanOrEqual(VIEWPORT.width);
				expect(centre.y + offset.y).toBeGreaterThanOrEqual(0);
				expect(centre.y + offset.y).toBeLessThanOrEqual(VIEWPORT.height);
			}
		}
	});

	it("leaves a summon with room on every side where it was asked for", () => {
		const at = { x: 700, y: 400 };
		expect(clampWheelCenter(at, VIEWPORT)).toEqual(at);
	});

	/** Narrower than the wheel: centring clips symmetrically instead of losing one side. */
	it("centres in a viewport too small to hold the wheel", () => {
		expect(clampWheelCenter({ x: 5, y: 5 }, { width: 100, height: 80 })).toEqual({ x: 50, y: 40 });
	});
});

describe("wedgeAtDirection", () => {
	/** Twelve o'clock is the first item, and the ring turns the way the click wheel does. */
	it("puts the first wedge at twelve o'clock and runs clockwise", () => {
		expect(wedgeAtDirection(0, -60, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(0);
		expect(wedgeAtDirection(60, 0, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(Math.round(COUNT / 4));
		expect(wedgeAtDirection(0, 60, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(COUNT / 2);
	});

	/**
	 * §3.3 — the novice path and the expert path are the same arithmetic.
	 *
	 * A hover offset in pixels and a flick velocity in pixels per millisecond are the same
	 * vector at different scales, so they must name the same wedge at every angle. Asserted
	 * across the whole circle rather than at the wedge centres, because the boundaries are
	 * where a second resolver would disagree first.
	 */
	it("names the same wedge for a hover and for a flick at every angle", () => {
		for (let deg = 0; deg < 360; deg += 3) {
			const angle = (deg * Math.PI) / 180;
			const dx = Math.sin(angle);
			const dy = -Math.cos(angle);
			const hover = wedgeAtDirection(dx * 70, dy * 70, COUNT, WHEEL_DEAD_ZONE_PX);
			const flick = wedgeAtDirection(dx * 1.4, dy * 1.4, COUNT, WHEEL_FLICK_SPEED);
			expect(flick).toBe(hover);
			expect(hover).toBeGreaterThanOrEqual(0);
		}
	});

	/** The dead zone is the cancel: no wedge spends a direction on doing nothing. */
	it("names no wedge inside the dead zone or below the flick speed", () => {
		expect(wedgeAtDirection(0, -WHEEL_DEAD_ZONE_PX, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(-1);
		expect(wedgeAtDirection(0, 0, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(-1);
		expect(wedgeAtDirection(0.1, 0, COUNT, WHEEL_FLICK_SPEED)).toBe(-1);
	});

	/** Every wedge is reachable, and each owns an equal share of the circle. */
	it("selects each wedge from its own centre angle", () => {
		for (let i = 0; i < COUNT; i += 1) {
			const angle = wedgeAngle(i, COUNT);
			const dx = Math.sin(angle) * 70;
			const dy = -Math.cos(angle) * 70;
			expect(wedgeAtDirection(dx, dy, COUNT, WHEEL_DEAD_ZONE_PX)).toBe(i);
		}
		expect(wedgeStep(COUNT) * COUNT).toBeCloseTo(Math.PI * 2, 12);
	});
});

describe("stepWedge", () => {
	/** §3.4 — the keyboard walks the same ring, and the ring wraps in both directions. */
	it("wraps in both directions", () => {
		expect(stepWedge(0, -1, COUNT)).toBe(COUNT - 1);
		expect(stepWedge(COUNT - 1, 1, COUNT)).toBe(0);
		expect(stepWedge(-1, 1, COUNT)).toBe(1);
	});
});
