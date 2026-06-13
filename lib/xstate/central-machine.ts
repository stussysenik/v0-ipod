import { createMachine, assign } from "xstate";
import { Effect, Console } from "effect";
import type { 
	IpodWorkbenchModel, 
	IpodViewMode, 
	SnapshotSelectionKind, 
	IpodOsScreen, 
	BatteryMode,
	IpodNowPlayingLayoutState,
	IpodInteractionModel,
	IpodHardwarePresetId
} from "@/lib/ipod-state/model";
import { 
	normalizeModel, 
	createInitialIpodWorkbenchModel,
	applySongSnapshotToModel,
	type SongSnapshot
} from "@/lib/ipod-state/update";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";

export type ExportWorkflowStatus = "idle" | "preparing" | "capturing" | "encoding" | "finalizing" | "success" | "error";

export type IpodMachineEvent =
	| { type: "UPDATE_TITLE"; payload: string }
	| { type: "UPDATE_ARTIST"; payload: string }
	| { type: "UPDATE_ALBUM"; payload: string }
	| { type: "UPDATE_ARTWORK"; payload: string }
	| { type: "UPDATE_CURRENT_TIME"; payload: number }
	| { type: "UPDATE_DURATION"; payload: number }
	| { type: "UPDATE_RATING"; payload: number }
	| { type: "UPDATE_TRACK_NUMBER"; payload: number }
	| { type: "UPDATE_TOTAL_TRACKS"; payload: number }
	| { type: "SET_VIEW_MODE"; payload: IpodViewMode }
	| { type: "SET_SKIN_COLOR"; payload: string }
	| { type: "SET_BG_COLOR"; payload: string }
	| { type: "SET_RING_COLOR"; payload: string }
	| { type: "SET_CENTER_COLOR"; payload: string }
	| { type: "SET_HARDWARE_PRESET"; payload: IpodHardwarePresetId }
	| { type: "SET_INTERACTION_MODEL"; payload: IpodInteractionModel }
	| { type: "SET_SELECTION_KIND"; payload: SnapshotSelectionKind }
	| { type: "SET_RANGE_START_TIME"; payload: number | null }
	| { type: "SET_RANGE_END_TIME"; payload: number | null }
	| { type: "SET_OS_SCREEN"; payload: IpodOsScreen }
	| { type: "SET_OS_MENU_INDEX"; payload: number }
	| { type: "CYCLE_OS_MENU"; payload: { direction: number; total: number } }
	| { type: "SET_OS_ORIGINAL_MENU_SPLIT"; payload: number }
	| { type: "SET_OS_NOW_PLAYING_LAYOUT"; payload: IpodNowPlayingLayoutState }
	| { type: "SET_OS_NOW_PLAYING_EDITABLE"; payload: boolean }
	| { type: "TOGGLE_OS_NOW_PLAYING_EDITABLE" }
	| { type: "SET_IS_PLAYING"; payload: boolean }
	| { type: "TOGGLE_IS_PLAYING" }
	| { type: "SET_BATTERY_LEVEL"; payload: number }
	| { type: "SET_BATTERY_MODE"; payload: BatteryMode }
	| { type: "RESTORE_MODEL"; payload: IpodWorkbenchModel }
	| { type: "RESET_MODEL" }
	| { type: "APPLY_SONG_SNAPSHOT"; payload: SongSnapshot }
	| { type: "START_EXPORT"; payload: { kind: string } }
	| { type: "UPDATE_EXPORT_PROGRESS"; payload: number }
	| { type: "EXPORT_COMPLETE" }
	| { type: "EXPORT_ERROR"; payload: string }
	| { type: "RESET_EXPORT" }
	| { type: "TICK" }
	| { type: "PLAY_PAUSE" };

