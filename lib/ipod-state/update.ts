import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import {
	createInitialIpodWorkbenchModel,
	DEFAULT_OS_NOW_PLAYING_LAYOUT,
	DEFAULT_SELECTION_KIND,
	SONG_SNAPSHOT_SCHEMA_VERSION,
	type IpodNowPlayingLayoutState,
	type IpodWorkbenchModel,
	type IpodUiState,
	type SnapshotSelectionKind,
	type SongSnapshot,
} from "./model";

export type IpodWorkbenchAction =
	| { type: "UPDATE_TITLE"; payload: string }
	| { type: "UPDATE_ARTIST"; payload: string }
	| { type: "UPDATE_ALBUM"; payload: string }
	| { type: "UPDATE_ARTWORK"; payload: string }
	| { type: "UPDATE_CURRENT_TIME"; payload: number }
	| { type: "UPDATE_DURATION"; payload: number }
	| { type: "UPDATE_RATING"; payload: number }
	| { type: "UPDATE_TRACK_NUMBER"; payload: number }
	| { type: "UPDATE_TOTAL_TRACKS"; payload: number }
	| { type: "SET_VIEW_MODE"; payload: IpodWorkbenchModel["presentation"]["viewMode"] }
	| { type: "SET_SKIN_COLOR"; payload: string }
	| { type: "SET_BG_COLOR"; payload: string }
	| {
			type: "SET_HARDWARE_PRESET";
			payload: IpodWorkbenchModel["presentation"]["hardwarePreset"];
	  }
	| {
			type: "SET_INTERACTION_MODEL";
			payload: IpodWorkbenchModel["interaction"]["interactionModel"];
	  }
	| { type: "SET_SELECTION_KIND"; payload: SnapshotSelectionKind }
	| { type: "SET_RANGE_START_TIME"; payload: number | null }
	| { type: "SET_RANGE_END_TIME"; payload: number | null }
	| { type: "SET_OS_SCREEN"; payload: IpodWorkbenchModel["interaction"]["osScreen"] }
	| { type: "SET_OS_MENU_INDEX"; payload: number }
	| { type: "CYCLE_OS_MENU"; payload: { direction: number; total: number } }
	| {
			type: "SET_OS_ORIGINAL_MENU_SPLIT";
			payload: number;
	  }
	| {
			type: "SET_OS_NOW_PLAYING_LAYOUT";
			payload: IpodNowPlayingLayoutState;
	  }
	| { type: "SET_OS_NOW_PLAYING_EDITABLE"; payload: boolean }
	| { type: "TOGGLE_OS_NOW_PLAYING_EDITABLE" }
	| { type: "SET_IS_PLAYING"; payload: boolean }
	| { type: "TOGGLE_IS_PLAYING" }
	| { type: "SET_BATTERY_LEVEL"; payload: number }
	| { type: "RESTORE_MODEL"; payload: IpodWorkbenchModel }
	| { type: "RESET_MODEL" }
	| { type: "APPLY_SONG_SNAPSHOT"; payload: SongSnapshot };

export function clampSnapshotTime(value: number | null, duration: number): number | null {
	if (value === null) {
		return null;
	}

	return Math.min(Math.max(Math.floor(value), 0), duration);
}

function clampSongMetadata(metadata: SongMetadata): SongMetadata {
	const duration = Math.max(1, Math.floor(metadata.duration));
	const totalTracks = Math.max(1, Math.floor(metadata.totalTracks));

	return {
		...metadata,
		duration,
		currentTime: Math.min(Math.max(metadata.currentTime, 0), duration),
		rating: Math.min(Math.max(Math.floor(metadata.rating), 0), 5),
		trackNumber: Math.min(Math.max(Math.floor(metadata.trackNumber), 1), totalTracks),
		totalTracks,
	};
}

