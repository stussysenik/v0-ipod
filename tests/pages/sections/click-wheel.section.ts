import type { Locator, Page } from "@playwright/test";

export class ClickWheelSection {
	readonly wheel: Locator;
	readonly center: Locator;

	constructor(private readonly page: Page) {
		this.wheel = page.getByTestId("click-wheel");
		this.center = page.getByTestId("click-wheel-center");
	}

	/** Click the center button of the click wheel. */
	async clickCenter(): Promise<void> {
		await this.center.click();
	}
}
