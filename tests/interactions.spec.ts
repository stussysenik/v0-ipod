import { test, expect, devices, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");

async function waitForExportResult(page: Page, markerText: string) {
  return waitForConsolePayload<{
    success: boolean;
    method: string;
    capturePath?: string;
    error?: string;
  }>(
    page,
    markerText,
    (
      value,
    ): value is {
      success: boolean;
      method: string;
      capturePath?: string;
      error?: string;
    } =>
      !!value &&
      typeof value === "object" &&
      typeof (value as { success?: unknown }).success === "boolean" &&
      typeof (value as { method?: unknown }).method === "string",
  );
}

async function waitForConsolePayload<T>(
  page: Page,
  markerText: string,
  predicate: (value: unknown) => value is T,
) {
  return await new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off("console", onConsole);
      reject(new Error(`Timed out waiting for ${markerText} log`));
    }, 25000);

    const onConsole = async (msg: ConsoleMessage) => {
      if (!msg.text().includes(markerText)) return;

      try {
        const args = await Promise.all(
          msg.args().map(async (arg) => {
            try {
              return await arg.jsonValue();
            } catch {
              return null;
            }
          }),
        );

        const payload = args.find((value) => predicate(value));
        if (!payload) return;

        clearTimeout(timeout);
        page.off("console", onConsole);
        resolve(payload);
      } catch (error) {
        clearTimeout(timeout);
        page.off("console", onConsole);
        reject(error);
      }
    };

    page.on("console", onConsole);
  });
}

async function waitForGifExportResult(page: Page) {
  return waitForExportResult(page, "[gif-export] finished");
}

