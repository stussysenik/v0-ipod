"use client";

import { KumaSettingsPanel } from "./kuma-settings-panel";

import {
	startTransition,
	useReducer,
	useRef,
	useCallback,
	useState,
	useEffect,
	useMemo,
} from "react";
import {
	Box,
	Share,
	Monitor,
	Smartphone,
	Check,
	Loader2,
	Menu,
	Film,
	Video,
	Eye,
	Terminal,
	Play,
	Pause,
	Clock3,
	RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
	probeAnimatedMp4ExportSupport,
	type ExportProgress,
	type ExportStatus,
} from "@/lib/export-utils";
import { TEST_SONG_SNAPSHOT } from "@/lib/song-snapshots";
import { IconButton } from "@/components/ui/icon-button";
import { AnimatedExportDialog } from "@/components/ipod/export/animated-export-dialog";
import dynamic from "next/dynamic";
const ThreeDIpod = dynamic(
	() => import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
	{
		ssr: false,
		loading: () => (
			<div className="w-full flex-1 min-h-[400px] flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
			</div>
		),
	},
);
import { FixedEditorProvider } from "../editors/fixed-editor";
import { IpodScreen } from "../display/ipod-screen";
import { IpodAsciiScene } from "../scenes/ipod-ascii-scene";
import { IpodClickWheel } from "../controls/ipod-click-wheel";
import { IpodDevice } from "../device/ipod-device";
import {
	BG_CUSTOM_COLORS_KEY,
	CASE_CUSTOM_COLORS_KEY,
	RING_CUSTOM_COLORS_KEY,
	CENTER_CUSTOM_COLORS_KEY,
	exportWorkbenchGif,
	exportWorkbenchMp4,
	exportWorkbenchPng,
	loadCustomColors,
	loadPersistedExportCounter,
	loadPersistedSongSnapshot,
	loadPersistedLastBattery,
	loadPersistedWorkbenchModel,
	persistCustomColors,
	persistWorkbenchModel,
	playClickAudio,
	savePersistedExportCounter,
	savePersistedSongSnapshot,
	saveWorkbenchSnapshot,
} from "@/lib/ipod-state/effects";
import {
	createInitialIpodWorkbenchModel,
	type BatteryMode,
	type IpodInteractionModel,
	type IpodHardwarePresetId,
	type IpodNowPlayingLayoutState,
	type IpodOsScreen,
	type IpodViewMode,
} from "@/lib/ipod-state/model";
import {
	isAsciiViewMode,
	isAuthenticInteractionModel,
	isPngExportViewMode,
	isPreviewViewMode,
} from "@/lib/ipod-state/selectors";
import { clampSnapshotTime, ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import {
	DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	type AnimatedExportFormat,
	type AnimatedExportQuality,
	type AnimatedExportLayout,
	clampAnimatedExportDurationSeconds,
} from "@/lib/export/animated-export";
import { resolveMp4ExportStrategy } from "@/lib/export/mp4-support";
import { formatTimecode } from "@/lib/time-utils";

const MAX_CUSTOM_COLORS = 6;
const SHELL_PADDING = 48;
const EXPORT_COUNTER_PAD = 4;
type ExportKind = "png" | AnimatedExportFormat;

function slugifyExportSegment(value: string): string {
	return (
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "snapshot"
	);
}

const CLASSIC_OS_MENU_ITEMS = [
	{ id: "music", label: "Music" },
	{ id: "videos", label: "Videos" },
	{ id: "photos", label: "Photos" },
	{ id: "podcasts", label: "Podcasts" },
	{ id: "extras", label: "Extras" },
	{ id: "settings", label: "Settings" },
	{ id: "shuffle-songs", label: "Shuffle Songs" },
	{ id: "now-playing", label: "Now Playing" },
	{ id: "about", label: "About" },
] as const;

/**
 * Top-level authoring workbench for the iPod experience.
 *
 * This is the main orchestration surface. It owns the shared song snapshot,
 * presentation mode switches, export flow, and composition of the physical
 * device assemblies while leaf controls and editors remain intent-first.
 */
export default function IpodClassicWorkbench() {
	const [model, dispatch] = useReducer(
		ipodWorkbenchReducer,
		undefined,
		createInitialIpodWorkbenchModel,
	);
	const [isModelHydrated, setIsModelHydrated] = useState(false);
	const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
	const [activeExportKind, setActiveExportKind] = useState<ExportKind | null>(null);
	const [animatedExportDialogFormat, setAnimatedExportDialogFormat] =
		useState<AnimatedExportFormat | null>(null);
	const [animatedExportDurationSeconds, setAnimatedExportDurationSeconds] = useState(
		DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	);
	const [animatedExportQuality, setAnimatedExportQuality] =
		useState<AnimatedExportQuality>("pro");
	const [animatedExportLayout, setAnimatedExportLayout] =
		useState<AnimatedExportLayout>("original");
	const [canMp4Export, setCanMp4Export] = useState(false);
	const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

	// Customization State
	const [showSettings, setShowSettings] = useState(false);
	const [savedCaseColors, setSavedCaseColors] = useState<string[]>([]);
	const [savedBgColors, setSavedBgColors] = useState<string[]>([]);
	const [savedRingColors, setSavedRingColors] = useState<string[]>([]);
	const [savedCenterColors, setSavedCenterColors] = useState<string[]>([]);
	const [isExportCapturing, setIsExportCapturing] = useState(false);
	const [titleCanMarquee, setTitleCanMarquee] = useState(false);
	const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
	const [softNotice, setSoftNotice] = useState<string | null>(null);
	const [editorResetKey, setEditorResetKey] = useState(0);
	const [exportCounter, setExportCounter] = useState(0);
	const [isToolboxOpen, setIsToolboxOpen] = useState(true);
	const state = model.metadata;
	const selectionKind = model.playback.selectionKind;
	const rangeStartTime = model.playback.rangeStartTime;
	const rangeEndTime = model.playback.rangeEndTime;
	const viewMode = model.presentation.viewMode;
	const hardwarePreset = model.presentation.hardwarePreset;
	const skinColor = model.presentation.skinColor;
	const bgColor = model.presentation.bgColor;
	const ringColor = model.presentation.ringColor;
	const centerColor = model.presentation.centerColor;
	const interactionModel = model.interaction.interactionModel;
	const isPlaying = model.interaction.isPlaying;
	const osScreen = model.interaction.osScreen;
	const osMenuIndex = model.interaction.menuIndex;
	const osOriginalMenuSplit = model.interaction.osOriginalMenuSplit;
	const osNowPlayingLayout = model.interaction.osNowPlayingLayout;
	const isOsNowPlayingEditable = model.interaction.isNowPlayingEditable;
	const batteryLevel = model.interaction.batteryLevel;
	const batteryMode = model.interaction.batteryMode;
	const isFlatView = viewMode === "flat";
	const isFocusView = viewMode === "focus";
	const isPreviewView = isPreviewViewMode(viewMode);
	const isAsciiView = isAsciiViewMode(viewMode);
	const canPngExport = isPngExportViewMode(viewMode);
	const isAuthenticInteraction = isAuthenticInteractionModel(interactionModel);
	const isCompactToolbox = viewportSize.width > 0 && viewportSize.width < 768;
	const isToolboxVisible = !isCompactToolbox || isToolboxOpen;
	const activePreset = useMemo(() => getIpodClassicPreset(hardwarePreset), [hardwarePreset]);

	const containerRef = useRef<HTMLDivElement>(null);
	const exportTargetRef = useRef<HTMLDivElement>(null); // Wrapper for export
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const softNoticeTimerRef = useRef<number | null>(null);
	const toolsRef = useRef<HTMLDivElement>(null);
	const setSkinColor = useCallback((nextColor: string) => {
		dispatch({ type: "SET_SKIN_COLOR", payload: nextColor });
	}, []);
	const setBgColor = useCallback((nextColor: string) => {
		dispatch({ type: "SET_BG_COLOR", payload: nextColor });
	}, []);
	const setRingColor = useCallback((nextColor: string) => {
		dispatch({ type: "SET_RING_COLOR", payload: nextColor });
	}, []);
	const setCenterColor = useCallback((nextColor: string) => {
		dispatch({ type: "SET_CENTER_COLOR", payload: nextColor });
	}, []);
	const setRangeStartTime = useCallback((nextValue: number | null) => {
		dispatch({ type: "SET_RANGE_START_TIME", payload: nextValue });
	}, []);
	const setRangeEndTime = useCallback((nextValue: number | null) => {
		dispatch({ type: "SET_RANGE_END_TIME", payload: nextValue });
	}, []);
	const setOsScreen = useCallback((nextScreen: IpodOsScreen) => {
		dispatch({ type: "SET_OS_SCREEN", payload: nextScreen });
	}, []);
	const setOsNowPlayingLayout = useCallback((nextLayout: IpodNowPlayingLayoutState) => {
		dispatch({ type: "SET_OS_NOW_PLAYING_LAYOUT", payload: nextLayout });
	}, []);
	const setOsOriginalMenuSplit = useCallback((nextSplit: number) => {
		dispatch({ type: "SET_OS_ORIGINAL_MENU_SPLIT", payload: nextSplit });
	}, []);
	const setBatteryLevel = useCallback((nextLevel: number) => {
		dispatch({ type: "SET_BATTERY_LEVEL", payload: nextLevel });
	}, []);
	const setBatteryMode = useCallback((nextMode: BatteryMode) => {
		dispatch({ type: "SET_BATTERY_MODE", payload: nextMode });
	}, []);

	useEffect(() => {
		let cancelled = false;
		const exportTarget = exportTargetRef.current;
		if (!exportTarget) {
			void probeAnimatedMp4ExportSupport().then((supported) => {
				if (!cancelled) {
					setCanMp4Export(supported);
				}
			});
		} else {
			void resolveMp4ExportStrategy({
				targetWidth:
					exportTarget.offsetWidth || exportTarget.clientWidth || 1,
				targetHeight:
					exportTarget.offsetHeight || exportTarget.clientHeight || 1,
			}).then((strategy) => {
				if (!cancelled) {
					setCanMp4Export(strategy !== null);
				}
			});
		}

		return () => {
			cancelled = true;
		};
	}, [hardwarePreset]);

	useEffect(() => {
		setSavedCaseColors(loadCustomColors(CASE_CUSTOM_COLORS_KEY));
		setSavedBgColors(loadCustomColors(BG_CUSTOM_COLORS_KEY));
		setSavedRingColors(loadCustomColors(RING_CUSTOM_COLORS_KEY));
		setSavedCenterColors(loadCustomColors(CENTER_CUSTOM_COLORS_KEY));
	}, []);

	const saveCustomColor = useCallback((target: "case" | "bg" | "ring" | "center", hex: string) => {
		const key =
			target === "case"
				? CASE_CUSTOM_COLORS_KEY
				: target === "bg"
					? BG_CUSTOM_COLORS_KEY
					: target === "ring"
						? RING_CUSTOM_COLORS_KEY
						: CENTER_CUSTOM_COLORS_KEY;
		const current = loadCustomColors(key);
		const next = [hex, ...current.filter((c) => c !== hex)].slice(0, MAX_CUSTOM_COLORS);
		persistCustomColors(key, next);
		if (target === "case") setSavedCaseColors(next);
		else if (target === "bg") setSavedBgColors(next);
		else if (target === "ring") setSavedRingColors(next);
		else setSavedCenterColors(next);
	}, []);

	useEffect(() => {
		const readViewport = () => {
			setViewportSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		readViewport();
		window.addEventListener("resize", readViewport, { passive: true });
		window.addEventListener("orientationchange", readViewport, { passive: true });

		return () => {
			window.removeEventListener("resize", readViewport);
			window.removeEventListener("orientationchange", readViewport);
		};
	}, []);

	useEffect(() => {
		dispatch({
			type: "RESTORE_MODEL",
			payload: loadPersistedWorkbenchModel(createInitialIpodWorkbenchModel()),
		});
		setIsModelHydrated(true);
	}, []);

	// Correct viewMode if the current mode is gated by a feature flag
	useEffect(() => {
		if (!isModelHydrated) return;
		const gatedModes: Array<{ mode: IpodViewMode; flag: boolean }> = [
			{ mode: "3d", flag: FEATURE_FLAGS.SHOW_3D_VIEW_MODE },
			{ mode: "focus", flag: FEATURE_FLAGS.SHOW_FOCUS_VIEW_MODE },
			{ mode: "ascii", flag: FEATURE_FLAGS.SHOW_ASCII_VIEW_MODE },
		];
		const activeGated = gatedModes.find(
			(g) => g.mode === model.presentation.viewMode && !g.flag,
		);
		if (activeGated) {
			dispatch({ type: "SET_VIEW_MODE", payload: "preview" });
		}
	}, [isModelHydrated, model.presentation.viewMode]);

	useEffect(() => {
		setExportCounter(loadPersistedExportCounter());
	}, []);

	useEffect(() => {
		if (!isModelHydrated) return;
		persistWorkbenchModel(model);
	}, [isModelHydrated, model]);

	useEffect(() => {
		if (isFlatView && !isAuthenticInteraction) return;
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement) {
			activeElement.blur();
		}
		window.getSelection?.()?.removeAllRanges();
	}, [isFlatView, isAuthenticInteraction]);

	useEffect(() => {
		if (!isPlaying) return;

		const intervalId = window.setInterval(() => {
			dispatch({
				type: "UPDATE_CURRENT_TIME",
				payload: (state.currentTime + 1) % (state.duration + 1),
			});
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [isPlaying, state.currentTime, state.duration, dispatch]);

	useEffect(() => {
		if (selectionKind !== "range") {
			if (rangeStartTime !== null) setRangeStartTime(null);
			if (rangeEndTime !== null) setRangeEndTime(null);
			return;
		}

		const nextStart = clampSnapshotTime(
			rangeStartTime ?? state.currentTime,
			state.duration,
		);
		const nextEnd = clampSnapshotTime(
			Math.max(rangeEndTime ?? state.currentTime + 15, nextStart ?? 0),
			state.duration,
		);

		if (nextStart !== rangeStartTime) {
			setRangeStartTime(nextStart);
		}
		if (nextEnd !== rangeEndTime) {
			setRangeEndTime(nextEnd);
		}
	}, [
		selectionKind,
		rangeStartTime,
		rangeEndTime,
		state.currentTime,
		state.duration,
		setRangeStartTime,
		setRangeEndTime,
	]);

	const lastExportedBatteryRef = useRef(loadPersistedLastBattery());

	useEffect(() => {
		if (batteryMode !== "manual") return;
		dispatch({ type: "SET_BATTERY_LEVEL", payload: lastExportedBatteryRef.current });
	}, [batteryMode]);

	// Note: Manual mode no longer drains automatically to ensure it "stays full" and is deterministic.

	useEffect(() => {
		if (batteryMode !== "solar") return;
		const startLevel = lastExportedBatteryRef.current;
		const interval = setInterval(() => {
			const dur = model.metadata.duration;
			if (dur <= 0) return;
			// Simulated "solar" drain is now much slower: e.g. 5% per full song duration
			const progress = Math.min(model.metadata.currentTime / dur, 1.0);
			const SENSITIVITY = 0.05; // Only drain 5% per song in solar mode
			const level = startLevel - (startLevel - 0.08) * progress * SENSITIVITY;
			dispatch({ type: "SET_BATTERY_LEVEL", payload: Math.max(level, 0.08) });
		}, 10000);
		return () => clearInterval(interval);
	}, [batteryMode, model.metadata.currentTime, model.metadata.duration]);

	useEffect(() => {
		return () => {
			if (softNoticeTimerRef.current !== null) {
				window.clearTimeout(softNoticeTimerRef.current);
			}
		};
	}, []);

	const showSoftNotice = useCallback((message: string) => {
		if (softNoticeTimerRef.current !== null) {
			window.clearTimeout(softNoticeTimerRef.current);
		}
		setSoftNotice(message);
		softNoticeTimerRef.current = window.setTimeout(() => {
			setSoftNotice(null);
			softNoticeTimerRef.current = null;
		}, 2400);
	}, []);

	const clearSoftNotice = useCallback(() => {
		if (softNoticeTimerRef.current !== null) {
			window.clearTimeout(softNoticeTimerRef.current);
			softNoticeTimerRef.current = null;
		}
		setSoftNotice(null);
	}, []);

	const resetInteractionChrome = useCallback(
		(
			options: {
				closeSettings?: boolean;
				closeEditor?: boolean;
				closeToolbox?: boolean;
				clearNotice?: boolean;
			} = {},
		) => {
			if (options.closeSettings) setShowSettings(false);
			if (options.closeEditor) setEditorResetKey((prev) => prev + 1);
			if (options.closeToolbox && isCompactToolbox) setIsToolboxOpen(false);
			if (options.clearNotice) clearSoftNotice();
		},
		[isCompactToolbox, clearSoftNotice],
	);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const buildExportSlug = useCallback(() => {
		const artist = slugifyExportSegment(state.artist);
		const title = slugifyExportSegment(state.title);
		return `${artist}-${title}`;
	}, [state.artist, state.title]);

	const currentTimeLabel = useMemo(
		() => formatTimecode(state.currentTime),
		[state.currentTime],
	);

	const updateExportProgress = useCallback((progress: ExportProgress) => {
		startTransition(() => {
			setExportProgress(progress);
		});
	}, []);

	const formatExportId = useCallback((id: number) => {
		return String(id).padStart(EXPORT_COUNTER_PAD, "0");
	}, []);

	const resetExportUi = useCallback(() => {
		setIsExportCapturing(false);
		setActiveExportKind(null);
		setExportStatus("idle");
		setExportProgress(null);
	}, []);

	const completeSuccessfulExport = useCallback(
		(id: number, label: string) => {
			const nextCounter = id + 1;
			setExportCounter(nextCounter);
			savePersistedExportCounter(nextCounter);
			showSoftNotice(`${label} Exported`);
			setExportStatus("success");
			setExportProgress((current) =>
				current
					? {
							...current,
							stage: "complete",
							progress: 1,
						}
					: null,
			);
			setTimeout(() => {
				resetExportUi();
			}, 2000);
		},
		[showSoftNotice, resetExportUi],
	);

	const handlePngExportRef = useRef<(() => void) | null>(null);

	const handlePngExport = useCallback(async () => {
		if (exportStatus !== "idle") return;
		resetInteractionChrome({
			closeSettings: true,
			closeEditor: true,
			closeToolbox: true,
			clearNotice: true,
		});
		if (!canPngExport) {
			playClick();
			showSoftNotice("Switch to Flat or Focus for Image");
			return;
		}
		playClick();
		if (!exportTargetRef.current) return;

		const exportId = exportCounter;
		const exportTag = formatExportId(exportId);
		const filename = `ipod-${exportTag}-${buildExportSlug()}.png`;

		setActiveExportKind("png");
		setIsExportCapturing(true);
		updateExportProgress({
			stage: "settling",
			label: "Preparing image export",
			detail: "Queueing the export pipeline",
			progress: 0.01,
		});

		try {
			console.info("[png-export] starting capture", { filename });
			const result = await exportWorkbenchPng(exportTargetRef.current, {
				filename,
				backgroundColor: bgColor,
				onStatusChange: setExportStatus,
				onProgressChange: updateExportProgress,
			});
			console.info("[png-export] finished", result);

			if (result.success) {
				completeSuccessfulExport(exportId, `Image #${exportTag}`);
			} else {
				toast.error("Export failed", {
					description: result.error,
					action: {
						label: "Retry",
						onClick: () => handlePngExportRef.current?.(),
					},
				});
				resetExportUi();
			}
		} catch (error) {
			console.error("[png-export] critical failure", error);
			toast.error("Critical export error");
			resetExportUi();
		}
	}, [
		bgColor,
		buildExportSlug,
		completeSuccessfulExport,
		exportCounter,
		exportStatus,
		formatExportId,
		canPngExport,
		playClick,
		resetExportUi,
		resetInteractionChrome,
		showSoftNotice,
		updateExportProgress,
	]);

	useEffect(() => {
		handlePngExportRef.current = handlePngExport;
	}, [handlePngExport]);

	const handleAnimatedExportRef = useRef<(() => void) | null>(null);
	const lastAnimatedExportRequestRef = useRef<{
		format: AnimatedExportFormat;
		durationSeconds: number;
		quality: AnimatedExportQuality;
		layout: AnimatedExportLayout;
	} | null>(null);

	const runAnimatedExport = useCallback(
		async (
			format: AnimatedExportFormat,
			requestedDurationSeconds: number,
			quality: AnimatedExportQuality = "pro",
			layout: AnimatedExportLayout = "original",
		) => {
			if (exportStatus !== "idle") return;
			if (!exportTargetRef.current) return;

			const durationSeconds =
				clampAnimatedExportDurationSeconds(requestedDurationSeconds);
			const exportId = exportCounter;
			const exportTag = formatExportId(exportId);
			const filename = `ipod-${exportTag}-${buildExportSlug()}.${format}`;

			lastAnimatedExportRequestRef.current = {
				format,
				durationSeconds,
				quality,
				layout,
			};
			setActiveExportKind(format);
			setIsExportCapturing(true);
			updateExportProgress({
				stage: "settling",
				label:
					format === "gif"
						? "Preparing animated GIF"
						: "Preparing MP4 export",
				detail: "Queueing the export pipeline",
				progress: 0.01,
			});

			try {
				console.info(`[${format}-export] starting animated export`, {
					filename,
					durationSeconds,
					quality,
					layout,
				});
				const result =
					format === "gif"
						? await exportWorkbenchGif(
								exportTargetRef.current,
								{
									filename,
									backgroundColor: bgColor,
									durationSeconds,
									quality,
									layout,
									onStatusChange:
										setExportStatus,
									onProgressChange:
										updateExportProgress,
								},
							)
						: await exportWorkbenchMp4(
								exportTargetRef.current,
								{
									filename,
									backgroundColor: bgColor,
									durationSeconds,
									quality,
									layout,
									onStatusChange:
										setExportStatus,
									onProgressChange:
										updateExportProgress,
								},
							);
				console.info(`[${format}-export] finished`, result);

				if (result.success) {
					completeSuccessfulExport(
						exportId,
						format === "gif"
							? `Animated #${exportTag}`
							: `Clip #${exportTag}`,
					);
					return;
				}

				toast.error(
					format === "gif"
						? "GIF export failed"
						: "MP4 export failed",
					{
						description: result.error,
						action: {
							label: "Retry",
							onClick: () =>
								handleAnimatedExportRef.current?.(),
						},
					},
				);
				resetExportUi();
			} catch (error) {
				console.error(`[${format}-export] critical failure`, error);
				toast.error(
					format === "gif"
						? "Critical GIF export error"
						: "Critical MP4 export error",
				);
				resetExportUi();
			}
		},
		[
			bgColor,
			buildExportSlug,
			completeSuccessfulExport,
			exportCounter,
			exportStatus,
			formatExportId,
			resetExportUi,
			updateExportProgress,
		],
	);

	useEffect(() => {
		const request = lastAnimatedExportRequestRef.current;
		handleAnimatedExportRef.current = request
			? () => {
					void runAnimatedExport(
						request.format,
						request.durationSeconds,
						request.quality,
						request.layout,
					);
				}
			: null;
	}, [runAnimatedExport]);

	const openAnimatedExportDialog = useCallback(
		(format: AnimatedExportFormat) => {
			if (exportStatus !== "idle") return;
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			if (!isPreviewView && !isAsciiView) {
				playClick();
				showSoftNotice("Switch to Preview or ASCII for Animation");
				return;
			}
			if (format === "mp4" && !canMp4Export) {
				playClick();
				showSoftNotice("MP4 export needs a newer Chromium browser");
				return;
			}

			playClick();
			setAnimatedExportDialogFormat(format);
		},
		[
			canMp4Export,
			exportStatus,
			isAsciiView,
			isPreviewView,
			playClick,
			resetInteractionChrome,
			showSoftNotice,
		],
	);

	const handleGifExport = useCallback(() => {
		openAnimatedExportDialog("gif");
	}, [openAnimatedExportDialog]);

	const handleMp4Export = useCallback(() => {
		openAnimatedExportDialog("mp4");
	}, [openAnimatedExportDialog]);

	const handleAnimatedExportConfirm = useCallback(() => {
		const format = animatedExportDialogFormat;
		if (!format) return;

		setAnimatedExportDialogFormat(null);
		void runAnimatedExport(
			format,
			animatedExportDurationSeconds,
			animatedExportQuality,
			animatedExportLayout,
		);
	}, [
		animatedExportDialogFormat,
		animatedExportDurationSeconds,
		animatedExportQuality,
		animatedExportLayout,
		runAnimatedExport,
	]);

	const handleHardwarePresetChange = useCallback(
		(nextPreset: IpodHardwarePresetId) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			dispatch({ type: "SET_HARDWARE_PRESET", payload: nextPreset });
		},
		[resetInteractionChrome],
	);

	const handleInteractionModelChange = useCallback(
		(nextModel: IpodInteractionModel) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			dispatch({ type: "SET_INTERACTION_MODEL", payload: nextModel });
		},
		[resetInteractionChrome],
	);

	const cycleOsMenu = useCallback(
		(direction: number) => {
			dispatch({
				type: "CYCLE_OS_MENU",
				payload: { direction, total: CLASSIC_OS_MENU_ITEMS.length },
			});
			playClick();
		},
		[playClick],
	);

	const handleWheelSeek = useCallback(
		(delta: number) => {
			if (osScreen === "menu") {
				cycleOsMenu(delta);
				return;
			}

			const step = 2;
			const nextTime = Math.max(
				0,
				Math.min(state.duration, state.currentTime + delta * step),
			);
			if (Math.floor(nextTime) !== Math.floor(state.currentTime)) {
				dispatch({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
				if (Math.abs(delta) > 0.5) playClick();
			}
		},
		[
			cycleOsMenu,
			osScreen,
			state.currentTime,
			state.duration,
			playClick,
		],
	);

	const handleSeek = useCallback(
		(direction: number) => {
			const step = 15;
			const nextTime = Math.max(
				0,
				Math.min(state.duration, state.currentTime + direction * step),
			);
			dispatch({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
			playClick();
		},
		[state.currentTime, state.duration, playClick],
	);

	const handleOsMenuSelect = useCallback(() => {
		const activeItem = CLASSIC_OS_MENU_ITEMS[osMenuIndex];
		if (!activeItem) return;

		switch (activeItem.id) {
			case "music":
			case "now-playing":
			case "shuffle-songs":
				setOsScreen("now-playing");
				return;
			case "settings":
				if (isCompactToolbox) {
					setIsToolboxOpen(true);
				}
				setShowSettings(true);
				return;
			default:
				showSoftNotice(
					`${activeItem.label} is queued for the fuller OS pass`,
				);
		}
	}, [isCompactToolbox, osMenuIndex, showSoftNotice, setOsScreen]);

	const handleNowPlayingCenterClick = useCallback(() => {
		dispatch({ type: "TOGGLE_OS_NOW_PLAYING_EDITABLE" });
	}, []);

	const handleMenuButtonPress = useCallback(() => {
		if (!isAuthenticInteraction) {
			// Direct mode: toggle between menu and now-playing
			if (osScreen === "menu") {
				setOsScreen("now-playing");
			} else {
				setOsScreen("menu");
			}
			return;
		}
		dispatch({ type: "SET_OS_NOW_PLAYING_EDITABLE", payload: false });
		setOsScreen("menu");
	}, [isAuthenticInteraction, osScreen, setOsScreen]);

	const handlePreviousButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			cycleOsMenu(-1);
			return;
		}
		handleSeek(-1);
	}, [cycleOsMenu, handleSeek, osScreen]);

	const handleNextButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			cycleOsMenu(1);
			return;
		}
		handleSeek(1);
	}, [cycleOsMenu, handleSeek, osScreen]);

	const handlePlayPauseButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			setOsScreen("now-playing");
			return;
		}

		dispatch({ type: "TOGGLE_IS_PLAYING" });
		playClick();

		const nextIsPlaying = !isPlaying;
		showSoftNotice(nextIsPlaying ? "Playing" : "Paused");
	}, [osScreen, isPlaying, playClick, showSoftNotice, setOsScreen]);

	const screenComponent = isAsciiView ? (
		<IpodAsciiScene state={state} />
	) : (
		// The display assembly receives shared state from the workbench and renders
		// the active screen scene within the physical device composition.
		<IpodScreen
			preset={activePreset}
			skinColor={skinColor}
			state={state}
			dispatch={dispatch}
			playClick={playClick}
			interactionModel={interactionModel}
			osScreen={osScreen}
			osMenuItems={CLASSIC_OS_MENU_ITEMS}
			osMenuIndex={osMenuIndex}
			osOriginalMenuSplit={osOriginalMenuSplit}
			onOsOriginalMenuSplitChange={setOsOriginalMenuSplit}
			osNowPlayingLayout={osNowPlayingLayout}
			onOsNowPlayingLayoutChange={setOsNowPlayingLayout}
			batteryLevel={batteryLevel}
			isEditable={
				!isExportCapturing &&
				(isAuthenticInteraction
					? isOsNowPlayingEditable && osScreen === "now-playing"
					: isFlatView)
			}
			exportSafe={isExportCapturing}
			titlePreview={isPreviewView || isPlaying}
			animateText={isPlaying}
			titleCaptureReady={isPreviewView || activeExportKind === "gif" || activeExportKind === "mp4"}
			onTitleOverflowChange={setTitleCanMarquee}
		/>
	);

	const wheelComponent = (
		// The click wheel is treated as a hardware control assembly, even though
		// the handlers ultimately mutate workbench state.
		<IpodClickWheel
			preset={activePreset}
			skinColor={skinColor}
			ringColor={ringColor || undefined}
			centerColor={centerColor || undefined}
			playClick={playClick}
			onSeek={handleWheelSeek}
			onCenterClick={
				osScreen === "menu"
					? handleOsMenuSelect
					: handlePlayPauseButtonPress
			}
			onMenuPress={handleMenuButtonPress}
			onPreviousPress={handlePreviousButtonPress}
			onNextPress={handleNextButtonPress}
			onPlayPausePress={handlePlayPauseButtonPress}
			disabled={
				isExportCapturing ||
				isAsciiView ||
				(osScreen !== "menu" && !isFlatView && !isFocusView && !isAuthenticInteraction)
			}
			exportSafe={isExportCapturing}
		/>
	);

	const handleSaveSnapshot = useCallback(() => {
		resetInteractionChrome({
			closeSettings: true,
			closeEditor: true,
			closeToolbox: true,
			clearNotice: true,
		});
		playClick();
		saveWorkbenchSnapshot(model);
		lastExportedBatteryRef.current = model.interaction.batteryLevel;
		showSoftNotice("Snapshot saved");
	}, [model, playClick, showSoftNotice, resetInteractionChrome]);

	const handleResetModel = useCallback(() => {
		resetInteractionChrome({
			closeSettings: true,
			closeEditor: true,
			closeToolbox: true,
			clearNotice: true,
		});
		playClick();
		dispatch({ type: "RESET_MODEL" });
		showSoftNotice("Reset to defaults");
	}, [dispatch, playClick, showSoftNotice, resetInteractionChrome]);

	const handleLoadSnapshot = useCallback(() => {
		resetInteractionChrome({
			closeSettings: true,
			closeEditor: true,
			closeToolbox: true,
			clearNotice: true,
		});
		playClick();
		const persisted = loadPersistedSongSnapshot();
		if (persisted) {
			dispatch({ type: "APPLY_SONG_SNAPSHOT", payload: persisted });
			savePersistedSongSnapshot(persisted);
			lastExportedBatteryRef.current = persisted.ui.batteryLevel;
			setShowSettings(false);
			showSoftNotice("Snapshot loaded");
			return;
		}

		dispatch({ type: "APPLY_SONG_SNAPSHOT", payload: TEST_SONG_SNAPSHOT });
		savePersistedSongSnapshot(TEST_SONG_SNAPSHOT);
		lastExportedBatteryRef.current = TEST_SONG_SNAPSHOT.ui.batteryLevel;
		setShowSettings(false);
		showSoftNotice("Loaded sample snapshot");
	}, [dispatch, playClick, showSoftNotice, resetInteractionChrome]);

	const handleViewModeChange = useCallback(
		(nextMode: IpodViewMode) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			if (nextMode === "preview") {
				dispatch({ type: "SET_OS_SCREEN", payload: "now-playing" });
			}
			dispatch({ type: "SET_VIEW_MODE", payload: nextMode });
		},
		[resetInteractionChrome],
	);

	const handleToggleToolbox = useCallback(() => {
		clearSoftNotice();
		setIsToolboxOpen((prev) => {
			const next = !prev;
			if (!next) {
				setShowSettings(false);
			}
			return next;
		});
	}, [clearSoftNotice]);

	const handleToggleSettings = useCallback(() => {
		clearSoftNotice();
		setShowSettings((prev) => !prev);
	}, [clearSoftNotice]);

	const frameWidth = activePreset.shell.width + SHELL_PADDING * 2;
	const frameHeight = activePreset.shell.height + SHELL_PADDING * 2;

	const previewScale = useMemo(() => {
		if (isExportCapturing || viewportSize.width === 0 || viewportSize.height === 0) {
			return 1;
		}

		// Reserve space for container padding and toolbox
		const isSmall = viewportSize.width < 640;
		const isMedium = viewportSize.width < 1024;
		// horizontalReserve must be >= 32 on all screens to match outer div's
		// maxWidth: calc(100vw - 2rem) constraint
		const horizontalReserve = isSmall ? 32 : isMedium ? 56 : 80;

		const verticalReserve = isCompactToolbox ? 144 : 48;

		const availableWidth = Math.max(viewportSize.width - horizontalReserve, 240);
		const availableHeight = Math.max(viewportSize.height - verticalReserve, 280);
		const fitScale = Math.min(
			availableWidth / frameWidth,
			availableHeight / frameHeight,
			1,
		);

		if (viewMode === "focus") {
			const maxScale = Math.min(
				availableWidth / frameWidth,
				availableHeight / frameHeight,
				1.28,
			);
			return Math.min(maxScale, fitScale * 1.3);
		}

		return fitScale;
	}, [
		isCompactToolbox,
		isExportCapturing,
		viewportSize.width,
		viewportSize.height,
		viewMode,
		frameWidth,
		frameHeight,
	]);

	const scaledFrameWidth = Math.round(frameWidth * previewScale);
	const scaledFrameHeight = Math.round(frameHeight * previewScale);
	const pngBusy = activeExportKind === "png" && exportStatus !== "idle";
	const gifBusy = activeExportKind === "gif" && exportStatus !== "idle";
	const mp4Busy = activeExportKind === "mp4" && exportStatus !== "idle";
	const exportProgressPercent = Math.round((exportProgress?.progress ?? 0) * 100);
	const toolboxDockClass = isCompactToolbox
		? "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
		: "fixed top-6 right-6";
	const toolboxPanelClass = isCompactToolbox
		? `absolute right-0 bottom-14 max-w-[calc(100vw-2rem)] flex flex-col gap-3 rounded-2xl border border-[#D0D4DA] bg-[#E7E7E3]/95 p-2 shadow-[0_16px_34px_rgba(0,0,0,0.2)] transition-opacity duration-300 ${isToolboxVisible ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`
		: "flex flex-col gap-3";

	return (
		<FixedEditorProvider resetKey={editorResetKey}>
			<div
				ref={containerRef}
				className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 p-2 sm:p-4"
				style={{ backgroundColor: bgColor }}
			>
				{/* Floating Tools UI */}
				<div
					ref={toolsRef}
					className={`${toolboxDockClass} z-50 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-top-4 duration-700 ${exportStatus !== "idle" ? "opacity-0 pointer-events-none" : ""}`}
				>
					{isCompactToolbox && (
						<IconButton
							icon={<Menu className="w-5 h-5" />}
							label={
								isToolboxVisible
									? "Hide Toolbox"
									: "Toolbox"
							}
							data-testid="toolbox-toggle-button"
							onClick={handleToggleToolbox}
							isActive={isToolboxVisible}
							className="w-12 h-12 border border-[#D0D4DA] bg-[#F2F2F0]/95 text-black backdrop-blur-sm"
						/>
					)}

					<div
						data-testid="toolbox-panel"
						className={toolboxPanelClass}
					>
						<KumaSettingsPanel
							showSettings={showSettings}
							onToggleSettings={handleToggleSettings}
							isCompactToolbox={isCompactToolbox}
							hardwarePreset={hardwarePreset}
							onHardwarePresetChange={handleHardwarePresetChange}
							interactionModel={interactionModel}
							onInteractionModelChange={handleInteractionModelChange}
							batteryLevel={batteryLevel}
							onBatteryLevelChange={setBatteryLevel}
							batteryMode={batteryMode}
							onBatteryModeChange={setBatteryMode}
							skinColor={skinColor}
							onSkinColorChange={setSkinColor}
							ringColor={ringColor}
							onRingColorChange={setRingColor}
							centerColor={centerColor}
							onCenterColorChange={setCenterColor}
							bgColor={bgColor}
							onBgColorChange={setBgColor}
							savedCaseColors={savedCaseColors}
							savedRingColors={savedRingColors}
							savedCenterColors={savedCenterColors}
							savedBgColors={savedBgColors}
							onSaveCustomColor={saveCustomColor}
							onLoadSnapshot={handleLoadSnapshot}
							onSaveSnapshot={handleSaveSnapshot}
						/>

						{/* View Modes */}
						<div className="flex flex-col gap-2 p-2 bg-[#E7E7E3]/80 backdrop-blur-sm rounded-xl border border-[#D0D4DA] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
							<IconButton
								icon={
									<Smartphone className="w-5 h-5" />
								}
								label="Flat"
								data-testid="flat-view-button"
								isActive={viewMode === "flat"}
								onClick={() =>
									handleViewModeChange("flat")
								}
							/>
							<IconButton
								icon={<Eye className="w-5 h-5" />}
								label="Preview"
								data-testid="preview-view-button"
								isActive={viewMode === "preview"}
								onClick={() =>
									handleViewModeChange(
										"preview",
									)
								}
							/>
							{FEATURE_FLAGS.SHOW_3D_VIEW_MODE && (
								<IconButton
									icon={<Box className="w-5 h-5" />}
									label="3D Experience"
									badge="WIP"
									data-testid="three-d-view-button"
									isActive={viewMode === "3d"}
									onClick={() =>
										handleViewModeChange("3d")
									}
								/>
							)}
							{FEATURE_FLAGS.SHOW_FOCUS_VIEW_MODE && (
								<IconButton
									icon={
										<Monitor className="w-5 h-5" />
									}
									label="Focus Mode"
									data-testid="focus-view-button"
									isActive={viewMode === "focus"}
									onClick={() =>
										handleViewModeChange(
											"focus",
										)
									}
								/>
							)}
							{FEATURE_FLAGS.SHOW_ASCII_VIEW_MODE && (
								<IconButton
									icon={
										<Terminal className="w-5 h-5" />
									}
									label="ASCII Mode"
									badge="WIP"
									data-testid="ascii-view-button"
									isActive={viewMode === "ascii"}
									onClick={() =>
										handleViewModeChange(
											"ascii",
										)
									}
								/>
							)}
							<IconButton
								icon={
									isPlaying ? (
										<Pause className="w-5 h-5" />
									) : (
										<Play className="w-5 h-5" />
									)
								}
								label={isPlaying ? "Pause" : "Play"}
								data-testid="play-pause-toggle-button"
								onClick={() => {
									playClick();
									dispatch({
										type: "TOGGLE_IS_PLAYING",
									});
								}}
								className={
									isPlaying
										? "bg-blue-100 text-blue-600 border-blue-200"
										: ""
								}
							/>
							<IconButton
								icon={<RotateCcw className="w-5 h-5" />}
								label="Reset to Defaults"
								data-testid="reset-workbench-button-top"
								onClick={handleResetModel}
								className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50/50"
							/>
						</div>

						{/* Export Action */}
						<IconButton
							icon={
								activeExportKind === "png" &&
								exportStatus === "success" ? (
									<Check className="w-5 h-5" />
								) : pngBusy ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Share className="w-5 h-5" />
								)
							}
							label={
								activeExportKind === "png" &&
								exportStatus === "preparing"
									? "Preparing..."
									: activeExportKind ===
												"png" &&
										  exportStatus ===
												"sharing"
										? "Sharing..."
										: activeExportKind ===
													"png" &&
											  exportStatus ===
													"success"
											? "Done!"
											: !canPngExport
												? "Flat or Focus View"
												: "Export 2D Image"
							}
							onClick={handlePngExport}
							data-testid="export-button"
							contrast={true}
							disabled={
								!canPngExport ||
								exportStatus !== "idle"
							}
							className={`transition-colors duration-300 ${
								activeExportKind === "png" &&
								exportStatus === "success"
									? "bg-green-500 hover:bg-green-600 border-none"
									: pngBusy
										? "bg-blue-500 hover:bg-blue-600 border-none"
										: ""
							} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
						/>
						{(isPreviewView || isAsciiView || gifBusy) && (
							<IconButton
								icon={
									activeExportKind ===
										"gif" &&
									exportStatus ===
										"success" ? (
										<Check className="w-5 h-5" />
									) : gifBusy ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<Film className="w-5 h-5" />
									)
								}
								label={
									activeExportKind ===
										"gif" &&
									exportStatus === "preparing"
										? "Preparing..."
										: activeExportKind ===
													"gif" &&
											  exportStatus ===
													"encoding"
											? "Encoding GIF..."
											: activeExportKind ===
														"gif" &&
												  exportStatus ===
														"success"
												? "Done!"
												: "Export Animated GIF"
								}
								onClick={handleGifExport}
								data-testid="gif-export-button"
								contrast={true}
								disabled={exportStatus !== "idle"}
								className={`transition-colors duration-300 ${
									activeExportKind ===
										"gif" &&
									exportStatus === "success"
										? "bg-green-500 hover:bg-green-600 border-none"
										: gifBusy
											? "bg-blue-500 hover:bg-blue-600 border-none"
											: ""
								} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
							/>
						)}
						{(isPreviewView || isAsciiView || mp4Busy) && (
							<IconButton
								icon={
									activeExportKind ===
										"mp4" &&
									exportStatus ===
										"success" ? (
										<Check className="w-5 h-5" />
									) : mp4Busy ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<Video className="w-5 h-5" />
									)
								}
								label={
									activeExportKind ===
										"mp4" &&
									exportStatus === "preparing"
										? "Preparing..."
										: activeExportKind ===
													"mp4" &&
											  exportStatus ===
													"encoding"
											? "Encoding MP4..."
											: activeExportKind ===
														"mp4" &&
												  exportStatus ===
														"success"
												? "Done!"
												: canMp4Export
													? "Export MP4 Clip"
													: "MP4 Not Supported"
								}
								onClick={handleMp4Export}
								data-testid="mp4-export-button"
								contrast={true}
								disabled={
									!canMp4Export ||
									exportStatus !== "idle"
								}
								className={`transition-colors duration-300 ${
									activeExportKind ===
										"mp4" &&
									exportStatus === "success"
										? "bg-green-500 hover:bg-green-600 border-none"
										: mp4Busy
											? "bg-blue-500 hover:bg-blue-600 border-none"
											: ""
								} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
							/>
						)}
					</div>
				</div>

				{softNotice && exportStatus === "idle" && (
					<div className="fixed right-6 bottom-6 z-50 rounded-full border border-black/10 bg-white/72 px-3 py-1 text-[11px] font-medium text-black/65 shadow-[0_8px_18px_rgba(0,0,0,0.1)] backdrop-blur-sm">
						{softNotice}
					</div>
				)}

				{exportStatus !== "idle" && exportProgress && (
					<div className="fixed left-1/2 top-6 z-[92] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[24px] border border-black/10 bg-white/88 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.16)] backdrop-blur-md">
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
									{activeExportKind?.toUpperCase() ??
										"EXPORT"}{" "}
									Progress
								</p>
								<p className="mt-1 text-sm font-semibold text-[#111827]">
									{exportProgress.label}
								</p>
								<p className="mt-1 text-xs leading-5 text-[#4B5563]">
									{exportProgress.detail}
								</p>
							</div>
							<div className="shrink-0 text-right">
								<div className="text-2xl font-semibold leading-none text-[#111827]">
									{exportProgressPercent}%
								</div>
								<div className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-black/45">
									<Clock3 className="h-3.5 w-3.5" />
									{exportProgress.etaSeconds !== undefined && exportProgress.etaSeconds > 0 ? (
										<span>~{exportProgress.etaSeconds}s left</span>
									) : (
										"Live"
									)}
								</div>
							</div>
						</div>

						<div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
							<div
								className="h-full rounded-full bg-[linear-gradient(90deg,#111827,#2563EB)] transition-[width] duration-150"
								style={{
									width: `${exportProgressPercent}%`,
								}}
							/>
						</div>

						<div className="mt-3 flex items-center justify-between gap-4 text-[11px] font-medium text-black/50">
							<span>{exportProgress.stage}</span>
							<span>
								{exportProgress.currentFrame &&
								exportProgress.totalFrames
									? `${exportProgress.currentFrame} / ${exportProgress.totalFrames} frames`
									: activeExportKind === "png"
										? "single-frame export"
										: "pipeline active"}
							</span>
						</div>
					</div>
				)}

				{isPreviewView && exportStatus === "idle" && (
					<div className="mb-4 flex w-full max-w-[28rem] items-center justify-center">
						<div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
								Marquee Preview
							</div>
							<div className="mt-0.5 text-[12px] font-medium text-black/70">
								{titleCanMarquee
									? "The title is crawling. Export GIF or MP4 to capture it."
									: "Title will scroll in animated exports along with progress and time."}
							</div>
						</div>
					</div>
				)}

				{isAsciiView && exportStatus === "idle" && (
					<div className="mb-4 flex w-full max-w-[28rem] items-center justify-center">
						<div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
							<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
								ASCII Mode
							</div>
							<div className="mt-0.5 text-[12px] font-medium text-black/70">
								Terminal-style Now Playing. Export
								GIF or MP4 to animate the progress
								bar.
							</div>
						</div>
					</div>
				)}

				{/* 3D MODE (R3F) */}
				{viewMode === "3d" && (
					<ThreeDIpod
						skinColor={skinColor}
						ringColor={ringColor || undefined}
						centerColor={centerColor || undefined}
						screen={screenComponent}
						wheel={wheelComponent}
					/>
				)}

				{/* 2D / EXPORT MODE */}
				<div
					className={`relative overflow-hidden transition-opacity duration-700 ${
						viewMode !== "3d"
							? "opacity-100"
							: "opacity-0 pointer-events-none absolute"
					}`}
					style={{
						width: `${scaledFrameWidth}px`,
						height: `${scaledFrameHeight}px`,
						maxWidth: "calc(100vw - 2rem)",
						maxHeight: "calc(100dvh - 2rem)",
					}}
				>
					<div
						style={{
							width: `${frameWidth}px`,
							height: `${frameHeight}px`,
							transform: `scale(${previewScale})`,
							transformOrigin: "top left",
						}}
					>
						<div
							ref={exportTargetRef}
							data-export-shell={
								isExportCapturing
									? "true"
									: "false"
							}
							className="p-8 sm:p-10 md:p-12"
							style={{
								backgroundColor:
									isExportCapturing
										? bgColor
										: "transparent",
							}}
						>
							<IpodDevice
								preset={activePreset}
								skinColor={skinColor}
								exportSafe={
									isExportCapturing
								}
								screen={screenComponent}
								wheel={wheelComponent}
							/>
						</div>
					</div>
				</div>
				<AnimatedExportDialog
					open={animatedExportDialogFormat !== null}
					format={animatedExportDialogFormat ?? "gif"}
					durationSeconds={animatedExportDurationSeconds}
					quality={animatedExportQuality}
					layout={animatedExportLayout}
					currentTimeLabel={currentTimeLabel}
					mp4Supported={canMp4Export}
					onClose={() => setAnimatedExportDialogFormat(null)}
					onDurationChange={(value) =>
						setAnimatedExportDurationSeconds(
							clampAnimatedExportDurationSeconds(value),
						)
					}
					onFormatChange={(format) =>
						setAnimatedExportDialogFormat(format)
					}
					onQualityChange={setAnimatedExportQuality}
					onLayoutChange={setAnimatedExportLayout}
					onConfirm={handleAnimatedExportConfirm}
				/>
			</div>
		</FixedEditorProvider>
	);
}
