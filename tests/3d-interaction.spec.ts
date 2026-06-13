import { expect, test } from "@playwright/test";

/**
 * Hardware interaction on /3d — the click wheel's buttons must drive the live
 * screen exactly as they do on the 2D workbench. The wheel is a drei `Html`
 * portal floating over the WebGL canvas, so this guards the whole chain:
 * portal hit-testing → wheel handlers → OS reducer → screen re-render.
 */

test("MENU button on the 3D wheel opens the OS menu", async ({ page }) => {
	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	// Let the stage settle (needle-drop animation + portal layout).
	await page.waitForTimeout(2500);

	const menuButton = page.getByTestId("click-wheel-menu-button");
	await expect(menuButton).toBeVisible();
	await menuButton.click();

	await expect(page.getByTestId("ipod-os-menu")).toBeVisible({ timeout: 5_000 });
});

test("center select on the 3D wheel toggles play/pause", async ({ page }) => {
	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	await page.waitForTimeout(2500);

	const playPause = page.getByTestId("click-wheel-playpause-button");
	await expect(playPause).toBeVisible();

	// Play state shows on the screen as the countdown ticking: advancing ⇔ playing.
	// Sample → press → sample; the press must flip whichever state we started in.
	const remaining = page.getByTestId("remaining-time");
	await expect(remaining).toBeVisible();
	const isAdvancing = async () => {
		const a = await remaining.innerText();
		await page.waitForTimeout(2200);
		return (await remaining.innerText()) !== a;
	};

	const before = await isAdvancing();
	await playPause.click();
	const after = await isAdvancing();
	expect(after).toBe(!before);
});
