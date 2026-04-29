import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR } from "@/lib/color-manifest";
import {
  DEFAULT_HARDWARE_PRESET_ID,
  getIpodClassicPreset,
} from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";

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

export const INITIAL_SONG_METADATA: SongMetadata = {
  title: "Chamakay",
  artist: "Blood Orange",
  album: "Cupid Deluxe",
  artwork: "/default-artwork.png",
  duration: 252,
  currentTime: 47,
  rating: 4,
  trackNumber: 2,
  totalTracks: 12,
};

export interface IpodPresentationState {
  skinColor: string;
  bgColor: string;
  viewMode: IpodViewMode;
  hardwarePreset: IpodHardwarePresetId;
}

export interface IpodInteractionState {
  interactionModel: IpodInteractionModel;
  osScreen: IpodOsScreen;
  menuIndex: number;
  osOriginalMenuSplit: number;
  osNowPlayingLayout: IpodNowPlayingLayoutState;
  isNowPlayingEditable: boolean;
}

export interface IpodPlaybackSnapshot {
  currentTime: number;
  duration: number;
  selectionKind: SnapshotSelectionKind;
  rangeStartTime: number | null;
  rangeEndTime: number | null;
}

export interface IpodWorkbenchModel {
  metadata: SongMetadata;
  playback: IpodPlaybackSnapshot;
  presentation: IpodPresentationState;
  interaction: IpodInteractionState;
}

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

export function createInitialIpodWorkbenchModel(): IpodWorkbenchModel {
  const defaultPreset = getIpodClassicPreset(DEFAULT_HARDWARE_PRESET_ID);

  return {
    metadata: INITIAL_SONG_METADATA,
    playback: {
      currentTime: INITIAL_SONG_METADATA.currentTime,
      duration: INITIAL_SONG_METADATA.duration,
      selectionKind: DEFAULT_SELECTION_KIND,
      rangeStartTime: null,
      rangeEndTime: null,
    },
    presentation: {
      skinColor: defaultPreset.defaultShellColor ?? DEFAULT_SHELL_COLOR,
      bgColor: defaultPreset.defaultBackdropColor ?? DEFAULT_BACKDROP_COLOR,
      viewMode: "flat",
      hardwarePreset: DEFAULT_HARDWARE_PRESET_ID,
    },
    interaction: {
      interactionModel: DEFAULT_INTERACTION_MODEL,
      osScreen: DEFAULT_OS_SCREEN,
      menuIndex: DEFAULT_MENU_INDEX,
      osOriginalMenuSplit: DEFAULT_OS_ORIGINAL_MENU_SPLIT,
      osNowPlayingLayout: DEFAULT_OS_NOW_PLAYING_LAYOUT,
      isNowPlayingEditable: false,
    },
  };
}
