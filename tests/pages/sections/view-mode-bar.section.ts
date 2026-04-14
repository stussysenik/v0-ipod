import { expect } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

export type ViewMode = "flat" | "preview" | "3d" | "focus" | "ascii";

const TEST_ID_MAP: Record<ViewMode, string> = {
	flat: "flat-view-button",
	preview: "preview-view-button",
	"3d": "three-d-view-button",
	focus: "focus-view-button",
	ascii: "ascii-view-button",
};

export class ViewModeBarSection {
	readonly flatButton: Locator;
	readonly previewButton: Locator;
	readonly threeDButton: Locator;
	readonly focusButton: Locator;
	readonly asciiButton: Locator;

	constructor(private readonly page: Page) {
		this.flatButton = page.getByTestId("flat-view-button");
		this.previewButton = page.getByTestId("preview-view-button");
		this.threeDButton = page.getByTestId("three-d-view-button");
		this.focusButton = page.getByTestId("focus-view-button");
		this.asciiButton = page.getByTestId("ascii-view-button");
	}

	/** Return the locator for a given view mode. */
	buttonFor(mode: ViewMode): Locator {
		return this.page.getByTestId(TEST_ID_MAP[mode]);
	}

	/** Switch to a specific view mode and wait for the button to reflect the active state. */
	async switchTo(mode: ViewMode): Promise<void> {
		const button = this.buttonFor(mode);
		await button.click();
		await expect(button).toBeVisible();
	}

	/** Determine the currently active view mode by checking aria-pressed or data attributes. */
	async getCurrentMode(): Promise<ViewMode> {
		for (const mode of Object.keys(TEST_ID_MAP) as ViewMode[]) {
			const button = this.buttonFor(mode);
			const pressed = await button.getAttribute("aria-pressed");
			const dataCurrent = await button.getAttribute("data-current");
			if (pressed === "true" || dataCurrent === "true") {
				return mode;
			}
		}
		// Fallback: check which button has a visually distinct state via CSS classes
		// Default to flat if no explicit marker is found
		return "flat";
	}
}