function normalizeModel(model: IpodWorkbenchModel): IpodWorkbenchModel {
	const metadata = clampSongMetadata(model.metadata);
	const duration = metadata.duration;
	const currentTime = metadata.currentTime;
	const selectionKind = model.playback.selectionKind ?? DEFAULT_SELECTION_KIND;
	const rangeStartTime =
		selectionKind === "range"
			? clampSnapshotTime(model.playback.rangeStartTime ?? currentTime, duration)
			: null;
	const rangeEndTime =
		selectionKind === "range"
			? clampSnapshotTime(
					Math.max(
						model.playback.rangeEndTime ?? currentTime + 15,
						rangeStartTime ?? 0,
					),
					duration,
				)
			: null;

	return {
		metadata: {
			...metadata,
			currentTime,
			duration,
		},
		playback: {
			currentTime,
			duration,
			selectionKind,
			rangeStartTime,
			rangeEndTime,
		},
		presentation: model.presentation,
		interaction: {
			...model.interaction,
			menuIndex: Math.max(0, Math.floor(model.interaction.menuIndex)),
			osOriginalMenuSplit: Math.min(
				Math.max(model.interaction.osOriginalMenuSplit, 0.4),
				0.7,
			),
			osNowPlayingLayout:
				model.interaction.osNowPlayingLayout ??
				DEFAULT_OS_NOW_PLAYING_LAYOUT,
			isPlaying: !!model.interaction.isPlaying,
			batteryLevel: Math.min(
				Math.max(model.interaction.batteryLevel ?? 1.0, 0),
				1,
			),
		},
	};
}

export function buildPersistedUiState(model: IpodWorkbenchModel): IpodUiState {
	return {
		skinColor: model.presentation.skinColor,
		bgColor: model.presentation.bgColor,
		viewMode: model.presentation.viewMode,
		hardwarePreset: model.presentation.hardwarePreset,
		interactionModel: model.interaction.interactionModel,
		selectionKind: model.playback.selectionKind,
		rangeStartTime: model.playback.rangeStartTime,
		rangeEndTime: model.playback.rangeEndTime,
		osScreen: model.interaction.osScreen,
		menuIndex: model.interaction.menuIndex,
		osOriginalMenuSplit: model.interaction.osOriginalMenuSplit,
		osNowPlayingLayout: model.interaction.osNowPlayingLayout,
		isPlaying: model.interaction.isPlaying,
		batteryLevel: model.interaction.batteryLevel,
	};
}

export function buildSongSnapshot(model: IpodWorkbenchModel): SongSnapshot {
	const normalized = normalizeModel(model);

	return {
		schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
		metadata: normalized.metadata,
		ui: buildPersistedUiState(normalized),
		playback: normalized.playback,
	};
}

export function applySongSnapshotToModel(
	current: IpodWorkbenchModel,
	snapshot: SongSnapshot,
): IpodWorkbenchModel {
	return normalizeModel({
		metadata: {
			...snapshot.metadata,
			currentTime: snapshot.playback.currentTime,
			duration: snapshot.playback.duration,
		},
		playback: snapshot.playback,
		presentation: {
			skinColor: snapshot.ui.skinColor,
			bgColor: snapshot.ui.bgColor,
			viewMode: snapshot.ui.viewMode,
			hardwarePreset: snapshot.ui.hardwarePreset,
		},
		interaction: {
			interactionModel: snapshot.ui.interactionModel,
			osScreen: snapshot.ui.osScreen,
			menuIndex: snapshot.ui.menuIndex,
			osOriginalMenuSplit: snapshot.ui.osOriginalMenuSplit,
			osNowPlayingLayout: snapshot.ui.osNowPlayingLayout,
			isNowPlayingEditable: false,
			isPlaying: snapshot.ui.isPlaying ?? false,
			batteryLevel: snapshot.ui.batteryLevel ?? 1.0,
		},
	});
}

