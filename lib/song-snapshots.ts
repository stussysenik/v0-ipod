import type { SongSnapshot } from "@/types/ipod-state";
import {
  DEFAULT_INTERACTION_MODEL,
  DEFAULT_OS_SCREEN,
  DEFAULT_SELECTION_KIND,
  DEFAULT_NOW_PLAYING_FIDELITY,
  SONG_SNAPSHOT_SCHEMA_VERSION,
} from "@/types/ipod-state";
import { DEFAULT_HARDWARE_PRESET_ID } from "@/lib/ipod-classic-presets";

export const TEST_SONG_SNAPSHOT: SongSnapshot = {
  schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
  metadata: {
    title: "Chamakay",
    artist: "Blood Orange",
    album: "Cupid Deluxe",
    artwork: "/default-artwork.png",
    duration: 252,
    currentTime: 47,
    rating: 4,
    trackNumber: 2,
    totalTracks: 12,
  },
  ui: {
    skinColor: "#FBFBF8",
    bgColor: "#F4F4EF",
    viewMode: "flat",
    hardwarePreset: DEFAULT_HARDWARE_PRESET_ID,
    interactionModel: DEFAULT_INTERACTION_MODEL,
    selectionKind: DEFAULT_SELECTION_KIND,
    rangeStartTime: null,
    rangeEndTime: null,
    osScreen: DEFAULT_OS_SCREEN,
    menuIndex: 0,
    nowPlayingFidelity: DEFAULT_NOW_PLAYING_FIDELITY,
  },
  playback: {
    currentTime: 5,
    duration: 244,
    selectionKind: DEFAULT_SELECTION_KIND,
    rangeStartTime: null,
    rangeEndTime: null,
  },
};
