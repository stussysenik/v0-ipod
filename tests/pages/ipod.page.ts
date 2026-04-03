import type { CDPSession, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { SongSnapshot } from "@/types/ipod-state";
import { seedSnapshot } from "../helpers/ipod-fixtures";
import { ToolboxSection } from "./sections/toolbox.section";
import { ThemePanelSection } from "./sections/theme-panel.section";
import { ViewModeBarSection } from "./sections/view-mode-bar.section";
import { ScreenSection } from "./sections/screen.section";
import { MetadataSection } from "./sections/metadata.section";
import { ProgressSection } from "./sections/progress.section";
import { ClickWheelSection } from "./sections/click-wheel.section";
import { ExportSection } from "./sections/export.section";
import { FixedEditorSection } from "./sections/fixed-editor.section";
import { GifPreviewSection } from "./sections/gif-preview.section";

export class IpodPage {
  readonly toolbox: ToolboxSection;
  readonly themePanel: ThemePanelSection;
  readonly viewModeBar: ViewModeBarSection;
  readonly screen: ScreenSection;
  readonly metadata: MetadataSection;
  readonly progress: ProgressSection;
  readonly clickWheel: ClickWheelSection;
  readonly export: ExportSection;
  readonly fixedEditor: FixedEditorSection;
  readonly gifPreview: GifPreviewSection;

  constructor(readonly page: Page) {
    this.toolbox = new ToolboxSection(page);
    this.themePanel = new ThemePanelSection(page);
    this.viewModeBar = new ViewModeBarSection(page);
    this.screen = new ScreenSection(page);
    this.metadata = new MetadataSection(page);
    this.progress = new ProgressSection(page);
    this.clickWheel = new ClickWheelSection(page);
    this.export = new ExportSection(page);
    this.fixedEditor = new FixedEditorSection(page);
    this.gifPreview = new GifPreviewSection(page);
  }

  /** Navigate to the app root and wait for it to be ready. */
  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.waitForReady();
  }

  /**
   * Seed localStorage with a song snapshot before navigation.
   * Call this BEFORE `goto()` so the init script runs on page load.
   */
  async seedSnapshot(snapshot: SongSnapshot): Promise<void> {
    await seedSnapshot(this.page, snapshot);
  }

  /**
   * Wait for the app to finish loading.
   * The theme button is the reliable indicator that the shell has rendered.
   */
  async waitForReady(): Promise<void> {
    await expect(this.themePanel.button).toBeVisible();
  }

  /** Open a Chrome DevTools Protocol session for advanced instrumentation. */
  async getCDPSession(): Promise<CDPSession> {
    return this.page.context().newCDPSession(this.page);
  }
}
