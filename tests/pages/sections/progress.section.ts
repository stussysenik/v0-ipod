import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class ProgressSection {
  readonly root: Locator;
  readonly track: Locator;
  readonly fill: Locator;
  readonly elapsedTime: Locator;
  readonly remainingTime: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("screen-progress");
    this.track = page.getByTestId("progress-track");
    this.fill = page.getByTestId("progress-fill");
    this.elapsedTime = page.getByTestId("elapsed-time");
    this.remainingTime = page.getByTestId("remaining-time");
  }

  /**
   * Seek to a fractional position (0..1) along the progress track
   * by computing the absolute pixel position and clicking there.
   */
  async seekToFraction(fraction: number): Promise<void> {
    const box = await this.track.boundingBox();
    if (!box) throw new Error("Progress track bounding box not found");

    const clampedFraction = Math.max(0, Math.min(1, fraction));
    await this.track.click({
      position: {
        x: box.width * clampedFraction,
        y: box.height / 2,
      },
    });
  }

  /** Double-click the elapsed time text, type a new value, and confirm. */
  async editElapsedTime(timeString: string): Promise<void> {
    const span = this.elapsedTime.locator("span");
    await span.dblclick();
    const input = this.elapsedTime.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await input.fill(timeString);
    await input.press("Enter");
  }

  /** Double-click the remaining time text, type a new value, and confirm. */
  async editRemainingTime(timeString: string): Promise<void> {
    const span = this.remainingTime.locator("span");
    await span.dblclick();
    const input = this.remainingTime.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await input.fill(timeString);
    await input.press("Enter");
  }

  async getElapsedText(): Promise<string> {
    return (await this.elapsedTime.textContent()) ?? "";
  }

  async getRemainingText(): Promise<string> {
    return (await this.remainingTime.textContent()) ?? "";
  }
}
