import { test, expect } from "@playwright/test";
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
    await expect(
      page.getByRole("button", { name: "Export 3D Render" }),
    ).toBeVisible();

    await page.getByTestId("flat-view-button").click();
    await expect(
      page.getByRole("button", { name: "Export 2D Image" }),
    ).toBeVisible();
  });

  test("image upload updates artwork preview", async ({ page }) => {
    const fileInput = page.getByTestId("artwork-input");
    await fileInput.setInputFiles(fixtureImage);

    const artwork = page.getByTestId("artwork-image");
    await expect(artwork).toHaveAttribute("src", /data:image\//, {
      timeout: 15000,
    });
  });

  test("custom color picker flow saves case colors to localStorage", async ({
    page,
  }) => {
    const caseColorInput = page.getByTestId("case-color-input");
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
        page.evaluate(
          () => localStorage.getItem("ipodSnapshotCaseCustomColors") || "",
        ),
      )
      .toContain("#123ABC");
  });

  test("remaining-first timing keeps progress proportionate", async ({
    page,
  }) => {
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
    const elapsedInput = page
      .getByTestId("elapsed-time")
      .locator('input[type="text"]');
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

  test("export does not leave controls blocked", async ({ page }) => {
    await page.getByTestId("export-button").click();

    await expect(page.getByTestId("theme-button")).toBeVisible({
      timeout: 15000,
    });
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();
  });
});
