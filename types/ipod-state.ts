import type { SongMetadata } from "./ipod";

export type IpodViewMode = "flat" | "3d" | "focus" | "preview" | "ascii";
export type IpodInteractionModel = "direct" | "ipod-os" | "ipod-os-original";
export type IpodHardwarePresetId = "classic-2007" | "classic-2008" | "classic-2009";
export type SnapshotSelectionKind = "moment" | "range";
export type IpodOsScreen = "menu" | "now-playing";
export const NOW_PLAYING_LAYOUT_ELEMENT_IDS = [
  "artwork",
  "title",
  "artist",
  "album",
  "rating",
  "track-info",
  "progress",
  "elapsed-time",
  "remaining-time",
] as const;
export type IpodNowPlayingLayoutElementId =
  (typeof NOW_PLAYING_LAYOUT_ELEMENT_IDS)[number];

export interface IpodNowPlayingLayoutPosition {
  x: number;
  y: number;
}

export type IpodNowPlayingLayoutState = Partial<
  Record<IpodNowPlayingLayoutElementId, IpodNowPlayingLayoutPosition>
>;

export const SONG_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const DEFAULT_INTERACTION_MODEL: IpodInteractionModel = "ipod-os";
export const DEFAULT_SELECTION_KIND: SnapshotSelectionKind = "moment";
export const DEFAULT_OS_SCREEN: IpodOsScreen = "menu";
export const DEFAULT_MENU_INDEX = 0;
export const DEFAULT_OS_ORIGINAL_MENU_SPLIT = 0.54;
export const DEFAULT_OS_NOW_PLAYING_LAYOUT: IpodNowPlayingLayoutState = {};

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
  osOriginalMenuSplit: number;
  osNowPlayingLayout: IpodNowPlayingLayoutState;
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
