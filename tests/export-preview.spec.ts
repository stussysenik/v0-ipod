import { test, expect } from "@playwright/test";

async function runtimeValue<T>(client: {
  send: (...args: any[]) => Promise<{ result: { value?: T } }>;
}) {
  return async (expression: string): Promise<T | null> => {
    const response = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    return (response.result.value as T | undefined) ?? null;
  };
}

test.describe("GIF preview timing", () => {
  test("transport controls paint within 16ms after interaction", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("export-format-gif").click();
    await page.getByTestId("preview-record-button").click();
    await expect(page.getByTestId("gif-preview-stage")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("gif-preview-image")).toBeVisible({ timeout: 60000 });

    const client = await page.context().newCDPSession(page);
    const readValue = await runtimeValue<number>(client);

    await client.send("Runtime.evaluate", {
      expression: "window.__ipodGifPreviewPerf?.reset?.()",
      returnByValue: true,
    });

    await page.getByTestId("gif-preview-play-toggle").click();

    await expect
      .poll(async () => readValue("window.__ipodGifPreviewPerf?.getLastDelta?.() ?? null"), {
        timeout: 3000,
      })
      .not.toBeNull();

    const playDelta = await readValue("window.__ipodGifPreviewPerf?.getLastDelta?.() ?? null");
    expect(playDelta).not.toBeNull();
    expect(playDelta ?? 999).toBeLessThanOrEqual(16);

    await client.send("Runtime.evaluate", {
      expression: "window.__ipodGifPreviewPerf?.reset?.()",
      returnByValue: true,
    });

    await page.getByTestId("gif-preview-scrubber").fill("3");

    await expect
      .poll(async () => readValue("window.__ipodGifPreviewPerf?.getLastDelta?.() ?? null"), {
        timeout: 3000,
      })
      .not.toBeNull();

    const scrubDelta = await readValue("window.__ipodGifPreviewPerf?.getLastDelta?.() ?? null");
    expect(scrubDelta).not.toBeNull();
    expect(scrubDelta ?? 999).toBeLessThanOrEqual(16);
  });
});
