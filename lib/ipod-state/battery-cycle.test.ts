import { describe, expect, it } from "vitest";

import {
	BATTERY_BOOT_OFFSET_MS,
	BATTERY_CYCLE_MS,
	BATTERY_FLOOR,
	batteryLevelForElapsed,
} from "./battery-cycle";

describe("batteryLevelForElapsed", () => {
	it("starts at a full charge", () => {
		expect(batteryLevelForElapsed(0)).toBe(1);
	});

	it("boots below full at the birth offset — never a clinical 100%, but healthy", () => {
		// First-visit birth is stamped this far in the past, so the opening read sits a
		// little into the drain (~85%) rather than at full (spec: never start at 100%).
		const level = batteryLevelForElapsed(BATTERY_BOOT_OFFSET_MS);
		expect(level).toBeLessThan(1);
		expect(level).toBeGreaterThan(0.8);
	});

	it("returns to full at the end of a cycle", () => {
		expect(batteryLevelForElapsed(BATTERY_CYCLE_MS)).toBeCloseTo(1, 10);
	});

	it("bottoms out at the floor, never below", () => {
		// Sweep the whole cycle; the minimum is the floor and nothing dips under it.
		let min = 1;
		for (let i = 0; i <= 1000; i++) {
			const level = batteryLevelForElapsed((BATTERY_CYCLE_MS * i) / 1000);
			expect(level).toBeGreaterThanOrEqual(BATTERY_FLOOR);
			expect(level).toBeLessThanOrEqual(1);
			min = Math.min(min, level);
		}
		expect(min).toBeCloseTo(BATTERY_FLOOR, 2);
	});

	it("is continuous across cycle boundaries (no jump on wrap)", () => {
		const justBefore = batteryLevelForElapsed(BATTERY_CYCLE_MS - 1);
		const justAfter = batteryLevelForElapsed(BATTERY_CYCLE_MS + 1);
		expect(Math.abs(justAfter - justBefore)).toBeLessThan(0.001);
	});

	it("derives the same level for equivalent phases (gaps are accounted for)", () => {
		// Two reads a whole cycle apart land on the identical charge — the property
		// that makes time-away free: evaluating against `now` resumes the cycle.
		const t = BATTERY_CYCLE_MS * 0.37;
		expect(batteryLevelForElapsed(t)).toBeCloseTo(
			batteryLevelForElapsed(t + BATTERY_CYCLE_MS * 5),
			10,
		);
	});

	it("stays in range for negative elapsed (clock skew into the past)", () => {
		const level = batteryLevelForElapsed(-1234);
		expect(level).toBeGreaterThanOrEqual(BATTERY_FLOOR);
		expect(level).toBeLessThanOrEqual(1);
	});
});
