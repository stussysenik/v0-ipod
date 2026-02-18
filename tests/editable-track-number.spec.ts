import { test, expect } from "@playwright/test";

test.describe("EditableTrackNumber Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("track-number-container")).toBeVisible();
  });

  test("displays initial track number format", async ({ page }) => {
    await expect(page.getByTestId("track-number-container")).toContainText("2");
    await expect(page.getByTestId("track-number-container")).toContainText(
      "of",
    );
    await expect(page.getByTestId("track-number-container")).toContainText(
      "10",
    );
  });

  test("track number becomes editable on click", async ({ page }) => {
    await page.getByTestId("track-number-value").click();

    const input = page.getByTestId("track-number-input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("2");
  });

  test("saves new track number on Enter", async ({ page }) => {
    await page.getByTestId("track-number-value").click();

    const input = page.getByTestId("track-number-input");
    await input.fill("5");
    await input.press("Enter");

    await expect(page.getByTestId("track-number-value")).toHaveText("5");
  });

  test("reverts on Escape", async ({ page }) => {
    await page.getByTestId("track-number-value").click();

    const input = page.getByTestId("track-number-input");
    await input.fill("9");
    await input.press("Escape");

    await expect(page.getByTestId("track-number-value")).toHaveText("2");
  });

  test("validates track number cannot exceed total", async ({ page }) => {
    await page.getByTestId("track-number-value").click();

    const input = page.getByTestId("track-number-input");
    await input.fill("15");
    await input.press("Enter");

    await expect(page.getByTestId("track-number-value")).toHaveText("2");
  });

  test("total tracks is also editable", async ({ page }) => {
    await page.getByTestId("total-tracks-value").click();

    const input = page.getByTestId("total-tracks-input");
    await expect(input).toBeFocused();
    await input.fill("20");
    await input.press("Enter");

    await expect(page.getByTestId("total-tracks-value")).toHaveText("20");
  });

  test("saves on blur", async ({ page }) => {
    await page.getByTestId("track-number-value").click();

    const input = page.getByTestId("track-number-input");
    await expect(input).toBeVisible();
    await input.fill("3");

    await page.getByText("Now Playing").click();

    await expect(page.getByTestId("track-number-value")).toHaveText("3");
  });
});
