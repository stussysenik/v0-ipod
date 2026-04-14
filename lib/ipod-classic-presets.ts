// iPod Classic 6th Generation Colors (from reference image)
// Silver: Light anodized aluminum with light wheel
// Black: Deep black with dark wheel
import { getRevisionNotes } from "./ipod-revision-data";

import type { IpodHardwarePresetId } from "@/types/ipod-state";

interface ShellPresetTokens {
	radius: number;
	innerRadius: number;
	paddingX: number;
	paddingTop: number;
	paddingBottom: number;
	controlMarginTop: number;
}

interface ScreenPresetTokens {
	frameWidth: number;
	frameHeight: number;
	outerRadius: number;
	innerRadius: number;
	statusBarHeight: number;
	statusBarPaddingX: number;
	contentHeight: number;
	contentPaddingX: number;
	contentPaddingTop: number;
	contentGapX: number;
	artworkSize: number;
	artworkColumnWidth: number;
	progressHeight: number;
	progressBottom: number;
	progressPaddingX: number;
	progressPaddingTop: number;
	titleFontSize: number;
	artistFontSize: number;
	albumFontSize: number;
	metaFontSize: number;
	titleMarginBottom: number;
	artistMarginBottom: number;
	albumMarginBottom: number;
	metaMarginBottom: number;
}

interface WheelPresetTokens {
	size: number;
	centerSize: number;
	menuTopInset: string;
	sideInset: string;
	bottomInset: string;
	labelFontSize: number;
	labelTracking: string;
	sideIconSize: number;
	playPauseIconSize: number;
}

export interface IpodClassicPresetDefinition {
	id: IpodHardwarePresetId;
	label: string;
	shortLabel: string;
	yearLabel: string;
	notes: string;
	defaultShellColor: string;
	defaultBackdropColor: string;
	shell: ShellPresetTokens;
	screen: ScreenPresetTokens;
	wheel: WheelPresetTokens;
}

// Default to black iPod Classic 2008 (6th generation)
export const DEFAULT_HARDWARE_PRESET_ID: IpodHardwarePresetId = "classic-2008-black";

export const IPOD_CLASSIC_PRESETS: readonly IpodClassicPresetDefinition[] = [
	{
		id: "classic-2008-black",
		label: "Classic 2008 · Black",
		shortLabel: "Black",
		yearLabel: "2008",
		notes: getRevisionNotes("classic-2008-black"),
		defaultShellColor: "#1A1A1A",
		defaultBackdropColor: "#FFFFFF",
		shell: {
			radius: 36,
			innerRadius: 35,
			paddingX: 24,
			paddingTop: 18,
			paddingBottom: 28,
			controlMarginTop: 46,
		},
		screen: {
			frameWidth: 310,
			frameHeight: 228,
			outerRadius: 8,
			innerRadius: 6,
			statusBarHeight: 16,
			statusBarPaddingX: 6,
			contentHeight: 138,
			contentPaddingX: 9,
			contentPaddingTop: 8,
			contentGapX: 9,
			artworkSize: 84,
			artworkColumnWidth: 90,
			progressHeight: 33,
			progressBottom: 4,
			progressPaddingX: 8,
			progressPaddingTop: 3,
			titleFontSize: 12.1,
			artistFontSize: 10.1,
			albumFontSize: 9.2,
			metaFontSize: 8.2,
			titleMarginBottom: 2,
			artistMarginBottom: 2,
			albumMarginBottom: 5,
			metaMarginBottom: 4,
		},
		wheel: {
			size: 248,
			centerSize: 92,
			menuTopInset: "10.5%",
			sideInset: "10.5%",
			bottomInset: "11.5%",
			labelFontSize: 11.2,
			labelTracking: "0.18em",
			sideIconSize: 18,
			playPauseIconSize: 14,
		},
	},
	{
		id: "classic-2008-silver",
		label: "Classic 2008 · Silver",
		shortLabel: "Silver",
		yearLabel: "2008",
		notes: getRevisionNotes("classic-2008-silver"),
		defaultShellColor: "#C8C9CB",
		defaultBackdropColor: "#FFFFFF",
		shell: {
			radius: 35,
			innerRadius: 34,
			paddingX: 24,
			paddingTop: 18,
			paddingBottom: 29,
			controlMarginTop: 48,
		},
		screen: {
			frameWidth: 308,
			frameHeight: 226,
			outerRadius: 8,
			innerRadius: 6,
			statusBarHeight: 16,
			statusBarPaddingX: 6,
			contentHeight: 136,
			contentPaddingX: 9,
			contentPaddingTop: 8,
			contentGapX: 9,
			artworkSize: 83,
			artworkColumnWidth: 88,
			progressHeight: 32,
			progressBottom: 4,
			progressPaddingX: 8,
			progressPaddingTop: 3,
			titleFontSize: 11.9,
			artistFontSize: 9.9,
			albumFontSize: 9,
			metaFontSize: 8.1,
			titleMarginBottom: 2,
			artistMarginBottom: 2,
			albumMarginBottom: 5,
			metaMarginBottom: 4,
		},
		wheel: {
			size: 252,
			centerSize: 92,
			menuTopInset: "10.25%",
			sideInset: "10.25%",
			bottomInset: "11.25%",
			labelFontSize: 11.1,
			labelTracking: "0.17em",
			sideIconSize: 18,
			playPauseIconSize: 14,
		},
	},
	{
		id: "classic-2009",
		label: "Classic 2009 · Late 160GB",
		shortLabel: "2009",
		yearLabel: "2009",
		notes: getRevisionNotes("classic-2009"),
		defaultShellColor: "#F7F7F7",
		defaultBackdropColor: "#FFFFFF",
		shell: {
			radius: 34,
			innerRadius: 33,
			paddingX: 24,
			paddingTop: 18,
			paddingBottom: 30,
			controlMarginTop: 50,
		},
		screen: {
			frameWidth: 306,
			frameHeight: 224,
			outerRadius: 8,
			innerRadius: 6,
			statusBarHeight: 15,
			statusBarPaddingX: 6,
			contentHeight: 134,
			contentPaddingX: 9,
			contentPaddingTop: 8,
			contentGapX: 8,
			artworkSize: 82,
			artworkColumnWidth: 86,
			progressHeight: 31,
			progressBottom: 4,
			progressPaddingX: 8,
			progressPaddingTop: 3,
			titleFontSize: 11.7,
			artistFontSize: 9.8,
			albumFontSize: 8.9,
			metaFontSize: 8,
			titleMarginBottom: 2,
			artistMarginBottom: 2,
			albumMarginBottom: 5,
			metaMarginBottom: 4,
		},
		wheel: {
			size: 254,
			centerSize: 90,
			menuTopInset: "10%",
			sideInset: "10%",
			bottomInset: "11%",
			labelFontSize: 10.9,
			labelTracking: "0.16em",
			sideIconSize: 18,
			playPauseIconSize: 14,
		},
	},
] as const;

const PRESET_LOOKUP = new Map(IPOD_CLASSIC_PRESETS.map((preset) => [preset.id, preset]));

export function getIpodClassicPreset(presetId: IpodHardwarePresetId): IpodClassicPresetDefinition {
	return PRESET_LOOKUP.get(presetId) ?? PRESET_LOOKUP.get(DEFAULT_HARDWARE_PRESET_ID)!;
}
