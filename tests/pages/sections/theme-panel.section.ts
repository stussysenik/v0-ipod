import { expect } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

export class ThemePanelSection {
	readonly button: Locator;
	readonly panel: Locator;
	readonly loadSnapshotButton: Locator;
	readonly saveSnapshotButton: Locator;
	readonly customCaseColorButton: Locator;

	constructor(private readonly page: Page) {
		this.button = page.getByTestId("theme-button");
		this.panel = page.getByTestId("theme-panel");
		this.loadSnapshotButton = page.getByTestId("load-song-snapshot-button");
		this.saveSnapshotButton = page.getByTestId("save-song-snapshot-button");
		this.customCaseColorButton = page.getByTestId("custom-case-color-button");
	}

	async open(): Promise<void> {
		if (await this.isOpen()) return;
		await this.button.click();
		await expect(this.panel).toBeVisible();
	}

	async close(): Promise<void> {
		if (!(await this.isOpen())) return;
		await this.page.keyboard.press("Escape");
		await expect(this.panel).toBeHidden();
	}

	async isOpen(): Promise<boolean> {
		return this.panel.isVisible();
	}

	async loadSnapshot(): Promise<void> {
		await this.open();
		await this.loadSnapshotButton.click();
	}

	async saveSnapshot(): Promise<void> {
		await this.open();
		await this.saveSnapshotButton.click();
	}

	/** Click a preset color swatch identified by its label text. */
	async selectCaseColor(label: string): Promise<void> {
		await this.open();
		await this.panel.locator(`button[title="${label}"]`).click();
	}

	/** Set a custom hex color via the native color input. */
	async setCustomCaseColor(hex: string): Promise<void> {
		await this.open();
		await this.customCaseColorButton.evaluate((el, color) => {
			const input = el as HTMLInputElement;
			const setter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			setter?.call(input, color);
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}, hex);
	}
}