test.describe("Core interactions remain usable", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: undefined,
      });
    });
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

  test("text fields accept paste and open the inline editor with the pasted value", async ({
    page,
  }) => {
    const pastedTitle = "Pasted from clipboard";
    const titleField = page.getByTestId("track-title-text");

    await titleField.focus();
    await titleField.evaluate((el, text) => {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: data,
      });
      el.dispatchEvent(event);
    }, pastedTitle);

    await expect(titleField).toHaveValue(pastedTitle);
    await titleField.press("Enter");
    await expect(page.getByText(pastedTitle)).toBeVisible();
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

    const screenChrome = await page.evaluate(() => {
      const stars = document.querySelector<HTMLElement>('[data-testid="star-rating"]');
      const track = document.querySelector<HTMLElement>('[data-testid="progress-track"]');
      const fill = document.querySelector<HTMLElement>('[data-testid="progress-fill"]');
      if (!stars || !track || !fill) {
        return null;
      }

      const trackRect = track.getBoundingClientRect();
      const fillRect = fill.getBoundingClientRect();
      return {
        starTransform: window.getComputedStyle(stars).transform,
        starHeight: stars.getBoundingClientRect().height,
        fillInsetLeft: fillRect.left - trackRect.left,
        fillInsetTop: fillRect.top - trackRect.top,
        fillInsetBottom: trackRect.bottom - fillRect.bottom,
      };
    });

    expect(screenChrome).not.toBeNull();
    if (!screenChrome) {
      throw new Error("screen chrome metrics missing");
    }
    expect(screenChrome.starTransform).toBe("none");
    expect(screenChrome.starHeight).toBeGreaterThanOrEqual(8);
    expect(screenChrome.starHeight).toBeLessThanOrEqual(12);
    expect(screenChrome.fillInsetLeft).toBeGreaterThanOrEqual(0.5);
    expect(screenChrome.fillInsetTop).toBeGreaterThanOrEqual(0.5);
    expect(screenChrome.fillInsetBottom).toBeGreaterThanOrEqual(0.5);
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

  test("flat export uses the constrained export-safe pipeline", async ({ page }) => {
    const startPromise = waitForConsolePayload<{
      constrainedFrame: boolean;
      preserveEffects: boolean;
      pipelineVersion: string;
    }>(
      page,
      "[export:diagnostics] start",
      (
        value,
      ): value is {
        constrainedFrame: boolean;
        preserveEffects: boolean;
        pipelineVersion: string;
      } =>
        !!value &&
        typeof value === "object" &&
        typeof (value as { constrainedFrame?: unknown }).constrainedFrame === "boolean" &&
        typeof (value as { preserveEffects?: unknown }).preserveEffects === "boolean" &&
        typeof (value as { pipelineVersion?: unknown }).pipelineVersion === "string",
    );
    const resultPromise = waitForExportResult(page, "[export] finished");
    const downloadPromise = page.waitForEvent("download");

    await page.getByTestId("export-button").click();

    const [start, result, download] = await Promise.all([
      startPromise,
      resultPromise,
      downloadPromise,
    ]);

    expect(start.constrainedFrame).toBe(true);
    expect(start.preserveEffects).toBe(false);
    expect(start.pipelineVersion).toContain("tokenized-2d-v4");
    expect(download.suggestedFilename()).toMatch(/^ipod-0000-.*\.png$/);
    expect(result.success).toBe(true);
    expect(result.capturePath).toBe("detached-html-to-image");
  });

  test("preview mode persists after reload", async ({ page }) => {
    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
    await expect(
      page.getByText("This title fits. Use a longer song title to trigger the crawl."),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("gif-export-button")).toBeVisible();
  });

  test("preview mode keeps short titles static", async ({ page }) => {
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

    expect(marqueePresence.hasTrack).toBe(false);
    expect(marqueePresence.text?.includes("Glow")).toBe(true);
    await expect(page.getByTestId("gif-export-button")).toContainText(
      "Need Longer Title",
    );
    await expect(page.getByTestId("gif-export-button")).toBeDisabled();
  });

  test("preview marquee animates long titles and exports a gif", async ({ page }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";
    const gifLogs: string[] = [];
    const onConsole = (msg: ConsoleMessage) => {
      const text = msg.text();
      if (text.includes("[gif-export")) {
        gifLogs.push(text);
      }
    };
    page.on("console", onConsole);

    await page.getByText("Charcoal Baby").dblclick();
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

    const screenLayout = await page.getByTestId("screen-content").evaluate((el) => {
      const style = window.getComputedStyle(el);
      const artwork = el.querySelector<HTMLElement>('[data-export-layer="artwork"]');
      const meta = el.querySelector<HTMLElement>('[data-testid="track-meta"]');
      if (!artwork || !meta) {
        return null;
      }

      const artworkRect = artwork.getBoundingClientRect();
      const metaRect = meta.getBoundingClientRect();

      return {
        paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
        paddingRight: Number.parseFloat(style.paddingRight) || 0,
        paddingTop: Number.parseFloat(style.paddingTop) || 0,
        gap: metaRect.left - artworkRect.right,
        artworkWidth: artworkRect.width,
        metaWidth: metaRect.width,
        topAlignmentDelta: Math.abs(metaRect.top - artworkRect.top),
      };
    });
    expect(screenLayout).not.toBeNull();
    if (!screenLayout) {
      throw new Error("screen layout metrics missing");
    }
    expect(screenLayout.paddingLeft).toBeGreaterThanOrEqual(13);
    expect(screenLayout.paddingRight).toBeGreaterThanOrEqual(13);
    expect(screenLayout.paddingTop).toBeGreaterThanOrEqual(15);
    expect(screenLayout.gap).toBeGreaterThanOrEqual(10);
    expect(screenLayout.gap).toBeLessThanOrEqual(16);
    expect(screenLayout.metaWidth).toBeGreaterThan(screenLayout.artworkWidth + 24);
    expect(screenLayout.topAlignmentDelta).toBeLessThanOrEqual(3);

    const marqueeLayout = await page.getByTestId("track-title-text").evaluate((el) => {
      return {
        gapWidth: Number(el.getAttribute("data-marquee-gap-width") ?? "0"),
        usableWidth: Number(el.getAttribute("data-marquee-usable-width") ?? "0"),
        viewportWidth: Number(el.getAttribute("data-marquee-viewport-width") ?? "0"),
        cycleDurationMs: Number(el.getAttribute("data-marquee-cycle-duration-ms") ?? "0"),
        clientWidth: el.clientWidth,
      };
    });
    expect(marqueeLayout.gapWidth).toBeLessThanOrEqual(52);
    expect(marqueeLayout.usableWidth).toBe(marqueeLayout.clientWidth);
    expect(marqueeLayout.usableWidth).toBe(marqueeLayout.viewportWidth);
    expect(marqueeLayout.cycleDurationMs).toBeGreaterThan(0);
    expect(marqueeLayout.cycleDurationMs).toBeLessThan(20000);

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

    const resultPromise = waitForGifExportResult(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("gif-export-button").click();
    await expect(page.getByTestId("export-stage-panel")).toBeVisible();
    await expect(page.getByTestId("export-stage-title")).toContainText(
      /Preparing scene|Encoding frames|Saving GIF/,
    );
    const [result, download] = await Promise.all([resultPromise, downloadPromise]);
    expect(result.success).toBe(true);
    expect(result.capturePath).toBe("detached-html-to-image-gif");
    expect(download.suggestedFilename()).toMatch(/^ipod-0000-.*\.gif$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) throw new Error("download path missing");

    const header = fs.readFileSync(downloadPath).subarray(0, 6).toString("ascii");
    expect(header).toBe("GIF89a");
    expect(gifLogs.join("\n")).not.toContain("font is undefined");
    expect(gifLogs.join("\n")).not.toContain("[gif-export:diagnostics] failure");
    page.off("console", onConsole);
  });

  test("gif export falls back safely when font embedding rules are malformed", async ({
    page,
  }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";
    const gifLogs: string[] = [];
    const onConsole = (msg: ConsoleMessage) => {
      const text = msg.text();
      if (text.includes("[gif-export")) {
        gifLogs.push(text);
      }
    };
    page.on("console", onConsole);

    await page.addStyleTag({
      content:
        '@font-face { src: url("data:font/woff2;base64,d09GMgABAAAAA") format("woff2"); }',
    });

    await page.getByText("Charcoal Baby").dblclick();
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(longTitle);
    await titleInput.press("Enter");

    await page.getByTestId("preview-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeEnabled();

    const resultPromise = waitForGifExportResult(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("gif-export-button").click();
    const [result, download] = await Promise.all([resultPromise, downloadPromise]);

    expect(result.success).toBe(true);
    expect(download.suggestedFilename()).toMatch(/^ipod-0000-.*\.gif$/);
    expect(gifLogs.join("\n")).not.toContain("font is undefined");
    expect(gifLogs.join("\n")).not.toContain("[gif-export:diagnostics] failure");

    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
    page.off("console", onConsole);
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

test.describe("Native export delivery", () => {
  test("desktop export prefers the native save picker when available", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const savePickerCalls: Array<{
        closed?: boolean;
        options?: unknown;
        write?: { size: number; type: string };
      }> = [];

      Object.defineProperty(window, "__savePickerCalls", {
        configurable: true,
        value: savePickerCalls,
      });
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: async (options?: unknown) => {
          const call: {
            closed?: boolean;
            options?: unknown;
            write?: { size: number; type: string };
          } = { options };
          savePickerCalls.push(call);
          return {
            createWritable: async () => ({
              write: async (blob: Blob) => {
                call.write = { size: blob.size, type: blob.type };
              },
              close: async () => {
                call.closed = true;
              },
            }),
          };
        },
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible();

    const resultPromise = waitForExportResult(page, "[export] finished");
    await page.getByTestId("export-button").click();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.method).toBe("save-picker");

    const savePickerCalls = await page.evaluate(() => {
      const windowWithCalls = window as Window & {
        __savePickerCalls?: Array<{
          closed?: boolean;
          options?: { startIn?: string; suggestedName?: string };
          write?: { size: number; type: string };
        }>;
      };
      return windowWithCalls.__savePickerCalls ?? [];
    });

    expect(savePickerCalls).toHaveLength(1);
    expect(savePickerCalls[0]?.options?.startIn).toBe("downloads");
    expect(savePickerCalls[0]?.options?.suggestedName).toMatch(/^ipod-0000-.*\.png$/);
    expect(savePickerCalls[0]?.write?.type).toBe("image/png");
    expect(savePickerCalls[0]?.write?.size ?? 0).toBeGreaterThan(1000);
    expect(savePickerCalls[0]?.closed).toBe(true);
  });

  test("mobile export prefers native share when available", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      const shareCalls: Array<{
        files: Array<{ name: string; size: number; type: string }>;
      }> = [];

      Object.defineProperty(window, "__shareCalls", {
        configurable: true,
        value: shareCalls,
      });
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: (data?: { files?: File[] }) =>
          Array.isArray(data?.files) && data.files.length > 0,
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data?: { files?: File[] }) => {
          shareCalls.push({
            files: (data?.files ?? []).map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
          });
        },
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("toolbox-toggle-button")).toBeVisible();
    if (!(await page.getByTestId("toolbox-panel").isVisible())) {
      await page.getByTestId("toolbox-toggle-button").click();
    }
    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await expect(page.getByTestId("export-button")).toBeVisible();
    await page.waitForTimeout(400);
    await page.getByTestId("export-button").scrollIntoViewIfNeeded();

    const resultPromise = waitForExportResult(page, "[export] finished");
    await page.getByTestId("export-button").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect
      .poll(
        async () => {
          const shareCalls = await page.evaluate(() => {
            const windowWithCalls = window as Window & {
              __shareCalls?: Array<{
                files: Array<{ name: string; size: number; type: string }>;
              }>;
            };
            return windowWithCalls.__shareCalls ?? [];
          });
          return shareCalls.length;
        },
        {
          timeout: 20000,
        },
      )
      .toBe(1);
    const result = await resultPromise;

    const shareCalls = await page.evaluate(() => {
      const windowWithCalls = window as Window & {
        __shareCalls?: Array<{
          files: Array<{ name: string; size: number; type: string }>;
        }>;
      };
      return windowWithCalls.__shareCalls ?? [];
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe("share");
    expect(shareCalls).toHaveLength(1);
    expect(shareCalls[0]?.files[0]?.name).toMatch(/^ipod-0000-.*\.png$/);
    expect(shareCalls[0]?.files[0]?.type).toBe("image/png");
    expect(shareCalls[0]?.files[0]?.size ?? 0).toBeGreaterThan(1000);

    await context.close();
  });

  test("mobile gif export prefers native share when available", async ({ browser }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";
    const context = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      const shareCalls: Array<{
        files: Array<{ name: string; size: number; type: string }>;
      }> = [];

      Object.defineProperty(window, "__shareCalls", {
        configurable: true,
        value: shareCalls,
      });
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: (data?: { files?: File[] }) =>
          Array.isArray(data?.files) &&
          data.files.length > 0 &&
          data.files.every((file) => file.type === "image/gif"),
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data?: { files?: File[] }) => {
          shareCalls.push({
            files: (data?.files ?? []).map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
          });
        },
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("toolbox-toggle-button")).toBeVisible();
    if (!(await page.getByTestId("toolbox-panel").isVisible())) {
      await page.getByTestId("toolbox-toggle-button").click();
    }

    await page.getByTestId("track-title-text").click();
    await expect(page.getByTestId("fixed-editor-input")).toBeVisible();
    await page.getByTestId("fixed-editor-input").fill(longTitle);
    await page.getByTestId("fixed-editor-done").click();
    await expect(page.getByTestId("track-title-text")).toContainText(longTitle);

    if (!(await page.getByTestId("toolbox-panel").isVisible())) {
      await page.getByTestId("toolbox-toggle-button").click();
    }
    await expect(page.getByTestId("preview-view-button")).toBeVisible();
    await page.getByTestId("preview-view-button").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(page.getByTestId("gif-export-button")).toBeEnabled();
    await page.getByTestId("gif-export-button").scrollIntoViewIfNeeded();

    const resultPromise = waitForGifExportResult(page);
    await page.getByTestId("gif-export-button").evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect
      .poll(
        async () => {
          const shareCalls = await page.evaluate(() => {
            const windowWithCalls = window as Window & {
              __shareCalls?: Array<{
                files: Array<{ name: string; size: number; type: string }>;
              }>;
            };
            return windowWithCalls.__shareCalls ?? [];
          });
          return shareCalls.length;
        },
        {
          timeout: 25000,
        },
      )
      .toBe(1);
    const result = await resultPromise;

    const shareCalls = await page.evaluate(() => {
      const windowWithCalls = window as Window & {
        __shareCalls?: Array<{
          files: Array<{ name: string; size: number; type: string }>;
        }>;
      };
      return windowWithCalls.__shareCalls ?? [];
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe("share");
    expect(result.capturePath).toBe("detached-html-to-image-gif");
    expect(shareCalls).toHaveLength(1);
    expect(shareCalls[0]?.files[0]?.name).toMatch(/^ipod-0000-.*\.gif$/);
    expect(shareCalls[0]?.files[0]?.type).toBe("image/gif");
    expect(shareCalls[0]?.files[0]?.size ?? 0).toBeGreaterThan(1000);

    await context.close();
  });
});
