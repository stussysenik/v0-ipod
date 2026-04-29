import type { SongSnapshot } from "@/types/ipod-state";
import {
	DEFAULT_OS_NOW_PLAYING_LAYOUT,
	DEFAULT_OS_ORIGINAL_MENU_SPLIT,
	DEFAULT_SELECTION_KIND,
	SONG_SNAPSHOT_SCHEMA_VERSION,
} from "@/types/ipod-state";
import { DEFAULT_HARDWARE_PRESET_ID } from "@/lib/ipod-classic-presets";

export const TEST_SONG_SNAPSHOT: SongSnapshot = {
	schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
	metadata: {
		title: "Chamakay",
		artist: "Blood Orange",
		album: "Cupid Deluxe",
		artwork: "/placeholder-logo.png",
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
		interactionModel: "direct",
		selectionKind: DEFAULT_SELECTION_KIND,
		rangeStartTime: null,
		rangeEndTime: null,
		osScreen: "now-playing",
		menuIndex: 0,
		osOriginalMenuSplit: DEFAULT_OS_ORIGINAL_MENU_SPLIT,
		osNowPlayingLayout: DEFAULT_OS_NOW_PLAYING_LAYOUT,
		isPlaying: false,
	},
	playback: {
		currentTime: 5,
		duration: 244,
		selectionKind: DEFAULT_SELECTION_KIND,
		rangeStartTime: null,
		rangeEndTime: null,
	},
};
