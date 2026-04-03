import type { SongSnapshot } from "@/types/ipod-state";
import {
  DEFAULT_INTERACTION_MODEL,
  DEFAULT_OS_SCREEN,
  DEFAULT_SELECTION_KIND,
  SONG_SNAPSHOT_SCHEMA_VERSION,
} from "@/types/ipod-state";
import { DEFAULT_HARDWARE_PRESET_ID } from "@/lib/ipod-classic-presets";

export const TEST_SONG_SNAPSHOT: SongSnapshot = {
  schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
  metadata: {
    title: "Charcoal Baby",
    artist: "Blood Orange",
    album: "Negro Swan",
    artwork: "/placeholder-logo.png",
    duration: 244,
    currentTime: 5,
    rating: 5,
    trackNumber: 7,
    totalTracks: 16,
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
  },
  playback: {
    currentTime: 5,
    duration: 244,
    selectionKind: DEFAULT_SELECTION_KIND,
    rangeStartTime: null,
    rangeEndTime: null,
  },
};
