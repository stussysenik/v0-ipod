import type { Download, Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class ExportSection {
  readonly pngButton: Locator;
  readonly gifButton: Locator;

  constructor(private readonly page: Page) {
    this.pngButton = page.getByTestId("export-button");
    this.gifButton = page.getByTestId("gif-export-button");
  }

  /** Click the PNG export button and return the resulting Download. */
  async exportPng(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.pngButton.click();
    return downloadPromise;
  }

  /**
   * Click the GIF export button and return the resulting Download.
   * GIF generation can take a while, so a generous timeout is used.
   */
  async exportGif(timeout = 60_000): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download", { timeout });
    await this.gifButton.click();
    return downloadPromise;
  }

  /** Wait for both export buttons to return to an enabled/idle state. */
  async waitForExportIdle(timeout = 15_000): Promise<void> {
    await expect(this.pngButton).toBeEnabled({ timeout });
  }

  /** Assert that a download's suggested filename matches the given pattern. */
  assertFilenamePattern(download: Download, pattern: RegExp): void {
    expect(download.suggestedFilename()).toMatch(pattern);
  }
}
