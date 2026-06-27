import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import {
	DESIGNER_DARK_RIG,
	cloneLightingConfig,
	type SoftboxSpec,
	type SpotRole,
	type SpotSpec,
	type StudioLightingConfig,
} from "@/lib/studio-lighting-config";
import type { SongMetadata } from "@/types/ipod";
import {
	createInitialIpodWorkbenchModel,
	createInitialStudioState,
	DEFAULT_BACK_COLOR,
	DEFAULT_BEZEL_COLOR,
	DEFAULT_OS_NOW_PLAYING_LAYOUT,
	DEFAULT_PANEL_LAYOUT,
	DEFAULT_SAVED_COLORS,
	DEFAULT_SELECTION_KIND,
	MAX_SAVED_COLORS,
	SONG_SNAPSHOT_SCHEMA_VERSION,
	type BatteryMode,
	type ColorTarget,
	type SavedColorHistory,
	type IpodNowPlayingLayoutState,
	type IpodStudioState,
	type IpodWorkbenchModel,
	type IpodUiState,
	type SnapshotSelectionKind,
	type SongSnapshot,
} from "./model";

export { createInitialIpodWorkbenchModel, type SongSnapshot };

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
	| { type: "SET_RING_COLOR"; payload: string }
	| { type: "SET_CENTER_COLOR"; payload: string }
	| { type: "SET_BACK_COLOR"; payload: string }
	| { type: "SET_EDGE_COLOR"; payload: string }
	| { type: "SET_BEZEL_COLOR"; payload: string }
	| { type: "SAVE_CUSTOM_COLOR"; payload: { target: ColorTarget; hex: string } }
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
	| { type: "SET_BATTERY_MODE"; payload: BatteryMode }
	| { type: "RESTORE_MODEL"; payload: IpodWorkbenchModel }
	| { type: "RESET_MODEL" }
	| { type: "APPLY_SONG_SNAPSHOT"; payload: SongSnapshot }
	// ── Studio (the /3d lighting + presentation slice) ──────────────────────────────
	| { type: "SET_LIGHTING"; payload: StudioLightingConfig }
	| { type: "PATCH_LIGHT"; payload: { role: SpotRole; patch: Partial<SpotSpec> } }
	| { type: "PATCH_AMBIENT"; payload: Partial<{ color: string; intensity: number }> }
	| { type: "PATCH_ENV"; payload: Partial<Pick<StudioLightingConfig["env"], "preset" | "intensity" | "blur">> }
	| { type: "PATCH_SOFTBOX"; payload: { index: number; patch: Partial<SoftboxSpec> } }
	| { type: "RESET_LIGHTING" }
	| { type: "SET_TECHNICAL_FLAT"; payload: boolean }
	| { type: "TOGGLE_TECHNICAL_FLAT" }
	| { type: "SET_INTERACTION_LOCK"; payload: boolean }
	| { type: "TOGGLE_INTERACTION_LOCK" }
	| { type: "SET_MARQUEE"; payload: boolean }
	| { type: "TOGGLE_MARQUEE" }
	| { type: "SET_SHOW_PORTS"; payload: boolean }
	| { type: "TOGGLE_SHOW_PORTS" }
	| { type: "SET_LAYOUT_MODE"; payload: boolean }
	| { type: "TOGGLE_LAYOUT_MODE" }
	| { type: "SET_THEATRE_STUDIO"; payload: boolean }
	| { type: "TOGGLE_THEATRE_STUDIO" };

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

/** Prepend `hex` to a target's history, de-duplicating and capping at MAX_SAVED_COLORS.
 *  Shared by the local reducer and the central machine so both surfaces agree. */
export function pushSavedColor(
	history: SavedColorHistory,
	target: ColorTarget,
	hex: string,
): SavedColorHistory {
	const current = history[target] ?? [];
	const next = [hex, ...current.filter((c) => c !== hex)].slice(0, MAX_SAVED_COLORS);
	return { ...history, [target]: next };
}

export function normalizeModel(model: IpodWorkbenchModel): IpodWorkbenchModel {
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
		// Studio is plain data; pass it straight through. The `??` guards a legacy model
		// restored from storage before this slice existed.
		studio: model.studio ?? createInitialStudioState(),
		// Panel layout is sparse plain data; default an absent/old snapshot to empty so the
		// host resolves every panel to its registry default (spec: floating-panel-system).
		panelLayout: model.panelLayout ?? DEFAULT_PANEL_LAYOUT,
		// Saved-color history rides its own storage key; default an old/absent model to empty.
		savedColors: model.savedColors ?? DEFAULT_SAVED_COLORS,
	};
}

