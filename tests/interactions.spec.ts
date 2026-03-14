import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");

test.describe("Core interactions remain usable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible();
  });

  test("metadata title + experience switching + settings popover work", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/iPod Snapshot/i);

    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await page.getByTestId("three-d-view-button").click();
    await expect(page.getByRole("button", { name: "Flat View Only" })).toBeVisible();

    await page.getByTestId("flat-view-button").click();
    await expect(page.getByRole("button", { name: "Export 2D Image" })).toBeVisible();

    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
  });

  test("interaction chrome resets to a clean state", async ({ page }) => {
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await page.getByText("Charcoal Baby").click();
    await expect(page.getByTestId("theme-panel")).toBeHidden();

    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("theme-panel")).toBeHidden();

    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
    await page.getByTestId("three-d-view-button").click();
    await expect(page.getByTestId("theme-panel")).toBeHidden();
  });

  test("image upload updates artwork preview", async ({ page }) => {
    const fileInput = page.getByTestId("artwork-input");
    await fileInput.setInputFiles(fixtureImage);

    const artwork = page.getByTestId("artwork-image");
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
    await page.getByTestId("theme-button").click();
    await page.getByTestId("load-song-snapshot-button").click();

    await expect(page.getByText("Charcoal Baby")).toBeVisible();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(page.getByTestId("elapsed-time")).toContainText("0:05");

    await page.reload();
    await expect(page.getByText("Charcoal Baby")).toBeVisible();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(page.getByTestId("elapsed-time")).toContainText("0:05");
  });

  test("save snapshot stores edited data and load restores it", async ({ page }) => {
    await page.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Snapshot QA");
    await titleInput.press("Enter");
    await expect(page.getByText("Snapshot QA")).toBeVisible();

    await page.getByTestId("theme-button").click();
    await page.getByTestId("save-song-snapshot-button").click();
    await page.getByTestId("theme-button").click();

    await page.getByText("Snapshot QA").dblclick();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Temp Value");
    await titleInput.press("Enter");
    await expect(page.getByText("Temp Value")).toBeVisible();

    await page.getByTestId("theme-button").click();
    await page.getByTestId("load-song-snapshot-button").click();
    await expect(page.getByText("Snapshot QA")).toBeVisible();

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("ipodSnapshotSongSnapshot") ?? ""),
      )
      .toContain("Snapshot QA");
  });

  test("remaining-first timing keeps progress proportionate", async ({ page }) => {
    const remaining = page.getByTestId("remaining-time").locator("span");
    await remaining.dblclick();
    const remainingInput = page
      .getByTestId("remaining-time")
      .locator('input[type="text"]');
    await expect(remainingInput).toBeVisible();
    await remainingInput.fill("1:00");
    await remainingInput.press("Enter");

    await expect(page.getByTestId("remaining-time")).toContainText("-1:00");

    const elapsed = page.getByTestId("elapsed-time").locator("span");
    await elapsed.dblclick();
    const elapsedInput = page.getByTestId("elapsed-time").locator('input[type="text"]');
    await expect(elapsedInput).toBeVisible();
    await elapsedInput.fill("0:30");
    await elapsedInput.press("Enter");

    await expect(page.getByTestId("elapsed-time")).toContainText("0:30");
    await expect(page.getByTestId("remaining-time")).toContainText("-1:00");
    await expect(page.getByTestId("progress-fill")).toHaveAttribute(
      "style",
      /width:\s*33/,
    );
  });

  test("export filenames use incremental ids", async ({ page }) => {
    const firstDownload = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const first = await firstDownload;
    expect(first.suggestedFilename()).toMatch(/^ipod-0000-/);

    await expect(page.getByTestId("export-button")).toBeEnabled({ timeout: 10000 });

    const secondDownload = page.waitForEvent("download");
    await page.getByTestId("export-button").click();
    const second = await secondDownload;
    expect(second.suggestedFilename()).toMatch(/^ipod-0001-/);
  });

  test("preview mode persists after reload", async ({ page }) => {
    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
    await expect(page.getByText("Title will scroll in the GIF along with progress and time.")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
  });

  test("preview mode animates short titles and exports gif", async ({ page }) => {
    await page.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Glow");
    await titleInput.press("Enter");

    await page.getByTestId("preview-view-button").click();

    const marqueePresence = await page.getByTestId("track-title-text").evaluate((el) => ({
      hasTrack: !!el.querySelector('[data-marquee-track="true"]'),
      text: el.textContent,
    }));

    expect(marqueePresence.hasTrack).toBe(true);
    expect(marqueePresence.text?.includes("Glow")).toBe(true);
    await expect(page.getByTestId("gif-export-button")).toContainText("Export Animated GIF");
    await expect(page.getByTestId("gif-export-button")).toBeEnabled();

    await page.waitForTimeout(2600);

    const movedTransform = await page.getByTestId("track-title-text").evaluate((el) => {
      const track = el.querySelector<HTMLElement>('[data-marquee-track="true"]');
      return track?.style.transform ?? "";
    });
    expect(movedTransform).not.toBe("translateX(0px)");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("gif-export-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) throw new Error("download path missing");

    const header = fs.readFileSync(downloadPath).subarray(0, 6).toString("ascii");
    expect(header).toBe("GIF89a");
  });

  test("preview marquee animates long titles and exports a gif", async ({ page }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await page.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(longTitle);
    await titleInput.press("Enter");

    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
    await expect(page.getByText("The title is crawling. Export Animated GIF to capture it.")).toBeVisible();
    await expect(page.getByTestId("gif-export-button")).toBeEnabled();

    await expect
      .poll(async () =>
        page.getByTestId("track-title-text").evaluate((el) => {
          const track = el.querySelector<HTMLElement>('[data-marquee-track="true"]');
          return track?.style.transform ?? "";
        }),
      )
      .toBe("translateX(0px)");

    await page.waitForTimeout(2600);

    const movedTransform = await page.getByTestId("track-title-text").evaluate((el) => {
      const track = el.querySelector<HTMLElement>('[data-marquee-track="true"]');
      return track?.style.transform ?? "";
    });
    expect(movedTransform).not.toBe("translateX(0px)");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("gif-export-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^ipod-0000-.*\.gif$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) throw new Error("download path missing");

    const header = fs.readFileSync(downloadPath).subarray(0, 6).toString("ascii");
    expect(header).toBe("GIF89a");
  });

  test("export does not leave controls blocked", async ({ page }) => {
    await page.getByTestId("export-button").click();

    await expect(page.getByTestId("theme-button")).toBeVisible({
      timeout: 15000,
    });
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
  });

  test("long titles wrap within the metadata panel", async ({ page }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await page.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(longTitle);
    await titleInput.press("Enter");

    await expect(page.getByTestId("track-title-text")).toHaveText(longTitle);
    await expect(page.getByTestId("track-title-text")).toBeVisible();

    const layout = await page.getByTestId("track-title-text").evaluate((el) => {
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
