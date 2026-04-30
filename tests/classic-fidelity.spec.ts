import { test, expect } from "@playwright/test";

test.describe("iPod Classic 1:1 Fidelity", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");

		// Ensure we are in Classic mode
		await page.click('[data-testid="theme-button"]');
		const classicButton = page.locator('[data-testid="fidelity-classic-button"]');
		if (await classicButton.isVisible()) {
			await classicButton.click();
		}
		await page.click('[data-testid="theme-button"]'); // Close panel
		await page.waitForTimeout(500);
	});

	test("should render status bar with 1:1 fidelity structure", async ({ page }) => {
		const statusBar = page.locator('[data-testid="ipod-screen"] > div > div').first();

		// Check for 3-column layout (flex-1 classes)
		const leftCol = statusBar.locator("div").first();
		const centerCol = statusBar.locator("div").nth(1);
		const rightCol = statusBar.locator("div").last();

		await expect(leftCol).toContainText("Now Playing");
		await expect(centerCol).toContainText(/of/); // Track X of Y
		await expect(rightCol).toBeVisible(); // Battery
	});

	test("should render artwork with classic border and reflection", async ({ page }) => {
		const artworkContainer = page.locator('[data-export-layer="artwork"]');

		// Check for 1px border and shadow
		const boxModel = await artworkContainer.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				borderWidth: style.borderWidth,
				borderColor: style.borderColor,
				boxShadow: style.boxShadow,
			};
		});

		expect(boxModel.borderWidth).toBe("1px");
		// We used #A1A1A1 which is rgb(161, 161, 161)
		expect(boxModel.borderColor).toBe("rgb(161, 161, 161)");
		expect(boxModel.boxShadow).not.toBe("none");

		// Check for reflection overlay
		const reflection = artworkContainer.locator("div").last();
		await expect(reflection).toBeVisible();
	});

	test("should render progress bar with diamond scrubber", async ({ page }) => {
		const progressBar = page.locator('[data-testid="progress-track"]');

		// Check for diamond scrubber (it's a div with rotate-45)
		const scrubber = progressBar.locator("div").last();
		const transform = await scrubber.evaluate(
			(el) => window.getComputedStyle(el).transform,
		);

		// matrix(...) for 45deg rotation
		expect(transform).toContain("matrix");

		// Check for negative sign on remaining time
		const remainingTime = page.locator('[data-testid="remaining-time"]');
		await expect(remainingTime).toContainText("-");
	});

	test("should have a gradient background on the screen content", async ({ page }) => {
		const content = page.locator('[data-testid="ipod-screen"] > div > div').nth(1);
		const background = await content.evaluate(
			(el) => window.getComputedStyle(el).background,
		);

		expect(background).toContain("linear-gradient");
		// Check for our colors #F7F7F7 and #E2E2E2
		expect(background).toContain("rgb(247, 247, 247)");
		expect(background).toContain("rgb(226, 226, 226)");
	});
});
