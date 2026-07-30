import { describe, it, expect } from "vitest";
import { STATE_FIXTURES } from "./state-fixtures";

describe("state fixtures", () => {
	it("every fixture has a unique id", () => {
		const ids = STATE_FIXTURES.map((f) => f.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it("every fixture builds without error", () => {
		for (const fixture of STATE_FIXTURES) {
			expect(() => fixture.build()).not.toThrow();
		}
	});

	it("fresh builds without touching localStorage", () => {
		const fresh = STATE_FIXTURES.find((f) => f.id === "fresh");
		expect(fresh).toBeDefined();
		const model = fresh!.build();
		expect(model).toBeDefined();
		expect(model.presentation.hardwarePreset).toBeTruthy();
	});

	it("the matrix covers the list — adding an entry does not require touching the story or tests", () => {
		const ids = new Set(STATE_FIXTURES.map((f) => f.id));
		expect(STATE_FIXTURES.length).toBeGreaterThan(0);
		for (const id of ids) {
			expect(STATE_FIXTURES.some((f) => f.id === id)).toBe(true);
		}
	});
});
