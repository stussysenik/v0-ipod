import { expect } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

export class ScreenSection {
	readonly root: Locator;
	readonly content: Locator;
	readonly asciiScreen: Locator;
	readonly asciiPre: Locator;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId("ipod-screen");
		this.content = page.getByTestId("screen-content");
		this.asciiScreen = page.getByTestId("ascii-screen");
		this.asciiPre = page.getByTestId("ascii-pre");
	}

	/** Wait until the main screen container is visible. */
	async waitForVisible(): Promise<void> {
		await expect(this.root).toBeVisible();
	}

	/** Check whether the screen is currently in ASCII mode. */
	async isAsciiMode(): Promise<boolean> {
		return this.asciiScreen.isVisible();
	}
}
