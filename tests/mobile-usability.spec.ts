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
    await expect(page.getByTestId("toolbox-toggle-button")).toBeVisible();
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
    await page.getByTestId("theme-button").tap();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    await page.getByTestId("three-d-view-button").tap();
    await expect(page.getByTestId("theme-panel")).toBeHidden();
    await expect(page.getByTestId("toolbox-panel")).toBeHidden();
    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByRole("button", { name: "Flat View Only" })).toBeVisible();

    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await page.getByTestId("flat-view-button").tap();
    await expect(page.getByRole("button", { name: "Export 2D Image" })).toBeVisible();
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
    await page.getByText("Have A Destination?").tap();
    const input = page.getByTestId("fixed-editor-input");
    await expect(input).toBeVisible();
    await input.fill("Mobile Edit");
    await page.getByTestId("fixed-editor-done").tap();
    await expect(page.getByText("Mobile Edit")).toBeVisible();

    const track = page.getByTestId("progress-track");
    const box = await track.boundingBox();
    if (!box) throw new Error("progress track not found");

    await page.touchscreen.tap(box.x + box.width * 0.7, box.y + box.height / 2);
    await expect(page.getByTestId("elapsed-time")).not.toContainText("0:00");
  });

  test("mobile load snapshot applies persisted artwork data", async ({ page }) => {
    await page.getByTestId("toolbox-toggle-button").tap();
    await expect(page.getByTestId("toolbox-panel")).toBeVisible();
    await page.getByTestId("theme-button").tap();
    await page.getByTestId("load-song-snapshot-button").tap();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /mac-miller-test\.jpg/,
    );

    await page.reload();
    await expect(page.getByTestId("artwork-image")).toHaveAttribute(
      "src",
      /mac-miller-test\.jpg/,
    );
  });
});