export const ipodCentralMachine = createMachine(
	{
		id: "ipodCentral",
		types: {} as {
			context: IpodWorkbenchModel & { 
				exportStatus: ExportWorkflowStatus;
				exportProgress: number;
				exportError: string | null;
			};
			events: IpodMachineEvent;
		},
		initial: "idle",
		context: ({ input }: { input: IpodWorkbenchModel }) => ({
			...input,
			exportStatus: "idle" as ExportWorkflowStatus,
			exportProgress: 0,
			exportError: null,
		}),
		on: {
			UPDATE_TITLE: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, title: event.payload },
				})),
			},
			UPDATE_ARTIST: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, artist: event.payload },
				})),
			},
			UPDATE_ALBUM: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, album: event.payload },
				})),
			},
			UPDATE_ARTWORK: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, artwork: event.payload },
				})),
			},
			UPDATE_CURRENT_TIME: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, currentTime: event.payload },
					playback: { ...context.playback, currentTime: event.payload },
				})),
			},
			UPDATE_DURATION: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, duration: event.payload },
					playback: { ...context.playback, duration: event.payload },
				})),
			},
			UPDATE_RATING: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, rating: event.payload },
				})),
			},
			UPDATE_TRACK_NUMBER: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, trackNumber: event.payload },
				})),
			},
			UPDATE_TOTAL_TRACKS: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					metadata: { ...context.metadata, totalTracks: event.payload },
				})),
			},
			SET_VIEW_MODE: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					presentation: { ...context.presentation, viewMode: event.payload },
				})),
			},
			SET_SKIN_COLOR: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					presentation: { ...context.presentation, skinColor: event.payload },
				})),
			},
			SET_BG_COLOR: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					presentation: { ...context.presentation, bgColor: event.payload },
				})),
			},
			SET_RING_COLOR: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					presentation: { ...context.presentation, ringColor: event.payload },
				})),
			},
			SET_CENTER_COLOR: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					presentation: { ...context.presentation, centerColor: event.payload },
				})),
			},
			SET_HARDWARE_PRESET: {
				actions: assign(({ context, event }) => {
					const preset = getIpodClassicPreset(event.payload);
					return normalizeModel({
						...context,
						presentation: {
							...context.presentation,
							hardwarePreset: event.payload,
							skinColor: preset.defaultShellColor,
							bgColor: preset.defaultBackdropColor,
							ringColor: "",
							centerColor: "",
						},
					});
				}),
			},
			SET_INTERACTION_MODEL: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: {
						...context.interaction,
						interactionModel: event.payload,
						osScreen: event.payload === "direct" ? "now-playing" : "menu",
						isNowPlayingEditable: false,
						isPlaying: false,
					},
				})),
			},
			SET_SELECTION_KIND: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					playback: {
						...context.playback,
						selectionKind: event.payload,
						rangeStartTime: event.payload === "range" ? (context.playback.rangeStartTime ?? context.metadata.currentTime) : null,
						rangeEndTime: event.payload === "range" ? (context.playback.rangeEndTime ?? Math.min(context.metadata.duration, context.metadata.currentTime + 15)) : null,
					},
				})),
			},
			SET_RANGE_START_TIME: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					playback: { ...context.playback, rangeStartTime: event.payload },
				})),
			},
			SET_RANGE_END_TIME: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					playback: { ...context.playback, rangeEndTime: event.payload },
				})),
			},
			SET_OS_SCREEN: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, osScreen: event.payload },
				})),
			},
			SET_OS_MENU_INDEX: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, menuIndex: event.payload },
				})),
			},
			CYCLE_OS_MENU: {
				actions: assign(({ context, event }) => {
					const total = Math.max(1, event.payload.total);
					return normalizeModel({
						...context,
						interaction: {
							...context.interaction,
							menuIndex: (context.interaction.menuIndex + event.payload.direction + total) % total,
						},
					});
				}),
			},
			SET_OS_ORIGINAL_MENU_SPLIT: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, osOriginalMenuSplit: event.payload },
				})),
			},
			SET_OS_NOW_PLAYING_LAYOUT: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, osNowPlayingLayout: event.payload },
				})),
			},
			SET_OS_NOW_PLAYING_EDITABLE: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, isNowPlayingEditable: event.payload },
				})),
			},
			TOGGLE_OS_NOW_PLAYING_EDITABLE: {
				actions: assign(({ context }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, isNowPlayingEditable: !context.interaction.isNowPlayingEditable },
				})),
			},
			SET_IS_PLAYING: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, isPlaying: event.payload },
				})),
			},
			TOGGLE_IS_PLAYING: {
				actions: assign(({ context }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, isPlaying: !context.interaction.isPlaying },
				})),
			},
			SET_BATTERY_LEVEL: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, batteryLevel: Math.min(Math.max(event.payload, 0), 1) },
				})),
			},
			SET_BATTERY_MODE: {
				actions: assign(({ context, event }) => normalizeModel({
					...context,
					interaction: { ...context.interaction, batteryMode: event.payload },
				})),
			},
			RESTORE_MODEL: {
				actions: assign(({ event }) => normalizeModel(event.payload)),
			},
			RESET_MODEL: {
				actions: assign(() => createInitialIpodWorkbenchModel()),
			},
			APPLY_SONG_SNAPSHOT: {
				actions: assign(({ context, event }) => applySongSnapshotToModel(context, event.payload)),
			},
			START_EXPORT: {
				actions: assign({
					exportStatus: "preparing",
					exportProgress: 0,
					exportError: (null as string | null),
				}),
			},
			UPDATE_EXPORT_PROGRESS: {
				actions: assign({
					exportProgress: ({ event }: any) => event.payload,
				}),
			},
			EXPORT_COMPLETE: {
				actions: assign({
					exportStatus: "success",
					exportProgress: 1,
				}),
			},
			EXPORT_ERROR: {
				actions: assign({
					exportStatus: "error",
					exportError: ({ event }: any) => event.payload,
				}),
			},
			RESET_EXPORT: {
				actions: assign({
					exportStatus: "idle",
					exportProgress: 0,
					exportError: (null as string | null),
				}),
			},
			PLAY_PAUSE: {
				actions: ["togglePlaying", "logPlay"],
			},
			TICK: {
				actions: "incrementTime",
			},
		},
		states: {
			idle: {},
		},
	},
	{
		actions: {
			logPlay: () => {
				const program = Console.log("iPod state updated");
				Effect.runSync(program);
			},
			togglePlaying: assign(({ context }) => normalizeModel({
				...context,
				interaction: { ...context.interaction, isPlaying: !context.interaction.isPlaying },
			})),
			incrementTime: assign(({ context }) => {
				const nextTime = (context.metadata.currentTime + 1) % (context.metadata.duration + 1);
				return normalizeModel({
					...context,
					metadata: { ...context.metadata, currentTime: nextTime },
					playback: { ...context.playback, currentTime: nextTime },
				});
			}),
		},
	},
);
