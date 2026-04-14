import type { SongMetadata } from "./ipod";

export type IpodViewMode = "flat" | "3d" | "focus" | "preview" | "ascii";
export type IpodInteractionModel = "direct" | "ipod-os";
// iPod Classic Hardware Presets
// Based on iPod 6th Generation reference image (Silver & Black)
export type IpodHardwarePresetId =
	| "classic-2008-black" // Black iPod 6G (default)
	| "classic-2008-silver" // Silver iPod 6G
	| "classic-2007" // Original 2007
	| "classic-2009"; // Late 2009
export type SnapshotSelectionKind = "moment" | "range";
export type IpodOsScreen = "menu" | "now-playing";

export const SONG_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const DEFAULT_INTERACTION_MODEL: IpodInteractionModel = "ipod-os";
export const DEFAULT_HARDWARE_PRESET_ID: IpodHardwarePresetId = "classic-2008-black";
export const DEFAULT_SELECTION_KIND: SnapshotSelectionKind = "moment";
export const DEFAULT_OS_SCREEN: IpodOsScreen = "menu";
export const DEFAULT_MENU_INDEX = 0;

export interface IpodUiState {
	skinColor: string;
	bgColor: string;
	viewMode: IpodViewMode;
	hardwarePreset: IpodHardwarePresetId;
	interactionModel: IpodInteractionModel;
	selectionKind: SnapshotSelectionKind;
	rangeStartTime: number | null;
	rangeEndTime: number | null;
	osScreen: IpodOsScreen;
	menuIndex: number;
}

export interface IpodPlaybackSnapshot {
	currentTime: number;
	duration: number;
	selectionKind: SnapshotSelectionKind;
	rangeStartTime: number | null;
	rangeEndTime: number | null;
}

export interface SongSnapshot {
	schemaVersion: typeof SONG_SNAPSHOT_SCHEMA_VERSION;
	metadata: SongMetadata;
	ui: IpodUiState;
	playback: IpodPlaybackSnapshot;
}

export interface LegacySongSnapshot {
	metadata: SongMetadata;
	ui: Pick<IpodUiState, "skinColor" | "bgColor" | "viewMode">;
}
