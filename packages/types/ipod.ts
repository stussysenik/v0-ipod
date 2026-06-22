import { Schema } from "effect";

export const SongMetadataSchema = Schema.Struct({
	title: Schema.String,
	artist: Schema.String,
	album: Schema.String,
	artwork: Schema.String,
	duration: Schema.Number,
	currentTime: Schema.Number,
	rating: Schema.Number,
	trackNumber: Schema.Number,
	totalTracks: Schema.Number,
});

export type SongMetadata = Schema.Schema.Type<typeof SongMetadataSchema>;

export type IpodViewMode = "flat" | "3d" | "focus" | "preview" | "ascii";
export type IpodInteractionModel = "direct" | "ipod-os" | "ipod-os-original";
export type IpodHardwarePresetId =
	| "classic-2007"
	| "classic-2008"
	| "classic-2009"
	| "classic-2008-black"
	| "classic-2008-silver";
export type SnapshotSelectionKind = "moment" | "range";
export type IpodOsScreen = "menu" | "now-playing";
export type BatteryMode = "manual" | "solar";

export interface IpodNowPlayingLayoutPosition {
	x: number;
	y: number;
}

export type IpodNowPlayingLayoutElementId =
	| "artwork"
	| "title"
	| "artist"
	| "album"
	| "rating"
	| "track-info"
	| "progress"
	| "elapsed-time"
	| "remaining-time";

export type IpodNowPlayingLayoutState = Partial<
	Record<IpodNowPlayingLayoutElementId, IpodNowPlayingLayoutPosition>
>;

export interface IpodPresentationState {
	skinColor: string;
	bgColor: string;
	ringColor: string;
	centerColor: string;
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
	isPlaying: boolean;
	batteryLevel: number;
	batteryMode: BatteryMode;
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

// XState Action/Event Types for Central Decision Machine
export type IpodMachineEvent =
	| { type: "TICK"; delta: number }
	| { type: "PLAY_PAUSE" }
	| { type: "SET_VIEW_MODE"; mode: IpodViewMode }
	| { type: "INTERact"; kind: "wheel-scroll" | "wheel-click" | "center-click" | "menu-click" };