export function buildPersistedUiState(model: IpodWorkbenchModel): IpodUiState {
	return {
		skinColor: model.presentation.skinColor,
		bgColor: model.presentation.bgColor,
		ringColor: model.presentation.ringColor,
		centerColor: model.presentation.centerColor,
		backColor: model.presentation.backColor,
		edgeColor: model.presentation.edgeColor,
		bezelColor: model.presentation.bezelColor,
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
		batteryMode: model.interaction.batteryMode,
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
			ringColor: snapshot.ui.ringColor ?? "",
			centerColor: snapshot.ui.centerColor ?? "",
			backColor: snapshot.ui.backColor ?? DEFAULT_BACK_COLOR,
			// Legacy snapshots predate the separate edge zone — fall back to the
			// back colour so they reload visually unchanged (edge == back).
			edgeColor: snapshot.ui.edgeColor ?? snapshot.ui.backColor ?? DEFAULT_BACK_COLOR,
			bezelColor: snapshot.ui.bezelColor ?? DEFAULT_BEZEL_COLOR,
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
			batteryMode: snapshot.ui.batteryMode ?? "manual",
		},
		// A song snapshot describes the track + finish, not the studio rig — keep the live
		// studio direction the user has set rather than resetting their lights.
		studio: current.studio ?? createInitialStudioState(),
		// Panel layout is editor chrome, not part of a song — keep the live arrangement.
		panelLayout: current.panelLayout ?? DEFAULT_PANEL_LAYOUT,
		// Color history is editor chrome too — keep what the user has accumulated.
		savedColors: current.savedColors ?? DEFAULT_SAVED_COLORS,
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
		case "SET_RING_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, ringColor: action.payload },
			});
		case "SET_CENTER_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, centerColor: action.payload },
			});
		case "SET_BACK_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, backColor: action.payload },
			});
		case "SET_EDGE_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, edgeColor: action.payload },
			});
		case "SET_BEZEL_COLOR":
			return normalizeModel({
				...state,
				presentation: { ...state.presentation, bezelColor: action.payload },
			});
		case "SAVE_CUSTOM_COLOR":
			return normalizeModel({
				...state,
				savedColors: pushSavedColor(
					state.savedColors ?? DEFAULT_SAVED_COLORS,
					action.payload.target,
					action.payload.hex,
				),
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
					ringColor: "",
					centerColor: "",
					backColor: DEFAULT_BACK_COLOR,
					edgeColor: DEFAULT_BACK_COLOR,
					bezelColor: DEFAULT_BEZEL_COLOR,
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
		case "SET_BATTERY_MODE":
			return normalizeModel({
				...state,
				interaction: {
					...state.interaction,
					batteryMode: action.payload,
				},
			});
		case "RESTORE_MODEL":
			return normalizeModel(action.payload);
		case "RESET_MODEL":
			return normalizeModel(createInitialIpodWorkbenchModel());
		case "APPLY_SONG_SNAPSHOT":
			return applySongSnapshotToModel(state, action.payload);

		// ── Studio: lighting ────────────────────────────────────────────────────────────
		// The cockpit edits a private clone of the rig; each PATCH_* mutates one sub-record
		// immutably so React re-renders and `saveWorkbenchModel` re-persists. SET/RESET swap
		// the whole rig (presets, "restore default").
		case "SET_LIGHTING":
			return patchStudio(state, { lighting: cloneLightingConfig(action.payload) });
		case "PATCH_LIGHT":
			return patchStudio(state, {
				lighting: {
					...state.studio.lighting,
					[action.payload.role]: {
						...state.studio.lighting[action.payload.role],
						...action.payload.patch,
					},
				},
			});
		case "PATCH_AMBIENT":
			return patchStudio(state, {
				lighting: {
					...state.studio.lighting,
					ambient: { ...state.studio.lighting.ambient, ...action.payload },
				},
			});
		case "PATCH_ENV":
			return patchStudio(state, {
				lighting: {
					...state.studio.lighting,
					env: { ...state.studio.lighting.env, ...action.payload },
				},
			});
		case "PATCH_SOFTBOX":
			return patchStudio(state, {
				lighting: {
					...state.studio.lighting,
					env: {
						...state.studio.lighting.env,
						softboxes: state.studio.lighting.env.softboxes.map((box, i) =>
							i === action.payload.index ? { ...box, ...action.payload.patch } : box,
						),
					},
				},
			});
		case "RESET_LIGHTING":
			// Factory reset = the Noir default rig, the same one a fresh load boots.
			return patchStudio(state, { lighting: cloneLightingConfig(DESIGNER_DARK_RIG) });

		// ── Studio: presentation toggles ─────────────────────────────────────────────────
		case "SET_TECHNICAL_FLAT":
			return patchStudio(state, { technicalFlat: action.payload });
		case "TOGGLE_TECHNICAL_FLAT":
			return patchStudio(state, { technicalFlat: !state.studio.technicalFlat });
		case "SET_INTERACTION_LOCK":
			return patchStudio(state, { interactionLocked: action.payload });
		case "TOGGLE_INTERACTION_LOCK":
			return patchStudio(state, { interactionLocked: !state.studio.interactionLocked });
		case "SET_MARQUEE":
			return patchStudio(state, { marquee: action.payload });
		case "TOGGLE_MARQUEE":
			return patchStudio(state, { marquee: !state.studio.marquee });
		case "SET_SHOW_PORTS":
			return patchStudio(state, { showPorts: action.payload });
		case "TOGGLE_SHOW_PORTS":
			return patchStudio(state, { showPorts: !state.studio.showPorts });
		case "SET_LAYOUT_MODE":
			return patchStudio(state, { layoutMode: action.payload });
		case "TOGGLE_LAYOUT_MODE":
			return patchStudio(state, { layoutMode: !state.studio.layoutMode });
		case "SET_THEATRE_STUDIO":
			return patchStudio(state, { theatreStudio: action.payload });
		case "TOGGLE_THEATRE_STUDIO":
			return patchStudio(state, { theatreStudio: !state.studio.theatreStudio });

		default:
			return state;
	}
}

/**
 * Immutably merge a partial studio slice. Studio is plain presentation data with no
 * cross-field invariants, so it skips `normalizeModel` (which only clamps song/playback
 * numbers) and merges directly — cheaper and avoids re-cloning unrelated slices each tick.
 */
function patchStudio(
	state: IpodWorkbenchModel,
	patch: Partial<IpodStudioState>,
): IpodWorkbenchModel {
	return { ...state, studio: { ...state.studio, ...patch } };
}
