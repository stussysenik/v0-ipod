import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class GifPreviewSection {
  readonly stage: Locator;
  readonly image: Locator;
  readonly playToggle: Locator;
  readonly restartButton: Locator;
  readonly loopToggle: Locator;
  readonly recordWindow: Locator;
  readonly frameReadout: Locator;
  readonly scrubber: Locator;
  readonly retryButton: Locator;

  constructor(private readonly page: Page) {
    this.stage = page.getByTestId("gif-preview-stage");
    this.image = page.getByTestId("gif-preview-image");
    this.playToggle = page.getByTestId("gif-preview-play-toggle");
    this.restartButton = page.getByTestId("gif-preview-restart");
    this.loopToggle = page.getByTestId("gif-preview-loop-toggle");
    this.recordWindow = page.getByTestId("gif-preview-record-window");
    this.frameReadout = page.getByTestId("gif-preview-frame-readout");
    this.scrubber = page.getByTestId("gif-preview-scrubber");
    this.retryButton = page.getByTestId("gif-preview-retry");
  }

  /** Wait for the preview stage and image to become visible. */
  async waitForFramesLoaded(timeout = 60_000): Promise<void> {
    await expect(this.stage).toBeVisible({ timeout });
    await expect(this.image).toBeVisible({ timeout });
  }

  /** Toggle play/pause. */
  async togglePlayPause(): Promise<void> {
    await this.playToggle.click();
  }

  /** Restart the preview from the beginning. */
  async restart(): Promise<void> {
    await this.restartButton.click();
  }

  /** Scrub to a specific frame index by setting the scrubber input value. */
  async scrubToFrame(frameIndex: number): Promise<void> {
    await this.scrubber.fill(String(frameIndex));
  }

  /** Read the current frame readout text (e.g. "3 / 24"). */
  async getFrameReadout(): Promise<string> {
    return (await this.frameReadout.textContent()) ?? "";
  }
}
