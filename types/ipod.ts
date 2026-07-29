/**
 * Declared as a plain interface, not an Effect `Schema.Struct`.
 *
 * The struct was a runtime value with no consumer — nothing decoded or encoded
 * through it, and the only reference was `Schema.Schema.Type` deriving this type
 * from it. Because the value shared a module with the types, all 18 importers of
 * `@/types/ipod` pulled the Effect runtime into their chunk, which put 218 KB raw
 * / 71 KB gz in the shared layout bundle to describe nine primitive fields.
 *
 * Reintroduce a schema here only alongside a caller that validates. Effect is
 * still used where it earns its weight: `lib/export/effect-pipeline.ts`, behind
 * a dynamic import on the export path.
 */
export interface SongMetadata {
	title: string;
	artist: string;
	album: string;
	artwork: string;
	duration: number;
	currentTime: number;
	rating: number;
	trackNumber: number;
	totalTracks: number;
}

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
