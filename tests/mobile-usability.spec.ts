import { test, expect } from "@playwright/test";
import path from "path";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test.describe("Mobile usability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("toolbox-toggle-button")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("toolbox-panel")).toBeHidden();
  });

  test("tap interactions stay usable on mobile", async ({ page }) => {
    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await page.getByTestId("theme-button").tap();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await page.touchscreen.tap(24, 120);
    await expect(page.getByTestId("theme-panel")).toBeHidden();
    await expect(page.getByTestId("toolbox-panel")).toBeHidden();

    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await expect(page.getByTestId("export-button")).toBeVisible();
    await expect(page.getByTestId("export-preset-select")).toHaveValue("product");
  });

  test("mobile upload opens immediate file path and updates artwork", async ({
    page,
  }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    await page.getByTestId("artwork-input").setInputFiles(fixtureImage);
    await expect(liveShell.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /data:image\//,
      {
        timeout: 15000,
      },
    );
  });

  test("single tap edit and touch seek work", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    await liveShell.getByText("Charcoal Baby").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill("Mobile Edit");
    await page.getByTestId("fixed-editor-done").tap();
    await expect(liveShell.getByText("Mobile Edit")).toBeVisible();

    const track = liveShell.getByTestId("progress-track");
    const box = await track.boundingBox();
    if (!box) throw new Error("progress track not found");

    await track.tap({
      position: {
        x: box.width * 0.7,
        y: box.height / 2,
      },
    });
    await expect(liveShell.getByTestId("elapsed-time")).not.toContainText("0:00");
  });

  test("mobile preview / record flow stays reachable", async ({ page }) => {
    await page.getByTestId("toolbox-toggle-button").tap();
    await page.getByTestId("export-format-gif").tap();
    await page.getByTestId("preview-record-button").tap();

    await expect(page.getByTestId("gif-preview-stage")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("gif-preview-play-toggle")).toBeVisible();
    await expect(page.getByTestId("gif-preview-scrubber")).toBeVisible();
  });

  test("long title wrapping and theme controls stay reachable on mobile", async ({
    page,
  }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await liveShell.getByText("Charcoal Baby").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill(longTitle);
    await page.getByTestId("fixed-editor-done").tap();

    const titleLayout = await liveShell.getByTestId("track-title-text").evaluate((el) => {
      const style = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(style.lineHeight) || 16;
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        lineHeight,
      };
    });

    expect(titleLayout.scrollWidth).toBeLessThanOrEqual(titleLayout.clientWidth + 1);
    expect(titleLayout.scrollHeight).toBeGreaterThan(titleLayout.lineHeight * 1.5);

    await page.getByTestId("toolbox-toggle-button").tap();
    await page.getByTestId("theme-button").tap();

    const themePanel = page.getByTestId("theme-panel");
    await expect(themePanel).toBeVisible();
    await page.getByTestId("save-song-snapshot-button").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("save-song-snapshot-button")).toBeVisible();
  });
});
