import { describe, expect, it } from "vitest";

import {
	resolveMobileExportDelivery,
	type ExportCapabilities,
} from "./export-delivery";

function createCapabilities(
	overrides: Partial<ExportCapabilities> = {},
): ExportCapabilities {
	return {
		canShare: false,
		canShareFiles: false,
		canSaveWithPicker: false,
		canEncodeMp4: false,
		hasTransientUserActivation: false,
		isIOS: false,
		isMobile: false,
		...overrides,
	};
}

describe("resolveMobileExportDelivery", () => {
	it("uses direct downloads on desktop", () => {
		expect(resolveMobileExportDelivery(createCapabilities())).toBe("auto-download");
	});

	it("uses direct share on mobile when file sharing still has activation", () => {
		expect(
			resolveMobileExportDelivery(
				createCapabilities({
					canShare: true,
					canShareFiles: true,
					hasTransientUserActivation: true,
					isMobile: true,
				}),
			),
		).toBe("auto-share");
	});

	it("switches to a second-tap share prompt after activation has expired", () => {
		expect(
			resolveMobileExportDelivery(
				createCapabilities({
					canShare: true,
					canShareFiles: true,
					hasTransientUserActivation: false,
					isMobile: true,
				}),
			),
		).toBe("prompt-share");
	});

	it("prefers the save picker on mobile Chromium when file sharing is unavailable", () => {
		expect(
			resolveMobileExportDelivery(
				createCapabilities({
					canSaveWithPicker: true,
					isMobile: true,
				}),
			),
		).toBe("prompt-save");
	});

	it("falls back to an in-browser preview prompt on mobile browsers without share or save pickers", () => {
		expect(
			resolveMobileExportDelivery(
				createCapabilities({
					isIOS: true,
					isMobile: true,
				}),
			),
		).toBe("prompt-preview");
	});
});
