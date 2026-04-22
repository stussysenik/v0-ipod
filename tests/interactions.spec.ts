import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");
const LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS =
  "rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors border-[#111827] bg-white/90 text-[#111827]";
const LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS =
  "rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors border-[#C8CDD3] bg-white/65 text-[#6B7280] hover:bg-white/80";

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

test.describe("Core interactions remain usable", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ipodSnapshotUiState",
        JSON.stringify({ interactionModel: "direct", osScreen: "now-playing" }),
      );
    });
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible();
  });

  test("metadata title + experience switching + settings popover work", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/iPod Snapshot/i);

    await openThemePanel(page);

    await page.getByTestId("three-d-view-button").click();
    await expect(page.getByRole("button", { name: "Flat View Only" })).toBeVisible();

    await page.getByTestId("flat-view-button").click();
    await expect(page.getByRole("button", { name: "Export 2D Image" })).toBeVisible();

    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
  });

  test("interaction chrome resets to a clean state", async ({ page }) => {
    await openThemePanel(page);

    await page.getByText("Chamakay").click();
    await expect(page.getByTestId("theme-panel")).toBeHidden();

    await openThemePanel(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("theme-panel")).toBeHidden();

    await openThemePanel(page);
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
    await openThemePanel(page);
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
    await openThemePanel(page);
    await page.getByTestId("load-song-snapshot-button").click();

    await expect(page.getByText("Chamakay")).toBeVisible();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(page.getByTestId("elapsed-time")).toContainText("0:05");

    await page.reload();
    await expect(page.getByText("Chamakay")).toBeVisible();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
    await expect(page.getByTestId("elapsed-time")).toContainText("0:05");
  });

  test("save snapshot stores edited data and load restores it", async ({ page }) => {
    await page.getByText("Chamakay").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Snapshot QA");
    await titleInput.press("Enter");
    await expect(page.getByText("Snapshot QA")).toBeVisible();

    await openThemePanel(page);
    await page.getByTestId("save-song-snapshot-button").click();
    await openThemePanel(page);

    await page.getByText("Snapshot QA").dblclick();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Temp Value");
    await titleInput.press("Enter");
    await expect(page.getByText("Temp Value")).toBeVisible();

    await openThemePanel(page);
    await page.getByTestId("load-song-snapshot-button").click();
    await expect(page.getByText("Snapshot QA")).toBeVisible();

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("ipodSnapshotSongSnapshot") ?? ""),
      )
      .toContain("Snapshot QA");
  });

  test("preset selection and authentic iPod OS mode persist after reload", async ({
    page,
  }) => {
    await openThemePanel(page);
    await page.getByTestId("hardware-preset-classic-2009-button").click();
    await page.getByTestId("interaction-mode-ipod-os-button").click();

    await expect(page.getByTestId("ipod-os-menu")).toBeVisible();
    await expect(page.getByTestId("ipod-os-selected-menu-item")).toContainText("Music");

    await page.reload();
    await expect(page.getByTestId("ipod-os-menu")).toBeVisible();

    await openThemePanel(page);
    await expect(page.getByTestId("hardware-preset-classic-2009-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("interaction-mode-ipod-os-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("interaction mode buttons keep their locked visual treatment", async ({
    page,
  }) => {
    await openThemePanel(page);

    await expect(page.getByTestId("interaction-mode-direct-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS,
    );
    await expect(page.getByTestId("interaction-mode-ipod-os-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS,
    );
    await expect(
      page.getByTestId("interaction-mode-ipod-os-original-button"),
    ).toHaveClass(`col-span-2 ${LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS}`);

    await page.getByTestId("interaction-mode-ipod-os-button").click();

    await expect(page.getByTestId("interaction-mode-direct-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS,
    );
    await expect(page.getByTestId("interaction-mode-ipod-os-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS,
    );
    await expect(
      page.getByTestId("interaction-mode-ipod-os-original-button"),
    ).toHaveClass(`col-span-2 ${LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS}`);

    await page.getByTestId("interaction-mode-ipod-os-original-button").click();

    await expect(page.getByTestId("interaction-mode-direct-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS,
    );
    await expect(page.getByTestId("interaction-mode-ipod-os-button")).toHaveClass(
      LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS,
    );
    await expect(
      page.getByTestId("interaction-mode-ipod-os-original-button"),
    ).toHaveClass(`col-span-2 ${LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS}`);
  });

  test("iPod OS Original mirrors the standard menu layout without a divider", async ({
    page,
  }) => {
    await openThemePanel(page);
    await page.getByTestId("interaction-mode-ipod-os-original-button").click();

    await expect(page.getByTestId("ipod-os-menu")).toBeVisible();
    await expect(page.getByTestId("ipod-os-original-divider")).toHaveCount(0);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("ipodSnapshotUiState");
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return {
            interactionModel: parsed.interactionModel,
            osOriginalMenuSplit: parsed.osOriginalMenuSplit,
          };
        }),
      )
      .toEqual({
        interactionModel: "ipod-os-original",
        osOriginalMenuSplit: expect.any(Number),
      });
  });

  test("iPod OS Now Playing drag mode saves element offsets", async ({ page }) => {
    await openThemePanel(page);
    await page.getByTestId("interaction-mode-ipod-os-button").click();
    await page.keyboard.press("Escape");

    await page.getByTestId("click-wheel-center").click();
    await expect(page.getByTestId("screen-content")).toBeVisible();

    await page.getByTestId("click-wheel-center").click();

    const title = page.getByTestId("track-title");
    const box = await title.boundingBox();
    if (!box) throw new Error("title not found");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 18, box.y + box.height / 2 + 9, {
      steps: 6,
    });
    await page.mouse.up();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("ipodSnapshotUiState");
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed.osNowPlayingLayout?.title ?? null;
        }),
      )
      .toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
      });

    await expect(title).not.toHaveAttribute("data-layout-x", "0");
    await expect(title).not.toHaveAttribute("data-layout-y", "0");
  });

  test("iPod OS Original applies saved Now Playing drag offsets like iPod OS", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "ipodSnapshotUiState",
        JSON.stringify({
          interactionModel: "ipod-os-original",
          osScreen: "now-playing",
          osNowPlayingLayout: {
            title: { x: 18, y: 9 },
          },
        }),
      );
    });

    await page.reload();

    const title = page.getByTestId("track-title");
    await expect(title).toHaveAttribute("data-layout-x", "18");
    await expect(title).toHaveAttribute("data-layout-y", "9");
  });

  test("range snapshots serialize start and end times", async ({ page }) => {
    await openThemePanel(page);
    await page.getByTestId("snapshot-selection-range-button").click();

    const startInput = page.getByTestId("snapshot-range-start-input");
    await startInput.fill("0:30");
    await startInput.blur();

    const endInput = page.getByTestId("snapshot-range-end-input");
    await endInput.fill("1:10");
    await endInput.blur();

    await page.getByTestId("save-song-snapshot-button").click();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("ipodSnapshotSongSnapshot");
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return {
            selectionKind: parsed.playback.selectionKind,
            rangeStartTime: parsed.playback.rangeStartTime,
            rangeEndTime: parsed.playback.rangeEndTime,
          };
        }),
      )
      .toEqual({
        selectionKind: "range",
        rangeStartTime: 30,
        rangeEndTime: 70,
      });
  });

  test("legacy snapshot payloads migrate into the v2 schema", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ipodSnapshotSongSnapshot",
        JSON.stringify({
          metadata: {
            title: "Legacy Migration",
            artist: "Archivist",
            album: "Schema Drift",
            artwork: "/placeholder-logo.png",
            duration: 180,
            currentTime: 17,
            rating: 4,
            trackNumber: 3,
            totalTracks: 12,
          },
          ui: {
            skinColor: "#FBFBF8",
            bgColor: "#F4F4EF",
            viewMode: "preview",
          },
        }),
      );
    });

    await page.reload();
    await openThemePanel(page);
    await page.getByTestId("load-song-snapshot-button").click();

    await expect(page.getByTestId("track-title-text")).toContainText("Legacy Migration");
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem("ipodSnapshotSongSnapshot");
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return {
            schemaVersion: parsed.schemaVersion,
            hardwarePreset: parsed.ui.hardwarePreset,
            interactionModel: parsed.ui.interactionModel,
            currentTime: parsed.playback.currentTime,
          };
        }),
      )
      .toEqual({
        schemaVersion: 2,
        hardwarePreset: "classic-2007",
        interactionModel: "ipod-os",
        currentTime: 17,
      });
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
    await expect(
      page.getByText("Title will scroll in the GIF along with progress and time."),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
  });

  test("preview mode animates short titles and exports gif", async ({ page }) => {
    await page.getByText("Chamakay").dblclick();
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
    await expect(page.getByTestId("gif-export-button")).toContainText(
      "Export Animated GIF",
    );
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

    await page.getByText("Chamakay").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(longTitle);
    await titleInput.press("Enter");

    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
    await expect(
      page.getByText("The title is crawling. Export Animated GIF to capture it."),
    ).toBeVisible();
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
    await openThemePanel(page);
  });

  test("long titles stay bounded within the metadata panel", async ({ page }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await page.getByText("Chamakay").dblclick();
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
        marqueeActive: el.getAttribute("data-marquee-active"),
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.scrollHeight).toBeLessThanOrEqual(layout.lineHeight * 1.35);
    expect(layout.marqueeActive).toBeNull();
  });
});
