import { test, expect } from "@playwright/test";
import path from "path";
import { MARQUEE_DELAY_MS } from "@/lib/marquee";

const fixtureImage = path.resolve(process.cwd(), "public/test.jpg");
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.use({
  viewport: MOBILE_VIEWPORT,
  isMobile: true,
  hasTouch: true,
});

test.describe("Mobile usability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("toolbox-toggle-button")).toBeVisible();
    await expect(page.getByTestId("toolbox-panel")).toBeHidden();
  });

  test("tap interactions stay usable on mobile", async ({ page }) => {
    await page.getByTestId("toolbox-toggle-button").tap();
    const toolboxPanel = page.getByTestId("toolbox-panel");
    await expect(toolboxPanel).toBeVisible();

    const toolboxBox = await toolboxPanel.boundingBox();
    expect(toolboxBox).not.toBeNull();
    if (!toolboxBox) throw new Error("toolbox panel not found");
    expect(toolboxBox.x).toBeGreaterThanOrEqual(0);
    expect(toolboxBox.y).toBeGreaterThanOrEqual(0);
    expect(toolboxBox.x + toolboxBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    expect(toolboxBox.y + toolboxBox.height).toBeLessThanOrEqual(MOBILE_VIEWPORT.height);

    await page.getByTestId("theme-button").tap();
    const themePanel = page.getByTestId("theme-panel");
    await expect(themePanel).toBeVisible();
    await expect(page.getByTestId("export-button")).toBeHidden();

    const themeBox = await themePanel.boundingBox();
    expect(themeBox).not.toBeNull();
    if (!themeBox) throw new Error("theme panel not found");
    expect(themeBox.x).toBeGreaterThanOrEqual(0);
    expect(themeBox.y).toBeGreaterThanOrEqual(0);
    expect(themeBox.x + themeBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    expect(themeBox.y + themeBox.height).toBeLessThanOrEqual(MOBILE_VIEWPORT.height);

    await page.touchscreen.tap(24, 120);
    await expect(themePanel).toBeHidden();
    await expect(toolboxPanel).toBeHidden();

    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(toolboxPanel).toBeVisible();
    await page.getByTestId("three-d-view-button").tap();
    await expect(themePanel).toBeHidden();
    await expect(toolboxPanel).toBeHidden();
    await page.getByTestId("toolbox-toggle-button").click();
    await expect
      .poll(async () =>
        page
          .getByTestId("toolbox-panel")
          .evaluate((el) => !el.className.includes("invisible")),
      )
      .toBe(true);
    await expect(page.getByTestId("export-button")).toContainText("Flat View Only");
    await page.getByTestId("flat-view-button").tap();
    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByRole("button", { name: "Export 2D Image" })).toBeVisible();
    await expect
      .poll(async () =>
        page
          .getByTestId("toolbox-panel")
          .evaluate((el) => !el.className.includes("invisible")),
      )
      .toBe(true);
    await page.getByTestId("preview-view-button").tap();
    await expect(page.getByTestId("gif-export-button")).toContainText(
      "Export Animated GIF",
    );
  });

  test("mobile upload opens immediate file path and updates artwork", async ({
    page,
  }) => {
    await page.getByTestId("artwork-input").setInputFiles(fixtureImage);
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /data:image\//,
      {
        timeout: 15000,
      },
    );
  });

  test("single tap edit and touch seek work", async ({ page }) => {
    await page.getByText("Charcoal Baby").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill("Mobile Edit");
    await page.getByTestId("fixed-editor-done").tap();
    await expect(page.getByText("Mobile Edit")).toBeVisible();

    const track = page.getByTestId("progress-track");
    const box = await track.boundingBox();
    if (!box) throw new Error("progress track not found");

    await track.tap({
      position: {
        x: box.width * 0.7,
        y: box.height / 2,
      },
    });
    await expect(page.getByTestId("elapsed-time")).not.toContainText("0:00");
  });

  test("mobile load snapshot applies persisted artwork data", async ({ page }) => {
    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await page.getByTestId("theme-button").tap();
    await page.getByTestId("load-song-snapshot-button").tap();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );

    await page.reload();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /placeholder-logo\.png/,
    );
  });

  test("long title wrapping and theme controls stay reachable on mobile", async ({
    page,
  }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await page.getByText("Charcoal Baby").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill(longTitle);
    await page.getByTestId("fixed-editor-done").tap();

    const titleLayout = await page.getByTestId("track-title-text").evaluate((el) => {
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

    expect(titleLayout.scrollWidth).toBeLessThanOrEqual(titleLayout.clientWidth + 1);
    expect(titleLayout.scrollHeight).toBeLessThanOrEqual(titleLayout.lineHeight * 1.35);
    expect(titleLayout.marqueeActive).toBeNull();

    await page.getByTestId("toolbox-toggle-button").tap();
    await page.getByTestId("theme-button").tap();

    const themePanel = page.getByTestId("theme-panel");
    await expect(themePanel).toBeVisible();
    await page.getByTestId("save-song-snapshot-button").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("save-song-snapshot-button")).toBeVisible();

    const panelBox = await themePanel.boundingBox();
    expect(panelBox).not.toBeNull();
    if (!panelBox) throw new Error("theme panel not found");
    expect(panelBox.x).toBeGreaterThanOrEqual(0);
    expect(panelBox.y).toBeGreaterThanOrEqual(0);
    expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(MOBILE_VIEWPORT.height);
  });

  test("mobile preview marquee animates and preview export remains accessible", async ({
    page,
  }) => {
    const longTitle = "The Field (feat. The Durutti Column and Caroline Polachek)";

    await page.getByText("Charcoal Baby").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill(longTitle);
    await page.getByTestId("fixed-editor-done").tap();

    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
    await page.getByRole("button", { name: "Preview" }).tap();

    await expect
      .poll(
        async () =>
          page.getByTestId("track-title-text").evaluate((el) => ({
            active: el.getAttribute("data-marquee-active"),
            overflow: el.getAttribute("data-marquee-overflow"),
          })),
        { timeout: 3000 },
      )
      .toEqual({
        active: "true",
        overflow: "true",
      });

    const initialTransform = await page.getByTestId("track-title-text").evaluate((el) => {
      const track = el.querySelector('[data-marquee-track="true"]');
      return track ? getComputedStyle(track).transform : null;
    });

    await expect
      .poll(
        async () =>
          page.getByTestId("track-title-text").evaluate((el) => {
            const track = el.querySelector('[data-marquee-track="true"]');
            return track ? getComputedStyle(track).transform : null;
          }),
        { timeout: MARQUEE_DELAY_MS + 4000 },
      )
      .not.toBe(initialTransform);

    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(
      page.getByRole("button", { name: /Export Animated GIF/i }),
    ).toBeVisible();
  });
});
