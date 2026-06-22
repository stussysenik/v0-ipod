"use client";

import { KumaSettingsPanel } from "./kuma-settings-panel";

import {
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
	RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
	probeAnimatedMp4ExportSupport,
	type ExportProgress,
} from "@ipod/lib/export-utils";
import { TEST_SONG_SNAPSHOT } from "@ipod/lib/song-snapshots";
import { IconButton } from "@ipod/components/ui/icon-button";
import { AnimatedExportDialog } from "@ipod/components/ipod/export/animated-export-dialog";
import type { ThreeDIpodHandle } from "@ipod/components/three/three-d-ipod";
import dynamic from "next/dynamic";
const ThreeDIpod = dynamic(
	() => import("@ipod/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
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
import {
	CLASSIC_OS_MENU_ITEMS,
} from "../hooks/use-ipod-click-wheel-controls";
import { IpodDevice } from "../device/ipod-device";
import { ExportProgressOverlay, type ExportStage } from "@ipod/components/ipod/export/export-progress-overlay";
import {
	exportWorkbenchGif,
	exportWorkbenchMp4,
	exportWorkbenchPng,
	loadPersistedExportCounter,
	loadPersistedSongSnapshot,
	loadPersistedLastBattery,
	loadPersistedWorkbenchModel,
	persistWorkbenchModel,
	playClickAudio,
	savePersistedExportCounter,
	savePersistedSongSnapshot,
	saveWorkbenchSnapshot,
} from "@ipod/lib/ipod-state/effects";
import {
	createInitialIpodWorkbenchModel,
	type BatteryMode,
	type IpodHardwarePresetId,
	type IpodNowPlayingLayoutState,
	type IpodViewMode,
	type IpodOsScreen,
	type IpodInteractionModel,
	type ColorTarget,
} from "@ipod/lib/ipod-state/model";
import {
	isAsciiViewMode,
	isAuthenticInteractionModel,
	isPngExportViewMode,
	isPreviewViewMode,
} from "@ipod/lib/ipod-state/selectors";
import { clampSnapshotTime } from "@ipod/lib/ipod-state/update";
import { getIpodClassicPreset } from "@ipod/lib/ipod-classic-presets";
import { FEATURE_FLAGS } from "@ipod/lib/feature-flags";
import {
	DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	type AnimatedExportFormat,
	type AnimatedExportQuality,
	type AnimatedExportLayout,
	clampAnimatedExportDurationSeconds,
} from "@ipod/lib/export/animated-export";
import { resolveMp4ExportStrategy } from "@ipod/lib/export/mp4-support";
import { formatTimecode } from "@ipod/lib/time-utils";
import { IpodStoreContext } from "@ipod/lib/xstate/store";
import { PanelSystem } from "../panels/panel-system";
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

/**
 * Top-level authoring workbench for the iPod experience.
 */
export default function IpodClassicWorkbench() {
	const { send } = IpodStoreContext.useActorRef();
	const model = IpodStoreContext.useSelector((s) => s.context);
	
	const exportStatus = model.exportStatus;
	const exportProgressValue = model.exportProgress;
	const exportError = model.exportError;

	const [isModelHydrated, setIsModelHydrated] = useState(false);
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

	// Customization State
	const [showSettings, setShowSettings] = useState(false);
	// Saved-color history now lives in the central store (shared with the Colors panel);
	// the dock reads the same `model.savedColors` and writes via SAVE_CUSTOM_COLOR.
	const savedCaseColors = model.savedColors.case;
	const savedBgColors = model.savedColors.bg;
	const savedRingColors = model.savedColors.ring;
	const savedCenterColors = model.savedColors.center;
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
	// Portrait = a phone held upright. There the width-fit device already clears the
	// height with margin, so we lock scale to width (see previewScale) and let the
	// container scroll — immune to the constant innerHeight oscillation (URL bar,
	// soft keyboard) that otherwise violently rescaled the device.
	const isPortrait = viewportSize.height >= viewportSize.width;
	const isCompactPortrait = isCompactToolbox && isPortrait;
	const isToolboxVisible = !isCompactToolbox || isToolboxOpen;
	const activePreset = useMemo(() => getIpodClassicPreset(hardwarePreset), [hardwarePreset]);

	const containerRef = useRef<HTMLDivElement>(null);
	const exportTargetRef = useRef<HTMLDivElement>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const softNoticeTimerRef = useRef<number | null>(null);
	const toolsRef = useRef<HTMLDivElement>(null);
	const threeDIpodRef = useRef<ThreeDIpodHandle>(null);

	const setSkinColor = useCallback((nextColor: string) => {
		send({ type: "SET_SKIN_COLOR", payload: nextColor });
	}, [send]);
	const setBgColor = useCallback((nextColor: string) => {
		send({ type: "SET_BG_COLOR", payload: nextColor });
	}, [send]);
	const setRingColor = useCallback((nextColor: string) => {
		send({ type: "SET_RING_COLOR", payload: nextColor });
	}, [send]);
	const setCenterColor = useCallback((nextColor: string) => {
		send({ type: "SET_CENTER_COLOR", payload: nextColor });
	}, [send]);
	const setRangeStartTime = useCallback((nextValue: number | null) => {
		send({ type: "SET_RANGE_START_TIME", payload: nextValue });
	}, [send]);
	const setRangeEndTime = useCallback((nextValue: number | null) => {
		send({ type: "SET_RANGE_END_TIME", payload: nextValue });
	}, [send]);
	const setOsScreen = useCallback((nextScreen: IpodOsScreen) => {
		send({ type: "SET_OS_SCREEN", payload: nextScreen });
	}, [send]);
	const setOsNowPlayingLayout = useCallback((nextLayout: IpodNowPlayingLayoutState) => {
		send({ type: "SET_OS_NOW_PLAYING_LAYOUT", payload: nextLayout });
	}, [send]);
	const setOsOriginalMenuSplit = useCallback((nextSplit: number) => {
		send({ type: "SET_OS_ORIGINAL_MENU_SPLIT", payload: nextSplit });
	}, [send]);
	const setBatteryLevel = useCallback((nextLevel: number) => {
		send({ type: "SET_BATTERY_LEVEL", payload: nextLevel });
	}, [send]);
	const setBatteryMode = useCallback((nextMode: BatteryMode) => {
		send({ type: "SET_BATTERY_MODE", payload: nextMode });
	}, [send]);

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
				targetWidth: Math.max(exportTarget.offsetWidth, exportTarget.clientWidth, 1),
				targetHeight: Math.max(exportTarget.offsetHeight, exportTarget.clientHeight, 1),
			}).then((strategy) => {
				if (!cancelled) {
					setCanMp4Export(strategy !== null);
				}
			});
		}
		return () => { cancelled = true; };
	}, [hardwarePreset, viewportSize.width, viewportSize.height]);

	const saveCustomColor = useCallback(
		(target: ColorTarget, hex: string) => send({ type: "SAVE_CUSTOM_COLOR", payload: { target, hex } }),
		[send],
	);

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
		send({
			type: "RESTORE_MODEL",
			payload: loadPersistedWorkbenchModel(createInitialIpodWorkbenchModel()),
		});
		setIsModelHydrated(true);
	}, [send]);

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
			send({ type: "SET_VIEW_MODE", payload: "preview" });
		}
	}, [isModelHydrated, model.presentation.viewMode, send]);

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
			send({ type: "TICK" });
		}, 1000);
		return () => window.clearInterval(intervalId);
	}, [isPlaying, send]);

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
		if (nextStart !== rangeStartTime) setRangeStartTime(nextStart);
		if (nextEnd !== rangeEndTime) setRangeEndTime(nextEnd);
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
		send({ type: "SET_BATTERY_LEVEL", payload: lastExportedBatteryRef.current });
	}, [batteryMode, send]);

	useEffect(() => {
		if (batteryMode !== "solar") return;
		const startLevel = lastExportedBatteryRef.current;
		const interval = setInterval(() => {
			const dur = model.metadata.duration;
			if (dur <= 0) return;
			const progress = Math.min(model.metadata.currentTime / dur, 1.0);
			const SENSITIVITY = 0.05;
			const level = startLevel - (startLevel - 0.08) * progress * SENSITIVITY;
			send({ type: "SET_BATTERY_LEVEL", payload: Math.max(level, 0.08) });
		}, 10000);
		return () => clearInterval(interval);
	}, [batteryMode, model.metadata.currentTime, model.metadata.duration, send]);

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

	const formatExportId = useCallback((id: number) => {
		return String(id).padStart(EXPORT_COUNTER_PAD, "0");
	}, []);

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
		send({ type: "START_EXPORT", payload: { kind: "png" } });

		try {
			const result = await exportWorkbenchPng(exportTargetRef.current, {
				filename,
				backgroundColor: bgColor,
				onStatusChange: (status) => {
					// status handling
				},
				onProgressChange: (p) => {
					send({ type: "UPDATE_EXPORT_PROGRESS", payload: p.progress });
				},
				threeDIpodHandle: viewMode === "3d" ? threeDIpodRef.current : null,
			});

			if (result.success) {
				send({ type: "EXPORT_COMPLETE" });
				const nextCounter = exportId + 1;
				setExportCounter(nextCounter);
				savePersistedExportCounter(nextCounter);
				toast.success(`Exported image successfully`);
			} else {
				send({ type: "EXPORT_ERROR", payload: (result as any).error || "Export failed" });
			}
		} catch (error) {
			send({ type: "EXPORT_ERROR", payload: "Critical export error" });
		} finally {
			setIsExportCapturing(false);
		}
	}, [
		bgColor,
		buildExportSlug,
		exportCounter,
		exportStatus,
		formatExportId,
		canPngExport,
		playClick,
		resetInteractionChrome,
		showSoftNotice,
		send,
		viewMode
	]);

	const handleAnimatedExportConfirm = useCallback(async () => {
		if (!animatedExportDialogFormat) return;

		const kind = animatedExportDialogFormat;
		const exportId = exportCounter;
		const exportTag = formatExportId(exportId);
		const filename = `ipod-${exportTag}-${buildExportSlug()}.${kind}`;

		setAnimatedExportDialogFormat(null);
		setActiveExportKind(kind);
		setIsExportCapturing(true);
		send({ type: "START_EXPORT", payload: { kind } });

		const element = exportTargetRef.current;
		if (!element) {
			send({ type: "EXPORT_ERROR", payload: "Export target not found" });
			setIsExportCapturing(false);
			return;
		}

		try {
			const options = {
				filename,
				backgroundColor: bgColor,
				quality: animatedExportQuality,
				layout: animatedExportLayout,
				durationSeconds: animatedExportDurationSeconds,
				onStatusChange: (status: any) => {
					// status handling
				},
				onProgressChange: (p: ExportProgress) => {
					send({ type: "UPDATE_EXPORT_PROGRESS", payload: p.progress });
				},
				threeDIpodHandle: viewMode === "3d" ? threeDIpodRef.current : null,
			};

			const result =
				kind === "gif"
					? await exportWorkbenchGif(element, options)
					: await exportWorkbenchMp4(element, options);

			if (result.success) {
				send({ type: "EXPORT_COMPLETE" });
				const nextCounter = exportId + 1;
				setExportCounter(nextCounter);
				savePersistedExportCounter(nextCounter);
				toast.success(`Exported ${kind.toUpperCase()} successfully`);
			} else {
				send({ type: "EXPORT_ERROR", payload: (result as any).error || "Export failed" });
			}
		} catch (error) {
			send({
				type: "EXPORT_ERROR",
				payload: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsExportCapturing(false);
		}
	}, [
		animatedExportDialogFormat,
		animatedExportDurationSeconds,
		animatedExportLayout,
		animatedExportQuality,
		exportCounter,
		formatExportId,
		buildExportSlug,
		send,
		bgColor,
		viewMode
	]);

	const handleHardwarePresetChange = useCallback(
		(nextPreset: IpodHardwarePresetId) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			send({ type: "SET_HARDWARE_PRESET", payload: nextPreset });
		},
		[resetInteractionChrome, send],
	);

	const handleInteractionModelChange = useCallback(
		(nextModel: IpodInteractionModel) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			send({ type: "SET_INTERACTION_MODEL", payload: nextModel });
		},
		[resetInteractionChrome, send],
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
		send({ type: "RESET_MODEL" });
		showSoftNotice("Reset to defaults");
	}, [send, playClick, showSoftNotice, resetInteractionChrome]);

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
			send({ type: "APPLY_SONG_SNAPSHOT", payload: persisted });
			savePersistedSongSnapshot(persisted);
			lastExportedBatteryRef.current = persisted.ui.batteryLevel;
			setShowSettings(false);
			showSoftNotice("Snapshot loaded");
			return;
		}

		send({ type: "APPLY_SONG_SNAPSHOT", payload: TEST_SONG_SNAPSHOT });
		savePersistedSongSnapshot(TEST_SONG_SNAPSHOT);
		lastExportedBatteryRef.current = TEST_SONG_SNAPSHOT.ui.batteryLevel;
		setShowSettings(false);
		showSoftNotice("Loaded sample snapshot");
	}, [send, playClick, showSoftNotice, resetInteractionChrome]);

	const handleViewModeChange = useCallback(
		(nextMode: IpodViewMode) => {
			resetInteractionChrome({
				closeSettings: true,
				closeEditor: true,
				closeToolbox: true,
				clearNotice: true,
			});
			if (nextMode === "preview") {
				send({ type: "SET_OS_SCREEN", payload: "now-playing" });
			}
			send({ type: "SET_VIEW_MODE", payload: nextMode });
		},
		[resetInteractionChrome, send],
	);

	const handleToggleToolbox = useCallback(() => {
		clearSoftNotice();
		setIsToolboxOpen((prev) => {
			const next = !prev;
			if (!next) setShowSettings(false);
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
		if (isExportCapturing || viewportSize.width === 0 || viewportSize.height === 0) return 1;
		const isSmall = viewportSize.width < 640;
		const isMedium = viewportSize.width < 1024;
		const horizontalReserve = isSmall ? 32 : isMedium ? 56 : 80;
		const verticalReserve = isCompactToolbox ? 144 : 48;
		const availableWidth = Math.max(viewportSize.width - horizontalReserve, 240);
		const availableHeight = Math.max(viewportSize.height - verticalReserve, 280);
		const widthScale = Math.min(availableWidth / frameWidth, 1);
		// Portrait phone: lock to width so a changing innerHeight (URL bar / keyboard)
		// can't rescale the device. The container scrolls if it runs past the viewport.
		// Focus keeps fit-to-both below since it intentionally zooms.
		if (isCompactPortrait && viewMode !== "focus") {
			return widthScale;
		}
		const fitScale = Math.min(availableWidth / frameWidth, availableHeight / frameHeight, 1);
		if (viewMode === "focus") {
			const maxScale = Math.min(availableWidth / frameWidth, availableHeight / frameHeight, 1.28);
			return Math.min(maxScale, fitScale * 1.3);
		}
		return fitScale;
	}, [isCompactPortrait, isCompactToolbox, isExportCapturing, viewportSize, viewMode, frameWidth, frameHeight]);

	const scaledFrameWidth = Math.round(frameWidth * previewScale);
	const scaledFrameHeight = Math.round(frameHeight * previewScale);
	const pngBusy = activeExportKind === "png" && exportStatus !== "idle";
	const gifBusy = activeExportKind === "gif" && exportStatus !== "idle";
	const mp4Busy = activeExportKind === "mp4" && exportStatus !== "idle";
	
	const toolboxDockClass = isCompactToolbox
		? "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
		: "fixed top-6 right-6";
	const toolboxPanelClass = isCompactToolbox
		? `absolute right-0 bottom-14 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-7rem-var(--safe-inset-top)-var(--safe-inset-bottom))] overflow-y-auto overscroll-contain flex flex-col gap-3 rounded-2xl border border-[#D0D4DA] bg-[#E7E7E3]/95 p-2 shadow-[0_16px_34px_rgba(0,0,0,0.2)] transition-opacity duration-300 ${isToolboxVisible ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`
		: "flex flex-col gap-3";

	const screenComponent = isAsciiView ? (
		<IpodAsciiScene state={state} />
	) : (
		<IpodScreen
			preset={activePreset}
			skinColor={skinColor}
			state={state}
			dispatch={send}
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
		<IpodClickWheel
			preset={activePreset}
			skinColor={skinColor}
			ringColor={ringColor || undefined}
			centerColor={centerColor || undefined}
			playClick={playClick}
			onSeek={(delta: number) => {
				if (osScreen === "menu") {
					send({
						type: "CYCLE_OS_MENU",
						payload: { direction: delta, total: CLASSIC_OS_MENU_ITEMS.length },
					});
					playClick();
					return;
				}
				const step = 2;
				const nextTime = Math.max(0, Math.min(state.duration, state.currentTime + delta * step));
				if (Math.floor(nextTime) !== Math.floor(state.currentTime)) {
					send({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
					if (Math.abs(delta) > 0.5) playClick();
				}
			}}
			onCenterClick={
				osScreen === "menu"
					? () => {
							const activeItem = CLASSIC_OS_MENU_ITEMS[osMenuIndex];
							if (!activeItem) return;
							switch (activeItem.id) {
								case "music":
								case "now-playing":
								case "shuffle-songs":
									setOsScreen("now-playing");
									return;
								case "settings":
									if (isCompactToolbox) setIsToolboxOpen(true);
									setShowSettings(true);
									return;
								default:
									showSoftNotice(`${activeItem.label} is queued for the fuller OS pass`);
							}
						}
					: () => {
							send({ type: "TOGGLE_IS_PLAYING" });
							playClick();
							showSoftNotice(!isPlaying ? "Playing" : "Paused");
						}
			}
			onMenuPress={() => {
				if (!isAuthenticInteraction) {
					setOsScreen(osScreen === "menu" ? "now-playing" : "menu");
					return;
				}
				send({ type: "SET_OS_NOW_PLAYING_EDITABLE", payload: false });
				setOsScreen("menu");
			}}
			onPreviousPress={() => {
				if (osScreen === "menu") {
					send({ type: "CYCLE_OS_MENU", payload: { direction: -1, total: CLASSIC_OS_MENU_ITEMS.length } });
					playClick();
					return;
				}
				const nextTime = Math.max(0, state.currentTime - 15);
				send({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
				playClick();
			}}
			onNextPress={() => {
				if (osScreen === "menu") {
					send({ type: "CYCLE_OS_MENU", payload: { direction: 1, total: CLASSIC_OS_MENU_ITEMS.length } });
					playClick();
					return;
				}
				const nextTime = Math.min(state.duration, state.currentTime + 15);
				send({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
				playClick();
			}}
			onPlayPausePress={() => {
				if (osScreen === "menu") {
					setOsScreen("now-playing");
					return;
				}
				send({ type: "TOGGLE_IS_PLAYING" });
				playClick();
				showSoftNotice(!isPlaying ? "Playing" : "Paused");
			}}
			disabled={
				isExportCapturing ||
				isAsciiView ||
				(osScreen !== "menu" && !isFlatView && !isFocusView && !isAuthenticInteraction)
			}
			exportSafe={isExportCapturing}
		/>
	);

	return (
		<FixedEditorProvider resetKey={editorResetKey}>
			<div
				ref={containerRef}
				className={`relative min-h-dvh w-full flex flex-col items-center transition-colors duration-500 ${
					isCompactPortrait
						? "justify-start overflow-y-auto overscroll-contain"
						: "justify-center overflow-hidden"
				}`}
				style={{
					backgroundColor: bgColor,
					paddingTop: `max(0.75rem, var(--safe-inset-top))`,
					paddingBottom: `max(0.75rem, var(--safe-inset-bottom))`,
					paddingLeft: `max(0.75rem, var(--safe-inset-left))`,
					paddingRight: `max(0.75rem, var(--safe-inset-right))`,
				}}
			>
				<audio ref={audioRef} src="/click.mp3" preload="auto" />

				<div
					ref={toolsRef}
					className={`${toolboxDockClass} z-50 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-top-4 duration-700 ${exportStatus !== "idle" ? "opacity-0 pointer-events-none" : ""}`}
				>
					{isCompactToolbox && (
						<IconButton
							icon={<Menu className="w-5 h-5" />}
							label={isToolboxVisible ? "Hide Toolbox" : "Toolbox"}
							onClick={handleToggleToolbox}
							isActive={isToolboxVisible}
							className="w-12 h-12 border border-[#D0D4DA] bg-[#F2F2F0]/95 text-black backdrop-blur-sm"
						/>
					)}

					<div className={toolboxPanelClass}>
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

						<div className="flex flex-col gap-2 p-2 bg-[#E7E7E3]/80 backdrop-blur-sm rounded-xl border border-[#D0D4DA] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
							<IconButton
								icon={<Smartphone className="w-5 h-5" />}
								label="Flat"
								data-testid="flat-button"
								isActive={viewMode === "flat"}
								onClick={() => handleViewModeChange("flat")}
							/>
							<IconButton
								icon={<Eye className="w-5 h-5" />}
								label="Preview"
								data-testid="preview-button"
								isActive={viewMode === "preview"}
								onClick={() => handleViewModeChange("preview")}
							/>
							{FEATURE_FLAGS.SHOW_3D_VIEW_MODE && (
								<IconButton
									icon={<Box className="w-5 h-5" />}
									label="3D Experience"
									badge="WIP"
									data-testid="3d-button"
									isActive={viewMode === "3d"}
									onClick={() => handleViewModeChange("3d")}
								/>
							)}
							{FEATURE_FLAGS.SHOW_FOCUS_VIEW_MODE && (
								<IconButton
									icon={<Monitor className="w-5 h-5" />}
									label="Focus Mode"
									data-testid="focus-button"
									isActive={viewMode === "focus"}
									onClick={() => handleViewModeChange("focus")}
								/>
							)}
							{FEATURE_FLAGS.SHOW_ASCII_VIEW_MODE && (
								<IconButton
									icon={<Terminal className="w-5 h-5" />}
									label="ASCII Mode"
									badge="WIP"
									data-testid="ascii-button"
									isActive={viewMode === "ascii"}
									onClick={() => handleViewModeChange("ascii")}
								/>
							)}
							<IconButton
								icon={isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
								label={isPlaying ? "Pause" : "Play"}
								data-testid="play-pause-button"
								onClick={() => {
									playClick();
									send({ type: "TOGGLE_IS_PLAYING" });
								}}
								className={isPlaying ? "bg-blue-100 text-blue-600 border-blue-200" : ""}
							/>
							<IconButton
								icon={<RotateCcw className="w-5 h-5" />}
								label="Reset Defaults"
								data-testid="reset-button"
								onClick={handleResetModel}
								className="text-red-500 hover:text-red-600 border-red-100"
							/>
						</div>

						<IconButton
							icon={activeExportKind === "png" && exportStatus === "success" ? <Check className="w-5 h-5" /> : pngBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share className="w-5 h-5" />}
							label={!canPngExport ? "Flat/Focus for PNG" : "Export PNG"}
							data-testid="png-export-button"
							onClick={handlePngExport}
							contrast
							disabled={!canPngExport || exportStatus !== "idle"}
							className={activeExportKind === "png" && exportStatus === "success" ? "bg-green-500" : pngBusy ? "bg-blue-500" : ""}
						/>
						<IconButton
							icon={activeExportKind === "gif" && exportStatus === "success" ? <Check className="w-5 h-5" /> : gifBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
							label="Export GIF"
							data-testid="gif-export-button"
							onClick={() => {
								if (!isPreviewView && !isAsciiView) {
									handleViewModeChange("preview");
									setTimeout(() => setAnimatedExportDialogFormat("gif"), 100);
									return;
								}
								playClick();
								setAnimatedExportDialogFormat("gif");
							}}
							contrast
							disabled={exportStatus !== "idle"}
							className={activeExportKind === "gif" && exportStatus === "success" ? "bg-green-500" : gifBusy ? "bg-blue-500" : ""}
						/>
						<IconButton
							icon={activeExportKind === "mp4" && exportStatus === "success" ? <Check className="w-5 h-5" /> : mp4Busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
							label={!canMp4Export ? "MP4 Not Supported" : "Export MP4"}
							data-testid="mp4-export-button"
							onClick={() => {
								if (!canMp4Export) {
									playClick();
									showSoftNotice("Needs newer browser");
									return;
								}
								if (!isPreviewView && !isAsciiView) {
									handleViewModeChange("preview");
									setTimeout(() => setAnimatedExportDialogFormat("mp4"), 100);
									return;
								}
								playClick();
								setAnimatedExportDialogFormat("mp4");
							}}
							contrast
							disabled={!canMp4Export || exportStatus !== "idle"}
							className={activeExportKind === "mp4" && exportStatus === "success" ? "bg-green-500" : mp4Busy ? "bg-blue-500" : ""}
						/>
					</div>
				</div>

				{softNotice && exportStatus === "idle" && (
					<div
						className="fixed z-50 rounded-full border border-black/10 bg-white/72 px-3 py-1 text-[11px] font-medium text-black/65 shadow-[0_8px_18px_rgba(0,0,0,0.1)] backdrop-blur-sm"
						style={{
							right: `calc(1.5rem + var(--safe-inset-right))`,
							bottom: `calc(1.5rem + var(--safe-inset-bottom))`,
						}}
					>
						{softNotice}
					</div>
				)}

				<ExportProgressOverlay
					stage={exportStatus as ExportStage}
					progress={exportProgressValue}
					error={exportError}
					filename={activeExportKind ? `${state.title}.${activeExportKind}` : undefined}
					onClose={() => send({ type: "RESET_EXPORT" })}
				/>

				<div
					className={`relative my-auto overflow-hidden transition-opacity duration-700 ${viewMode !== "3d" ? "opacity-100" : "opacity-0 pointer-events-none absolute"}`}
					style={{
						width: `${scaledFrameWidth}px`,
						height: `${scaledFrameHeight}px`,
						maxWidth: `calc(100vw - var(--safe-inset-left) - var(--safe-inset-right) - 1.5rem)`,
						// Portrait phones are width-locked and scroll vertically, so the
						// device must render at full height (no clamp) or its ends clip.
						maxHeight: isCompactPortrait
							? undefined
							: `calc(100dvh - var(--safe-inset-top) - var(--safe-inset-bottom) - 1.5rem)`,
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
							className="p-8 sm:p-10 md:p-12"
							style={{ backgroundColor: isExportCapturing ? bgColor : "transparent" }}
						>
							<IpodDevice
								preset={activePreset}
								skinColor={skinColor}
								exportSafe={isExportCapturing}
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
					onDurationChange={(value) => setAnimatedExportDurationSeconds(clampAnimatedExportDurationSeconds(value))}
					onFormatChange={(f) => setAnimatedExportDialogFormat(f)}
					onQualityChange={setAnimatedExportQuality}
					onLayoutChange={setAnimatedExportLayout}
					onConfirm={handleAnimatedExportConfirm}
				/>

				{viewMode === "3d" && (
					<ThreeDIpod
						ref={threeDIpodRef}
						preset={activePreset}
						skinColor={skinColor}
						ringColor={ringColor || undefined}
						centerColor={centerColor || undefined}
						screen={screenComponent}
						wheel={wheelComponent}
					/>
				)}

				{/* Floating tool panels + ⌘K palette (spec: floating-panel-system,
				    command-palette). Panels default hidden, summoned from the palette. */}
				<PanelSystem />
			</div>
		</FixedEditorProvider>
	);
}
