import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class FixedEditorSection {
  readonly overlay: Locator;
  readonly input: Locator;
  readonly doneButton: Locator;

  constructor(private readonly page: Page) {
    this.overlay = page.getByTestId("fixed-editor");
    this.input = page.getByTestId("fixed-editor-input");
    this.doneButton = page.getByTestId("fixed-editor-done");
  }

  /** Check whether the fixed editor overlay is currently visible. */
  async isOpen(): Promise<boolean> {
    return this.overlay.isVisible();
  }

  /** Fill the input with a value and tap the Done button to commit. */
  async fillAndCommit(value: string): Promise<void> {
    await expect(this.input).toBeVisible();
    await this.input.fill(value);
    await this.doneButton.tap();
  }

  /** Dismiss the fixed editor by tapping outside (on the overlay). */
  async dismiss(): Promise<void> {
    await this.overlay.tap({ position: { x: 5, y: 5 } });
    await expect(this.overlay).toBeHidden();
  }
}
