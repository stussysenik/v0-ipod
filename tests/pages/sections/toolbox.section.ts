import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class ToolboxSection {
  readonly toggleButton: Locator;
  readonly panel: Locator;

  constructor(private readonly page: Page) {
    this.toggleButton = page.getByTestId("toolbox-toggle-button");
    this.panel = page.getByTestId("toolbox-panel");
  }

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await this.toggleButton.click();
    await expect(this.panel).toBeVisible();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await this.toggleButton.click();
    await expect(this.panel).toBeHidden();
  }

  async isOpen(): Promise<boolean> {
    return this.panel.isVisible();
  }
}
