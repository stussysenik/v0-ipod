import { describe, expect, it } from "vitest";

import {
	isDarkChrome,
	resolveIconButtonVariant,
	sharedIconButtonTokens,
} from "./shared-ui-tokens";

describe("isDarkChrome", () => {
	it("treats the 6G black shell as dark and the white shell as light", () => {
		expect(isDarkChrome("#1b1818")).toBe(true); // IPOD_6G_COLORS.case.black
		expect(isDarkChrome("#F5F5F7")).toBe(false); // IPOD_6G_COLORS.case.white
	});

	it("holds at the pure endpoints", () => {
		expect(isDarkChrome("#000000")).toBe(true);
		expect(isDarkChrome("#FFFFFF")).toBe(false);
	});

	it("splits mid-greys by perceived lightness, not raw midpoint", () => {
		// #767676 is the sRGB grey whose contrast to black and white is ~equal;
		// darker greys read dark, lighter greys read light.
		expect(isDarkChrome("#5a5a5a")).toBe(true);
		expect(isDarkChrome("#9a9a9a")).toBe(false);
	});

	it("adapts to arbitrary case colours, not just black/white", () => {
		expect(isDarkChrome("#0a2540")).toBe(true); // deep navy shell
		expect(isDarkChrome("#f4c542")).toBe(false); // bright amber shell
	});
});

describe("resolveIconButtonVariant", () => {
	it("uses the dark-filled default on a dark device", () => {
		const tokens = resolveIconButtonVariant("default", true);
		expect(tokens).toBe(sharedIconButtonTokens.variants.defaultDark);
		expect(tokens.foreground).toBe("#F5F5F7"); // light text on dark fill
	});

	it("keeps the light gradient default on a light device", () => {
		const tokens = resolveIconButtonVariant("default", false);
		expect(tokens).toBe(sharedIconButtonTokens.variants.default);
	});

	it("leaves active and contrast invariant regardless of chrome (§7.4)", () => {
		for (const darkChrome of [true, false]) {
			expect(resolveIconButtonVariant("active", darkChrome)).toBe(
				sharedIconButtonTokens.variants.active,
			);
			expect(resolveIconButtonVariant("contrast", darkChrome)).toBe(
				sharedIconButtonTokens.variants.contrast,
			);
		}
	});
});
