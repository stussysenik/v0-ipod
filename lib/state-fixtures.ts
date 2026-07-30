import type { IpodWorkbenchModel } from "@/lib/ipod-state/model";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { IPOD_CLASSIC_PRESETS, getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { DESIGNER_DARK_RIG, cloneLightingConfig } from "@/lib/studio-lighting-config";
import type { IpodHardwarePresetId } from "@/types/ipod-state";
import { NOIR_THEME, rigForTheme } from "@/lib/studio-themes";

export interface StateFixture {
	id: string;
	label: string;
	build: () => IpodWorkbenchModel;
}

function baseModel(presetId: IpodHardwarePresetId): IpodWorkbenchModel {
	const model = createInitialIpodWorkbenchModel();
	const preset = getIpodClassicPreset(presetId);
	model.presentation.hardwarePreset = presetId;
	if (preset.defaultShellColor) model.presentation.skinColor = preset.defaultShellColor;
	if (preset.defaultBackdropColor) model.presentation.bgColor = preset.defaultBackdropColor;
	if (preset.defaultRingColor) model.presentation.ringColor = preset.defaultRingColor;
	if (preset.defaultCenterColor) model.presentation.centerColor = preset.defaultCenterColor;
	return model;
}

export const STATE_FIXTURES: StateFixture[] = [
	{
		id: "fresh",
		label: "Fresh",
		build: () => createInitialIpodWorkbenchModel(),
	},
	{
		id: "noir",
		label: "Noir",
		build: () => {
			const model = createInitialIpodWorkbenchModel();
			model.presentation.skinColor = NOIR_THEME.colors.skinColor;
			model.presentation.ringColor = NOIR_THEME.colors.ringColor;
			model.presentation.centerColor = NOIR_THEME.colors.centerColor;
			model.presentation.backColor = NOIR_THEME.colors.backColor;
			model.presentation.edgeColor = NOIR_THEME.colors.edgeColor;
			model.presentation.bezelColor = NOIR_THEME.colors.bezelColor;
			model.presentation.bgColor = NOIR_THEME.colors.bgColor;
			model.studio.lighting = rigForTheme(NOIR_THEME);
			return model;
		},
	},
	...IPOD_CLASSIC_PRESETS.map((preset) => ({
		id: `preset-${preset.id}`,
		label: `Preset ${preset.label}`,
		build: () => baseModel(preset.id as IpodHardwarePresetId),
	})),
	{
		id: "tuned-rig",
		label: "Tuned Rig",
		build: () => {
			const model = createInitialIpodWorkbenchModel();
			const rig = cloneLightingConfig(DESIGNER_DARK_RIG);
			rig.key.intensity = 0.6;
			rig.fill.intensity = 0.3;
			rig.rim.intensity = 0.8;
			model.studio.lighting = rig;
			return model;
		},
	},
];
