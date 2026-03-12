import { test, expect } from "@playwright/test";
import path from "path";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");

test.describe("Core interactions remain usable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible();
  });

  test("metadata title, theme popover, and export controls work", async ({ page }) => {
    await expect(page).toHaveTitle(/iPod Snapshot/i);

    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await expect(page.getByTestId("export-format-png")).toBeVisible();
    await expect(page.getByTestId("export-format-gif")).toBeVisible();
    await expect(page.getByTestId("export-preset-select")).toHaveValue("product");
  });

  test("interaction chrome resets to a clean state", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await liveShell.getByText("Charcoal Baby").click();
    await expect(page.getByTestId("theme-panel")).toBeHidden();

    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("theme-panel")).toBeHidden();
  });

  test("image upload updates artwork preview", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    const fileInput = page.getByTestId("artwork-input");
    await fileInput.setInputFiles(fixtureImage);

    const artwork = liveShell.getByTestId("artwork-image");
    await expect(artwork).toHaveAttribute("src", /data:image\//, {
      timeout: 15000,
    });
  });

  test("custom color picker flow saves case colors to localStorage", async ({ page }) => {
    await page.getByTestId("theme-button").click();
    const caseColorInput = page.getByTestId("custom-case-color-button");
    await caseColorInput.evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "#123abc");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("ipodSnapshotCaseCustomColors") || ""),
      )
      .toContain("#123ABC");
  });

  test("load snapshot applies test image/data and persists after reload", async ({
    page,
  }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    await page.getByTestId("theme-button").click();
    await page.getByTestId("load-song-snapshot-button").click();

    await expect(liveShell.getByText("Charcoal Baby")).toBeVisible();
    await expect(liveShell.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(liveShell.getByTestId("elapsed-time")).toContainText("0:05");

    await page.reload();
    await expect(liveShell.getByText("Charcoal Baby")).toBeVisible();
    await expect(liveShell.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(liveShell.getByTestId("elapsed-time")).toContainText("0:05");
  });

  test("save snapshot stores edited data and load restores it", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    await liveShell.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Snapshot QA");
    await titleInput.press("Enter");
    await expect(liveShell.getByText("Snapshot QA")).toBeVisible();

    await page.getByTestId("theme-button").click();
    await page.getByTestId("save-song-snapshot-button").click();
    await page.getByTestId("theme-button").click();

    await liveShell.getByText("Snapshot QA").dblclick();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Temp Value");
    await titleInput.press("Enter");
    await expect(liveShell.getByText("Temp Value")).toBeVisible();

    await page.getByTestId("theme-button").click();
    await page.getByTestId("load-song-snapshot-button").click();
    await expect(liveShell.getByText("Snapshot QA")).toBeVisible();
  });

  test("remaining-first timing keeps progress proportionate", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    const remaining = liveShell.getByTestId("remaining-time").locator("span");
    await remaining.dblclick();
    const remainingInput = page
      .getByTestId("live-ipod-shell")
      .getByTestId("remaining-time")
      .locator('input[type="text"]');
    await expect(remainingInput).toBeVisible();
    await remainingInput.fill("1:00");
    await remainingInput.press("Enter");

    await expect(liveShell.getByTestId("remaining-time")).toContainText("-1:00");

    const elapsed = liveShell.getByTestId("elapsed-time").locator("span");
    await elapsed.dblclick();
    const elapsedInput = liveShell
      .getByTestId("elapsed-time")
      .locator('input[type="text"]');
    await expect(elapsedInput).toBeVisible();
    await elapsedInput.fill("0:30");
    await elapsedInput.press("Enter");

    await expect(liveShell.getByTestId("elapsed-time")).toContainText("0:30");
    await expect(liveShell.getByTestId("remaining-time")).toContainText("-1:00");
    await expect(liveShell.getByTestId("progress-fill")).toHaveAttribute(
      "style",
      /width:\s*33/,
    );
  });

  test("png exports include preset id and increment ids", async ({ page }) => {
    await page.getByTestId("export-preset-select").selectOption("square");

    const firstDownload = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const first = await firstDownload;
    expect(first.suggestedFilename()).toMatch(/^ipod-0000-square-.*\.png$/);

    await expect(page.getByTestId("export-button")).toBeEnabled({ timeout: 10000 });

    const secondDownload = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const second = await secondDownload;
    expect(second.suggestedFilename()).toMatch(/^ipod-0001-square-.*\.png$/);
  });

  test("gif preview modal and recording popup work", async ({ page }) => {
    await page.getByTestId("export-format-gif").click();
    await page.getByTestId("export-preset-select").selectOption("portrait");

    await page.getByTestId("preview-record-button").click();
    await expect(page.getByTestId("gif-preview-stage")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("gif-preview-play-toggle")).toBeVisible();
    await expect(page.getByTestId("gif-preview-scrubber")).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await page.getByTestId("gif-preview-record-window").click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup.locator('[data-testid="recording-stage"]')).toBeVisible();
  });

  test("gif export downloads a gif after preview-capable frame generation", async ({
    page,
  }) => {
    await page.getByTestId("export-format-gif").click();
    await page.getByTestId("export-preset-select").selectOption("story");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^ipod-0000-story-.*\.gif$/);
    await expect(page.getByTestId("export-button")).toBeEnabled({ timeout: 15000 });
  });

  test("long titles wrap within the metadata panel", async ({ page }) => {
    const liveShell = page.getByTestId("live-ipod-shell");
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await liveShell.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(longTitle);
    await titleInput.press("Enter");

    await expect(liveShell.getByTestId("track-title-text")).toHaveText(longTitle);
    await expect(liveShell.getByTestId("track-title-text")).toBeVisible();

    const layout = await liveShell.getByTestId("track-title-text").evaluate((el) => {
      const style = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(style.lineHeight) || 16;
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        lineHeight,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.scrollHeight).toBeGreaterThan(layout.lineHeight * 1.5);
  });
});
