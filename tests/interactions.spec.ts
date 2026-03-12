import { test, expect } from "@playwright/test";
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

    const resultPromise = waitForGifExportResult(page);
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
