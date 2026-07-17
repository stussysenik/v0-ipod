import { describe, expect, it } from "vitest";

import {
	planExportDelivery,
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

	it("shows share prompt on mobile (re-acquires user activation)", () => {
		expect(
			resolveMobileExportDelivery(
				createCapabilities({
					canShare: true,
					canShareFiles: true,
					hasTransientUserActivation: true,
					isMobile: true,
				}),
			),
		).toBe("prompt-share");
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

describe("planExportDelivery — the synthetic-download boundary that stranded phone exports", () => {
	it("uses a synthetic download on desktop", () => {
		expect(planExportDelivery(createCapabilities()).usesSyntheticDownload).toBe(true);
	});

	// The 3D export path used a synthetic `<a download>` unconditionally — which silently
	// no-ops on iOS Safari, so exports never reached the phone. Every mobile shape MUST
	// route through an in-page prompt instead. This is the guard for that class of bug.
	it("never hands a synthetic download to a mobile device (any share/save/preview capability shape)", () => {
		const mobileShapes: Array<Partial<ExportCapabilities>> = [
			{ isIOS: true, isMobile: true, canShareFiles: true }, // iOS with share sheet
			{ isIOS: true, isMobile: true }, // iOS Safari, no share/save → preview
			{ isMobile: true, canSaveWithPicker: true }, // mobile Chromium save picker
			{ isMobile: true }, // bare mobile browser
		];
		for (const shape of mobileShapes) {
			const plan = planExportDelivery(createCapabilities(shape));
			expect(plan.usesSyntheticDownload).toBe(false);
			expect(plan.delivery).not.toBe("auto-download");
		}
	});
});
