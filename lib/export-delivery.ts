export interface ExportCapabilities {
	canShare: boolean;
	canShareFiles: boolean;
	canSaveWithPicker: boolean;
	canEncodeMp4: boolean;
	hasTransientUserActivation: boolean;
	isIOS: boolean;
	isMobile: boolean;
}

export type MobileExportDelivery =
	| "auto-download"
	| "prompt-preview"
	| "prompt-save"
	| "prompt-share";

export function resolveMobileExportDelivery(
	capabilities: ExportCapabilities,
): MobileExportDelivery {
	if (!capabilities.isMobile) {
		return "auto-download";
	}

	if (capabilities.canShareFiles) {
		return "prompt-share";
	}

	if (capabilities.canSaveWithPicker) {
		return "prompt-save";
	}

	return "prompt-preview";
}

export interface DeliveryPlan {
	delivery: MobileExportDelivery;
	/**
	 * Whether the finished blob is handed to the browser via a synthetic `<a download>`
	 * click. That path silently no-ops on iOS Safari, so it is reserved for `auto-download`
	 * (desktop) only — every mobile strategy routes through an in-page share/save/preview
	 * prompt instead. This flag is the single fact the 3D export path was missing: it used
	 * a synthetic download unconditionally, so exports never reached a phone.
	 */
	usesSyntheticDownload: boolean;
}

/** Pure routing: capabilities → which concrete delivery mechanism the blob takes. */
export function planExportDelivery(capabilities: ExportCapabilities): DeliveryPlan {
	const delivery = resolveMobileExportDelivery(capabilities);
	return { delivery, usesSyntheticDownload: delivery === "auto-download" };
}
