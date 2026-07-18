import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { colorManifest } from "./color-manifest";
import {
	DEVICE_CHROME,
	DEVICE_CHROME_TOKENS,
	deviceChromeColor,
	type DeviceChromePart,
} from "./device-chrome";

const PARTS = Object.keys(DEVICE_CHROME_TOKENS) as DeviceChromePart[];
const HEX = /^#[0-9a-fA-F]{6}$/;
/** getSurfaceToken's fallback when a token is missing — the coverage failure signal. */
const MISSING_FALLBACK = "#808080";

describe("device-chrome color path (§0.3 coverage guard)", () => {
	it("resolves every device-chrome part from a real manifest surface token", () => {
		for (const part of PARTS) {
			const token = DEVICE_CHROME_TOKENS[part];
			// The token must actually exist in the manifest — not silently fall back to grey.
			expect(colorManifest.surfaceTokens[token]).toBeDefined();
			const color = deviceChromeColor(part);
			expect(color).toMatch(HEX);
			expect(color.toLowerCase()).not.toBe(MISSING_FALLBACK);
			expect(color).toBe(colorManifest.surfaceTokens[token].hex);
		}
	});

	it("exposes the same values through the precomputed record", () => {
		for (const part of PARTS) {
			expect(DEVICE_CHROME[part]).toBe(deviceChromeColor(part));
		}
	});

	it("keeps the tokenized device hex OUT of three-d-ipod source (no silent revert)", () => {
		const src = readFileSync(
			join(__dirname, "..", "components", "three", "three-d-ipod.tsx"),
			"utf8",
		);
		// Each routed color must no longer appear as an inline quoted literal in the mesh code.
		for (const part of PARTS) {
			const hex = colorManifest.surfaceTokens[DEVICE_CHROME_TOKENS[part]].hex;
			expect(src).not.toContain(`"${hex}"`);
			expect(src).not.toContain(`"${hex.toLowerCase()}"`);
		}
	});

	it("still allows the true-black / true-white WYSIWYG sentinels to be literal", () => {
		// These are intentionally NOT tokenized (a designer's #000000/#FFFFFF must read true),
		// so the guard above must never sweep them up.
		const sentinels = ["#000000", "#ffffff"];
		for (const part of PARTS) {
			expect(sentinels).not.toContain(
				colorManifest.surfaceTokens[DEVICE_CHROME_TOKENS[part]].hex.toLowerCase(),
			);
		}
	});
});
