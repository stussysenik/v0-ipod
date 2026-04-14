import fs from "fs";

import { type Page, expect, test } from "@playwright/test";

async function openThemePanel(page: Page): Promise<void> {
	const button = page.getByTestId("theme-button");
	const panel = page.getByTestId("theme-panel");

	for (let attempt = 0; attempt < 2; attempt += 1) {
		await button.click();
		try {
			await expect(panel).toBeVisible({ timeout: 3000 });
			return;
		} catch {
			// Retry once when the initial click is lost to transient UI timing.
		}
	}

	await expect(panel).toBeVisible();
}

test.describe("Export state fidelity", () => {
	test("flat export filenames encode preset and interaction context", async ({ page }) => {
		await page.goto("/");

		await openThemePanel(page);
		await page.getByTestId("hardware-preset-classic-2009-button").click();
		await page.getByTestId("interaction-mode-ipod-os-button").click();
		await expect(page.getByTestId("ipod-os-menu")).toBeVisible();
		await page.keyboard.press("Escape");

		const downloadPromise = page.waitForEvent("download");
		await page.getByTestId("export-button").click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toBe(
			"ipod-0000-classic-2009-ipod-os-menu-moment-chamakay.png",
		);

		const downloadPath = await download.path();
		expect(downloadPath).not.toBeNull();
		if (!downloadPath) {
			throw new Error("download path missing");
		}

		const header = fs.readFileSync(downloadPath).subarray(0, 8).toString("hex");
		expect(header).toBe("89504e470d0a1a0a");
	});

	test("preview gif export stays valid for authentic menu state", async ({ page }) => {
		await page.goto("/");
		await page.getByTestId("preview-view-button").click();
		await expect(page.getByTestId("gif-export-button")).toBeVisible();

		await openThemePanel(page);
		await page.getByTestId("hardware-preset-classic-2008-black-button").click();
		await page.getByTestId("interaction-mode-ipod-os-button").click();
		await expect(page.getByTestId("ipod-os-menu")).toBeVisible();
		await page.keyboard.press("Escape");

		const downloadPromise = page.waitForEvent("download");
		await page.getByTestId("gif-export-button").click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toBe(
			"ipod-0000-classic-2008-black-ipod-os-menu-moment-chamakay.gif",
		);

		const downloadPath = await download.path();
		expect(downloadPath).not.toBeNull();
		if (!downloadPath) {
			throw new Error("download path missing");
		}

		const header = fs.readFileSync(downloadPath).subarray(0, 6).toString("ascii");
		expect(header).toBe("GIF89a");
	});
});
