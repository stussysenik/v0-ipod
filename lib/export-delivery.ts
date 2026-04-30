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
	| "auto-share"
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
		return capabilities.hasTransientUserActivation ? "auto-share" : "prompt-share";
	}

	if (capabilities.canSaveWithPicker) {
		return "prompt-save";
	}

	return "prompt-preview";
}
