import { DEFAULT_HARDWARE_PRESET_ID } from "@/lib/ipod-classic-presets";
import {
	DEFAULT_INTERACTION_MODEL,
	DEFAULT_OS_SCREEN,
	DEFAULT_SELECTION_KIND,
	SONG_SNAPSHOT_SCHEMA_VERSION,
} from "@/types/ipod-state";

import type { SongSnapshot } from "@/types/ipod-state";
import type { Page } from "@playwright/test";

export const LONG_METADATA_SNAPSHOT: SongSnapshot = {
	schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
	metadata: {
		title: "The Field (feat. The Durutti Column, Caroline Polachek, and Oneohtrix Point Never)",
		artist: "Sufjan Stevens, Angelo De Augustine, and The National",
		album: "A Beginner's Mind: Expanded Edition for Midnight Signal Studies",
		artwork: "/placeholder-logo.png",
		duration: 487,
		currentTime: 53,
		rating: 5,
		trackNumber: 11,
		totalTracks: 24,
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
		currentTime: 53,
		duration: 487,
		selectionKind: DEFAULT_SELECTION_KIND,
		rangeStartTime: null,
		rangeEndTime: null,
	},
};

export async function seedSnapshot(page: Page, snapshot: SongSnapshot = LONG_METADATA_SNAPSHOT) {
	await page.addInitScript((seed) => {
		window.localStorage.setItem("ipodSnapshotMetadata", JSON.stringify(seed.metadata));
		window.localStorage.setItem("ipodSnapshotUiState", JSON.stringify(seed.ui));
		window.localStorage.setItem("ipodSnapshotSongSnapshot", JSON.stringify(seed));
	}, snapshot);
}
