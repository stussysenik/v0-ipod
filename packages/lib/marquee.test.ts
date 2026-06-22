import { describe, expect, it } from "vitest";

import {
	MARQUEE_END_PAUSE_MS,
	MARQUEE_LOOP_GAP_PX,
	MARQUEE_SPEED_PX_PER_SECOND,
	MARQUEE_START_DELAY_MS,
	getMarqueeCycleDurationMs,
	getMarqueeFrame,
	getMarqueeGapWidth,
} from "./marquee";

/*
 * Pins the authentic scroll-to-view contract (af958fb): a marquee cycle is
 * Pause → linear scroll → (seamless wrap | terminal pause), exactly like the
 * real iPod OS — not an eased ping-pong.
 */
describe("marquee motion", () => {
	const metrics = {
		containerWidth: 100,
		contentWidth: 156,
		gapWidth: getMarqueeGapWidth(156, 18),
	};

	it("loop mode: pauses, then scrolls one full content+gap cycle linearly", () => {
		const scrollDistance = metrics.contentWidth + MARQUEE_LOOP_GAP_PX;
		const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
		const cycleDurationMs = getMarqueeCycleDurationMs(metrics);

		expect(cycleDurationMs).toBeCloseTo(MARQUEE_START_DELAY_MS + scrollTime, 6);

		// Initial pause holds the home position.
		expect(getMarqueeFrame(metrics, 0).translateX).toBeCloseTo(0, 6);
		expect(getMarqueeFrame(metrics, MARQUEE_START_DELAY_MS).translateX).toBeCloseTo(0, 6);

		// Scroll phase is linear in elapsed time (authentic iPod feel).
		const quarter = getMarqueeFrame(metrics, MARQUEE_START_DELAY_MS + scrollTime * 0.25);
		const half = getMarqueeFrame(metrics, MARQUEE_START_DELAY_MS + scrollTime * 0.5);
		expect(quarter.translateX).toBeCloseTo(-scrollDistance * 0.25, 6);
		expect(half.translateX).toBeCloseTo(-scrollDistance * 0.5, 6);

		// Wrap is seamless: one full cycle later the phase is home again.
		expect(getMarqueeFrame(metrics, cycleDurationMs).translateX).toBeCloseTo(0, 6);
	});

	it("reset mode: scrolls only to reveal the tail, then holds before snapping", () => {
		const scrollDistance = metrics.contentWidth - metrics.containerWidth;
		const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
		const cycleDurationMs = getMarqueeCycleDurationMs(metrics, "reset");

		expect(cycleDurationMs).toBeCloseTo(
			MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_END_PAUSE_MS,
			6,
		);

		// Terminal pause parks the tail in view.
		const duringEndPause = getMarqueeFrame(
			metrics,
			MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_END_PAUSE_MS * 0.5,
			0,
			"reset",
		);
		expect(duringEndPause.translateX).toBeCloseTo(-scrollDistance, 6);

		// After the full cycle it snaps back to home.
		expect(getMarqueeFrame(metrics, cycleDurationMs, 0, "reset").translateX).toBeCloseTo(0, 6);
	});

	it("never moves when the content fits the container", () => {
		const fits = { containerWidth: 200, contentWidth: 156, gapWidth: metrics.gapWidth };
		expect(getMarqueeFrame(fits, 12345).translateX).toBe(0);
		expect(getMarqueeFrame(fits, 12345).overflow).toBe(false);
	});

	it("staggers fields by MARQUEE_STAGGER_MS without going negative", () => {
		// Field 1 at t=0 must still be parked (its clock starts later).
		expect(getMarqueeFrame(metrics, 0, 1).translateX).toBeCloseTo(0, 6);
	});
});
