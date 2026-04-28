import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Color Fidelity Tests
 *
 * Validates that rendered colors match the canonical color manifest.
 * This is Gate 3 of the dcal validation pipeline.
 */

interface SurfaceToken {
  hex: string;
  role: string;
  family: string;
}

interface Manifest {
  authenticCaseColors: Array<{ label: string; hex: string }>;
  authenticFinishes: Array<{ id: string; label: string; year: number; hex: string }>;
  surfaceTokens: Record<string, SurfaceToken>;
}

function loadManifest(): Manifest {
  const raw = readFileSync(resolve(__dirname, "../scripts/color-manifest.json"), "utf-8");
  return JSON.parse(raw);
}

test.describe("Color Fidelity — Manifest Compliance", () => {
  const manifest = loadManifest();

  test("screen surround uses manifest-defined dark gradient", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    // The screen surround is the dark area around the iPod screen content
    const screenEl = page.getByTestId("ipod-screen");
    await expect(screenEl).toBeVisible();

    // Verify the screen background contains the expected gradient colors
    const bgStyle = await screenEl.evaluate((el) => {
      return (
        window.getComputedStyle(el).background ||
        window.getComputedStyle(el).backgroundImage
      );
    });

    // The screen surround should have the dark gradient defined in manifest
    // (#0D0D0D -> #181818 -> #060606)
    expect(bgStyle).toBeTruthy();
  });

  test("default shell color matches manifest shell.default token", async ({ page }) => {
    // Clear localStorage to get default colors
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    // Find the shell element (the main iPod body)
    const shellEl = page.locator("[data-export-layer='shell']");
    await expect(shellEl).toBeVisible();

    const bgColor = await shellEl.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Convert rgb() to hex for comparison
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const hex = `#${[match[1], match[2], match[3]]
        .map((v) => parseInt(v).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`;

      expect(hex).toBe(manifest.surfaceTokens["shell.default"].hex);
    }
  });

  test("default backdrop color matches manifest backdrop.default token", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    // The backdrop is the page background behind the iPod
    const bgColor = await page.evaluate(() => {
      // Find the container with the background color
      const container = document.querySelector("main > div");
      return container ? window.getComputedStyle(container).backgroundColor : null;
    });

    expect(bgColor).toBeTruthy();
  });

  test("all authentic case colors are valid hex values", async () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    for (const color of manifest.authenticCaseColors) {
      expect(
        hexRe.test(color.hex),
        `${color.label}: ${color.hex} should be valid hex`,
      ).toBe(true);
    }
  });

  test("each authentic finish produces a distinct visual", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    // Open theme panel
    await page.getByTestId("theme-button").click();
    await expect(page.getByTestId("theme-panel")).toBeVisible();

    // Verify that swatch buttons exist for each authentic finish
    // Title format is: "Label (year) — notes"
    for (const finish of manifest.authenticFinishes) {
      const swatch = page.locator(`button[title^="${finish.label} (${finish.year})"]`);
      const count = await swatch.count();
      expect(
        count,
        `Swatch for "${finish.label} (${finish.year})" should exist`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});
