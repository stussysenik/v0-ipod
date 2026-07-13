import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { availableViewModes, migrateViewMode } from "@/lib/view-modes";

/**
 * The migration exists so archiving a view mode can never strand a returning user in a
 * surface whose rail button no longer renders. These assert the *rule*, reading the flags
 * rather than hard-coding today's values — so restoring a flag flips the expectation with
 * the flag instead of breaking the suite.
 */
describe("migrateViewMode", () => {
	it("keeps a mode that is still available", () => {
		for (const mode of availableViewModes()) {
			expect(migrateViewMode(mode.id)).toBe(mode.id);
		}
	});

	it("always keeps the two unflagged modes", () => {
		expect(migrateViewMode("flat")).toBe("flat");
		expect(migrateViewMode("preview")).toBe("preview");
	});

	it.each(["3d", "focus", "ascii"] as const)(
		"migrates an archived %s mode to preview so the user is never stranded",
		(mode) => {
			const flag = {
				"3d": FEATURE_FLAGS.SHOW_3D_VIEW_MODE,
				focus: FEATURE_FLAGS.SHOW_FOCUS_VIEW_MODE,
				ascii: FEATURE_FLAGS.SHOW_ASCII_VIEW_MODE,
			}[mode];
			expect(migrateViewMode(mode)).toBe(flag ? mode : "preview");
		},
	);
});