export function ipodWorkbenchReducer(
	state: IpodWorkbenchModel,
	action: IpodWorkbenchAction,
): IpodWorkbenchModel {
	switch (action.type) {
		case "UPDATE_TITLE":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, title: action.payload },
			});
		case "UPDATE_ARTIST":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, artist: action.payload },
			});
		case "UPDATE_ALBUM":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, album: action.payload },
			});
		case "UPDATE_ARTWORK":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, artwork: action.payload },
			});
		case "UPDATE_CURRENT_TIME":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, currentTime: action.payload },
				playback: { ...state.playback, currentTime: action.payload },
			});
		case "UPDATE_DURATION":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, duration: action.payload },
				playback: { ...state.playback, duration: action.payload },
			});
		case "UPDATE_RATING":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, rating: action.payload },
			});
		case "UPDATE_TRACK_NUMBER":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, trackNumber: action.payload },
			});
		case "UPDATE_TOTAL_TRACKS":
			return normalizeModel({
				...state,
				metadata: { ...state.metadata, totalTracks: action.payload },
			});
		case "SET_VIEW_MODE":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, viewMode: action.payload },
			});
		case "SET_SKIN_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, skinColor: action.payload },
			});
		case "SET_BG_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, bgColor: action.payload },
			});
		case "SET_HARDWARE_PRESET": {
			const preset = getIpodClassicPreset(action.payload);

			return normalizeModel({
				...state,
				presentation: {
					...state.presentation,
					hardwarePreset: action.payload,
					skinColor: preset.defaultShellColor,
					bgColor: preset.defaultBackdropColor,
				},
			});
		}
		case "SET_INTERACTION_MODEL":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					interactionModel: action.payload,
					osScreen:
						action.payload === "direct"
							? "now-playing"
							: "menu",
					isNowPlayingEditable: false,
					isPlaying: false,
				},
			});
		case "SET_SELECTION_KIND":
			return normalizeModel({
				...state,
				playback: {
					...state.playback,
					selectionKind: action.payload,
					rangeStartTime:
						action.payload === "range"
							? (state.playback.rangeStartTime ??
								state.metadata.currentTime)
							: null,
					rangeEndTime:
						action.payload === "range"
							? (state.playback.rangeEndTime ??
								Math.min(
									state.metadata.duration,
									state.metadata.currentTime +
										15,
								))
							: null,
				},
			});
		case "SET_RANGE_START_TIME":
			return normalizeModel({
				...state,
				playback: { ...state.playback, rangeStartTime: action.payload },
			});
		case "SET_RANGE_END_TIME":
			return normalizeModel({
				...state,
				playback: { ...state.playback, rangeEndTime: action.payload },
			});
		case "SET_OS_SCREEN":
			return normalizeModel({
				...state,
				interaction: { ...state.interaction, osScreen: action.payload },
			});
		case "SET_OS_MENU_INDEX":
			return normalizeModel({
				...state,
				interaction: { ...state.interaction, menuIndex: action.payload },
			});
		case "CYCLE_OS_MENU": {
			const total = Math.max(1, action.payload.total);

			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					menuIndex:
						(state.interaction.menuIndex +
							action.payload.direction +
							total) %
						total,
				},
			});
		}
		case "SET_OS_ORIGINAL_MENU_SPLIT":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					osOriginalMenuSplit: action.payload,
				},
			});
		case "SET_OS_NOW_PLAYING_LAYOUT":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					osNowPlayingLayout: action.payload,
				},
			});
		case "SET_OS_NOW_PLAYING_EDITABLE":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					isNowPlayingEditable: action.payload,
				},
			});
		case "TOGGLE_OS_NOW_PLAYING_EDITABLE":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					isNowPlayingEditable:
						!state.interaction.isNowPlayingEditable,
				},
			});
		case "SET_IS_PLAYING":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					isPlaying: action.payload,
				},
			});
		case "TOGGLE_IS_PLAYING":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					isPlaying: !state.interaction.isPlaying,
				},
			});
		case "SET_BATTERY_LEVEL":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					batteryLevel: Math.min(Math.max(action.payload, 0), 1),
				},
			});
		case "RESTORE_MODEL":
			return normalizeModel(action.payload);
		case "RESET_MODEL":
			return createInitialIpodWorkbenchModel();
		case "APPLY_SONG_SNAPSHOT":
			return applySongSnapshotToModel(state, action.payload);
		default:
			return state;
	}
}
