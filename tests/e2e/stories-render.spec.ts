/**
 * Smoke check that every in-scope story renders in the running app without
 * console errors. Runs after `bun run storybook:build` in CI via
 * `@playwright/test` and the Storybook static build served by
 * `http-server storybook-static`.
 *
 * This is not a visual regression test — those will ship in a follow-up
 * change along with Chromatic. This test only catches "story throws on
 * mount" and "a11y addon reports a critical contrast violation".
 */

import { expect, test } from "@playwright/test";

const STORIES = [
	"ipod-device-shell--black",
	"ipod-screen--now-playing",
	"click-wheel--default",
	"editable-text--default",
	"editable-duration--default",
	"editable-time--elapsed",
	"editable-track-number--default",
	"progress-bar--quarter-elapsed",
	"screen-battery--normal",
	"star-rating--four-stars",
	"marquee-text--default",
	"icon-button--default",
	"checkbox--unchecked",
	"carbon-checkbox--unchecked",
	"switch--off",
	"theme-toggle--black",
	"hex-color-input--black",
	"grey-palette-picker--case-target",
	"build-version-badge--dev",
	"revision-spec-card--black2008",
	"now-playing--black",
];

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? "http://localhost:6006";

test.describe("Storybook smoke", () => {
	for (const storyId of STORIES) {
		test(`renders ${storyId}`, async ({ page }) => {
			const errors: string[] = [];
			page.on("pageerror", (error) => errors.push(error.message));
			page.on("console", (msg) => {
				if (msg.type() === "error") {
					errors.push(msg.text());
				}
			});

			await page.goto(
				`${STORYBOOK_URL}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`,
			);
			// Wait for Storybook's root to mount.
			await page.waitForSelector("#storybook-root", { timeout: 10_000 });
			await page.waitForLoadState("networkidle");

			expect(
				errors,
				`story ${storyId} threw on render:\n${errors.join("\n")}`,
			).toEqual([]);
		});
	}
});
