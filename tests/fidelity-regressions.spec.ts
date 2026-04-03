import { test, expect } from "@playwright/test";
import { LONG_METADATA_SNAPSHOT, seedSnapshot } from "./helpers/ipod-fixtures";

test.describe("Fidelity regressions", () => {
  test("flat mode keeps long title on a single bounded lane", async ({ page }) => {
    await seedSnapshot(page, LONG_METADATA_SNAPSHOT);
    await page.goto("/");

    const titleMetrics = await page.getByTestId("track-title-text").evaluate((el) => {
      const style = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(style.lineHeight) || 16;
      return {
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        lineHeight,
      };
    });

    expect(titleMetrics.scrollHeight).toBeLessThanOrEqual(titleMetrics.lineHeight * 1.35);
  });

  test("preview mode activates marquee for overflowing titles", async ({ page }) => {
    await seedSnapshot(page, {
      ...LONG_METADATA_SNAPSHOT,
      ui: {
        ...LONG_METADATA_SNAPSHOT.ui,
        viewMode: "preview",
      },
    });

    await page.goto("/");
    await expect(page.getByTestId("gif-export-button")).toBeVisible();

    await expect
      .poll(
        async () =>
          page.getByTestId("track-title-text").evaluate((el) => ({
            active: el.getAttribute("data-marquee-active"),
            overflow: el.getAttribute("data-marquee-overflow"),
            hasTrack: !!el.querySelector('[data-marquee-track="true"]'),
          })),
        { timeout: 3000 },
      )
      .toEqual({
        active: "true",
        overflow: "true",
        hasTrack: true,
      });
  });

  test("experimental modes are labeled and do not expose production gif export", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("three-d-view-button")).toContainText(/WIP|Experimental/i);
    await expect(page.getByTestId("focus-view-button")).toContainText(/WIP|Experimental/i);
    await expect(page.getByTestId("ascii-view-button")).toContainText(/WIP|Experimental/i);

    await page.getByTestId("ascii-view-button").click();
    await expect(page.getByTestId("gif-export-button")).toBeHidden();
  });
});
