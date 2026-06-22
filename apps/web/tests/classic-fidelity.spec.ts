import { expect, test } from "@playwright/test";

/**
 * 1:1 fidelity of the 2D now-playing screen — asserts the CURRENT machined
 * design language (the status-bar / artwork / progress fidelity passes), not
 * the early skeuomorph iteration it replaced (diamond scrubber, gradient
 * screen wash, CSS-bordered artwork). Selectors ride stable testids, never
 * DOM positions, so a layout refactor can't silently retarget an assertion.
 */

test.describe("iPod Classic 1:1 Fidelity", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByTestId("screen-progress").waitFor({ state: "visible" });
	});

	test("status bar carries the OS chrome — label left, battery right", async ({ page }) => {
		await expect(page.getByTestId("screen-status-label")).toContainText("Now Playing");
		await expect(page.getByTestId("screen-battery")).toBeVisible();
	});

	test("artwork seats with a hairline ring and a reflection beneath", async ({ page }) => {
		const artwork = page.locator('[data-export-layer="artwork"]').first();
		await expect(artwork).toBeVisible();

		// The classic treatment rides boxShadow (drop shadow + 1px hairline ring),
		// deliberately NOT a CSS border — a border would inset the art itself.
		const boxShadow = await artwork.evaluate((el) => getComputedStyle(el).boxShadow);
		expect(boxShadow).not.toBe("none");
		expect(boxShadow).toContain("1px");

		// The reflection is the vertically-flipped copy rendered behind/below.
		const reflection = page
			.getByTestId("os-layout-artwork")
			.locator("img")
			.first();
		const transform = await reflection.evaluate((el) => getComputedStyle(el).transform);
		expect(transform).toContain("matrix"); // scaleY(-1)
	});

	test("progress bar fills the classic track and counts the remainder down", async ({ page }) => {
		await expect(page.getByTestId("progress-track")).toBeVisible();

		const fillWidth = await page
			.getByTestId("progress-fill")
			.evaluate((el) => el.getBoundingClientRect().width);
		expect(fillWidth).toBeGreaterThan(0);

		await expect(page.getByTestId("remaining-time")).toContainText("-");
	});

	test("renders the full now-playing composition", async ({ page }) => {
		await expect(page.getByTestId("os-layout-artwork")).toBeVisible();
		await expect(page.getByTestId("track-title-text")).toBeVisible();
		await expect(page.getByTestId("screen-content")).toBeVisible();
	});
});
