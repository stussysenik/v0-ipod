import { describe, expect, it } from "vitest";

import {
	MARQUEE_SPEED_PX_PER_SECOND,
	getMarqueeCycleDurationMs,
	getMarqueeFrame,
	getMarqueeGapWidth,
} from "./marquee";

describe("marquee motion", () => {
	it("uses a continuous eased ping-pong cycle without hard edge holds", () => {
		const metrics = {
			containerWidth: 100,
			contentWidth: 156,
			gapWidth: getMarqueeGapWidth(156, 18),
		};
		const scrollDistance = metrics.contentWidth - metrics.containerWidth;
		const halfCycleMs = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
		const cycleDurationMs = getMarqueeCycleDurationMs(metrics);

		expect(cycleDurationMs).toBeCloseTo(halfCycleMs * 2 + 2100, 6);
		expect(getMarqueeFrame(metrics, 0).translateX).toBeCloseTo(0, 6);
		expect(getMarqueeFrame(metrics, cycleDurationMs * 0.125).translateX).toBeLessThan(0);
		expect(getMarqueeFrame(metrics, halfCycleMs + 1200 + 450).translateX).toBeCloseTo(
			-scrollDistance,
			6,
		);
		expect(getMarqueeFrame(metrics, cycleDurationMs * 0.875).translateX).toBeLessThan(
			0,
		);
		expect(getMarqueeFrame(metrics, cycleDurationMs).translateX).toBeCloseTo(0, 6);
	});
});
