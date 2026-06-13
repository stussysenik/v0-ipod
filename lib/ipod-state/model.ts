import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR, deriveWheelColors } from "@/lib/color-manifest";
import { DEFAULT_HARDWARE_PRESET_ID, getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import {
	DESIGNER_DARK_RIG,
	cloneLightingConfig,
	type StudioLightingConfig,
} from "@/lib/studio-lighting-config";
import type { SongMetadata } from "@/types/ipod";

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

export type IpodNowPlayingLayoutElementId = (typeof NOW_PLAYING_LAYOUT_ELEMENT_IDS)[number];

export interface IpodNowPlayingLayoutPosition {
	x: number;
	y: number;
}

export type IpodNowPlayingLayoutState = Partial<
	Record<IpodNowPlayingLayoutElementId, IpodNowPlayingLayoutPosition>
>;

export const SONG_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const DEFAULT_INTERACTION_MODEL: IpodInteractionModel = "direct";
export const DEFAULT_SELECTION_KIND: SnapshotSelectionKind = "moment";
export const DEFAULT_OS_SCREEN: IpodOsScreen = "now-playing";
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
	ringColor: string;
	centerColor: string;
	/** Mirror-polished stainless back shell. */
	backColor: string;
	/** Side/rim band around the device edge. Defaults to `backColor` so an
	 *  un-edited device is unchanged; set independently for a contrasting trim. */
	edgeColor: string;
	/** Matte mask framing the LCD aperture. */
	bezelColor: string;
	viewMode: IpodViewMode;
	hardwarePreset: IpodHardwarePresetId;
}

/** Factory defaults for the steel back and screen bezel — the two body parts that
 *  were previously hardcoded in the 3D renderer and are now part of the model. */
export const DEFAULT_BACK_COLOR = "#cfd3d7";
export const DEFAULT_BEZEL_COLOR = "#0a0a0a";

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

/**
 * The `/3d` studio slice — everything about *how the device is presented and lit* in the
 * 3D focus view, as opposed to what song/finish it shows. Kept separate from `presentation`
 * (physical finish colours) and `interaction` (on-device OS state) because it is studio
 * direction, not the product itself. All of it is plain JSON so it persists across refresh.
 */
export interface IpodStudioState {
	/** The live, editable lighting rig (defaults to DESIGNER_DARK_RIG — the Noir factory look). */
	lighting: StudioLightingConfig;
	/** "Lights Off / Technical": swap metal materials for flat/unlit albedo (CAD-flat view). */
	technicalFlat: boolean;
	/** Freeze on-screen editing into a clean presentation/export state (distinct from camera lock). */
	interactionLocked: boolean;
	/** Run the scrolling marquee on overflowing track text in the live 3D view. */
	marquee: boolean;
	/**
	 * Dev-only "layout" tool: show dashed bounding boxes + drag handles so Now Playing
	 * elements can be repositioned. Off by default and never tied to interaction model,
	 * so the boxes can NEVER leak into the live view, a preview, or an export. With it
	 * off, every interaction model uses plain direct inline editing (tap text to edit).
	 */
	layoutMode: boolean;
	/**
	 * Mount the Theatre.js studio timeline GUI (camera-keyframe authoring). Off by
	 * default and dev-only: the studio injects a full-screen editor overlay that
	 * otherwise sits on top of the live view, so it stays opt-in and is force-hidden
	 * during every export bake — it can never leak into a rendered clip.
	 */
	theatreStudio: boolean;
}
// Camera framing already survives reload through the camera-lock persistence
// (LOCKED_POSE_KEY in the stage), so it deliberately does NOT live in this slice.

export const DEFAULT_STUDIO_STATE: Omit<IpodStudioState, "lighting"> = {
	technicalFlat: false,
	interactionLocked: false,
	marquee: true,
	layoutMode: false,
	theatreStudio: false,
};

/** A fresh studio slice with its own private clone of the default rig.
 *  Designer Dark is the factory rig: the black device on the blue stage is the
 *  canonical first impression (spec: 3d-studio-presentation, Noir factory default). */
export function createInitialStudioState(): IpodStudioState {
	return {
		lighting: cloneLightingConfig(DESIGNER_DARK_RIG),
		...DEFAULT_STUDIO_STATE,
	};
}

export interface IpodWorkbenchModel {
	metadata: SongMetadata;
	playback: IpodPlaybackSnapshot;
	presentation: IpodPresentationState;
	interaction: IpodInteractionState;
	studio: IpodStudioState;
}

export interface IpodUiState {
	skinColor: string;
	bgColor: string;
	ringColor: string;
	centerColor: string;
	backColor: string;
	edgeColor: string;
	bezelColor: string;
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
	isPlaying: boolean;
	batteryLevel: number;
	batteryMode: BatteryMode;
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
	// Wheel colours: a preset's curated overrides win; otherwise derive from the
	// case so first-load matches what clicking the matching finish produces — no
	// flat hardcoded ring that merges into a dark anodized case.
	const defaultWheel = deriveWheelColors(defaultPreset.defaultShellColor ?? DEFAULT_SHELL_COLOR);

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
			ringColor: defaultPreset.defaultRingColor ?? defaultWheel.gradient.via,
			centerColor: defaultPreset.defaultCenterColor ?? defaultWheel.centerGradient.via,
			backColor: DEFAULT_BACK_COLOR,
			edgeColor: DEFAULT_BACK_COLOR,
			bezelColor: DEFAULT_BEZEL_COLOR,
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
			isPlaying: false,
			batteryLevel: 1.0,
			batteryMode: "manual",
		},
		studio: createInitialStudioState(),
	};
}
