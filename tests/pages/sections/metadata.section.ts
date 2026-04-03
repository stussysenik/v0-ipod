import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { FixedEditorSection } from "./fixed-editor.section";

export interface TitleLayoutMetrics {
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  lineHeight: number;
  marqueeActive: string | null;
}

export class MetadataSection {
  readonly trackMeta: Locator;
  readonly titleText: Locator;
  readonly artistText: Locator;
  readonly albumText: Locator;
  readonly trackNumberContainer: Locator;
  readonly trackNumberValue: Locator;
  readonly trackNumberInput: Locator;
  readonly totalTracksValue: Locator;
  readonly totalTracksInput: Locator;
  readonly artworkImage: Locator;
  readonly artworkInput: Locator;

  constructor(private readonly page: Page) {
    this.trackMeta = page.getByTestId("track-meta");
    this.titleText = page.getByTestId("track-title-text");
    this.artistText = page.getByTestId("track-artist-text");
    this.albumText = page.getByTestId("track-album-text");
    this.trackNumberContainer = page.getByTestId("track-number-container");
    this.trackNumberValue = page.getByTestId("track-number-value");
    this.trackNumberInput = page.getByTestId("track-number-input");
    this.totalTracksValue = page.getByTestId("total-tracks-value");
    this.totalTracksInput = page.getByTestId("total-tracks-input");
    this.artworkImage = page.getByTestId("artwork-image");
    this.artworkInput = page.getByTestId("artwork-input");
  }

  // ---------------------------------------------------------------------------
  // Desktop inline editing (double-click -> type -> Enter)
  // ---------------------------------------------------------------------------

  /** Edit the track title using desktop double-click inline editing. */
  async editTitle(newValue: string): Promise<void> {
    await this.titleText.dblclick();
    const input = this.page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill(newValue);
    await input.press("Enter");
    await expect(this.titleText).toBeVisible();
  }

  /** Edit the artist name using desktop double-click inline editing. */
  async editArtist(newValue: string): Promise<void> {
    await this.artistText.dblclick();
    const input = this.page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill(newValue);
    await input.press("Enter");
    await expect(this.artistText).toBeVisible();
  }

  /** Edit the album name using desktop double-click inline editing. */
  async editAlbum(newValue: string): Promise<void> {
    await this.albumText.dblclick();
    const input = this.page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill(newValue);
    await input.press("Enter");
    await expect(this.albumText).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Mobile editing (tap -> fixed editor overlay)
  // ---------------------------------------------------------------------------

  /** Edit the track title on mobile using the fixed editor overlay. */
  async editTitleMobile(
    newValue: string,
    fixedEditor: FixedEditorSection,
  ): Promise<void> {
    await this.titleText.tap();
    await fixedEditor.fillAndCommit(newValue);
  }

  // ---------------------------------------------------------------------------
  // Track number editing
  // ---------------------------------------------------------------------------

  /** Edit the track number value. */
  async editTrackNumber(value: string): Promise<void> {
    await this.trackNumberValue.click();
    await expect(this.trackNumberInput).toBeVisible();
    await this.trackNumberInput.fill(value);
    await this.trackNumberInput.press("Enter");
  }

  /** Edit the total tracks value. */
  async editTotalTracks(value: string): Promise<void> {
    await this.totalTracksValue.click();
    await expect(this.totalTracksInput).toBeVisible();
    await this.totalTracksInput.fill(value);
    await this.totalTracksInput.press("Enter");
  }

  // ---------------------------------------------------------------------------
  // Artwork
  // ---------------------------------------------------------------------------

  /** Upload artwork from a local file path. */
  async uploadArtwork(filePath: string): Promise<void> {
    await this.artworkInput.setInputFiles(filePath);
    await expect(this.artworkImage).toHaveAttribute("src", /data:image\//, {
      timeout: 15_000,
    });
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  async getTitle(): Promise<string> {
    return (await this.titleText.textContent()) ?? "";
  }

  async getArtist(): Promise<string> {
    return (await this.artistText.textContent()) ?? "";
  }

  async getAlbum(): Promise<string> {
    return (await this.albumText.textContent()) ?? "";
  }

  // ---------------------------------------------------------------------------
  // Layout inspection (for fidelity/overflow tests)
  // ---------------------------------------------------------------------------

  /** Evaluate scroll/client dimensions and marquee attributes on the title element. */
  async getTitleLayoutMetrics(): Promise<TitleLayoutMetrics> {
    return this.titleText.evaluate((el) => {
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
  }

  /** Check whether the marquee animation is active on the title. */
  async isTitleMarqueeActive(): Promise<boolean> {
    const attr = await this.titleText.getAttribute("data-marquee-active");
    return attr === "true";
  }
}
