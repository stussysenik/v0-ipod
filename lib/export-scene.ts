export type ExportPresetId = "product" | "square" | "portrait" | "story" | "landscape";

export interface ExportPresetConfig {
	id: ExportPresetId;
	label: string;
	width: number;
	height: number;
	padding: number;
	offsetY: number;
}

export const BASE_EXPORT_SCENE_WIDTH = 466;
export const BASE_EXPORT_SCENE_HEIGHT = 716;
const PRODUCT_WIDTH = 1080;
const PRODUCT_HEIGHT = Math.round(
	PRODUCT_WIDTH * (BASE_EXPORT_SCENE_HEIGHT / BASE_EXPORT_SCENE_WIDTH),
);

const EXPORT_PRESET_CONFIGS: Record<ExportPresetId, ExportPresetConfig> = {
	product: {
		id: "product",
		label: "Product",
		width: PRODUCT_WIDTH,
		height: PRODUCT_HEIGHT,
		padding: 42,
		offsetY: -18,
	},
	square: {
		id: "square",
		label: "Square",
		width: 1080,
		height: 1080,
		padding: 82,
		offsetY: -36,
	},
	portrait: {
		id: "portrait",
		label: "Portrait",
		width: 1080,
		height: 1350,
		padding: 74,
		offsetY: -20,
	},
	story: {
		id: "story",
		label: "Story",
		width: 1080,
		height: 1920,
		padding: 104,
		offsetY: -54,
	},
	landscape: {
		id: "landscape",
		label: "Landscape",
		width: 1920,
		height: 1080,
		padding: 88,
		offsetY: -24,
	},
};

export const EXPORT_PRESET_ORDER: ExportPresetId[] = [
	"product",
	"square",
	"portrait",
	"story",
	"landscape",
];

export function getExportPreset(presetId: ExportPresetId): ExportPresetConfig {
	return EXPORT_PRESET_CONFIGS[presetId];
}

export function getExportPresets(): ExportPresetConfig[] {
	return EXPORT_PRESET_ORDER.map((presetId) => getExportPreset(presetId));
}

export function getExportSceneScale(presetId: ExportPresetId): number {
	const preset = getExportPreset(presetId);
	const availableWidth = Math.max(preset.width - preset.padding * 2, 1);
	const availableHeight = Math.max(preset.height - preset.padding * 2, 1);

	return Math.min(
		availableWidth / BASE_EXPORT_SCENE_WIDTH,
		availableHeight / BASE_EXPORT_SCENE_HEIGHT,
	);
}
