import { test, expect } from "@playwright/test";

test.describe("Hardware Interaction Sanity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the screen to be visible
    await page.waitForSelector('[data-testid="ipod-screen"]');
  });

  test("Click Wheel buttons are interactive and not blocked by overlays", async ({
    page,
  }) => {
    const menuButton = page.getByTestId("click-wheel-menu-button");
    const playPauseButton = page.getByTestId("click-wheel-playpause-button");
    const centerButton = page.getByTestId("click-wheel-center");

    // Check visibility and clickability
    await expect(menuButton).toBeVisible();
    await expect(playPauseButton).toBeVisible();
    await expect(centerButton).toBeVisible();

    // Verify they are not blocked by an overlay (using hit testing)
    const menuBox = await menuButton.boundingBox();
    if (menuBox) {
      const elementAtPoint = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? el.outerHTML.substring(0, 100) : "null";
        },
        { x: menuBox.x + menuBox.width / 2, y: menuBox.y + menuBox.height / 2 },
      );

      // If blocked, this would return the overlay's HTML
      console.log("Element at menu button center:", elementAtPoint);
    }

    // Try clicking - if blocked by a non-pointer-events:none element, this will fail or timeout
    await menuButton.click();
    await playPauseButton.click();
    await centerButton.click();
  });

  test("Screen editable elements are reachable", async ({ page }) => {
    // In default "ipod-os" mode with "menu", elements might not be editable
    // Switch to "direct" mode or "now-playing" editable state
    await page.getByTestId("interaction-mode-direct-button").click();

    const trackTitle = page.getByTestId("track-title-text");
    await expect(trackTitle).toBeVisible();

    // Attempt to click to trigger edit mode
    await trackTitle.dblclick();

    // Check if an input appeared (standard behavior of EditableText)
    const input = page.locator('input[type="text"]').first();
    // Wait a bit for transition
    await expect(input).toBeVisible({ timeout: 5000 });
  });
});
