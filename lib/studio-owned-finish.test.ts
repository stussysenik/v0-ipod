import { describe, expect, it } from "vitest";

import { STEEL_ROUGHNESS_FLOOR } from "./studio-owned-finish";

describe("STEEL_ROUGHNESS_FLOOR", () => {
	it("sits above the mirror-crawl threshold", () => {
		// Below ~0.1 the back reads as a 1:1 mirror and crawls under a turntable.
		expect(STEEL_ROUGHNESS_FLOOR).toBeGreaterThan(0.1);
		expect(STEEL_ROUGHNESS_FLOOR).toBeLessThan(0.3);
	});
});
