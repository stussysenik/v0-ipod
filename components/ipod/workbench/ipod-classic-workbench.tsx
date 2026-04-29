"use client";

import { useReducer, useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  Settings,
  Box,
  Share,
  Monitor,
  Smartphone,
  Check,
  Loader2,
  Menu,
  Pipette,
  Film,
  Eye,
  Terminal,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import type { ExportStatus } from "@/lib/export-utils";
import { TEST_SONG_SNAPSHOT } from "@/lib/song-snapshots";
import { IconButton } from "@/components/ui/icon-button";
import dynamic from "next/dynamic";
const ThreeDIpod = dynamic(
  () =>
    import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
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
import { GreyPalettePicker } from "../editors/grey-palette-picker";
import { HexColorInput } from "../editors/hex-color-input";
import {
  BG_CUSTOM_COLORS_KEY,
  CASE_CUSTOM_COLORS_KEY,
  exportWorkbenchGif,
  exportWorkbenchPng,
  loadCustomColors,
  loadPersistedExportCounter,
  loadPersistedSongSnapshot,
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
  type IpodInteractionModel,
  type IpodHardwarePresetId,
  type IpodNowPlayingLayoutState,
  type IpodOsScreen,
  type IpodViewMode,
  type SnapshotSelectionKind,
} from "@/lib/ipod-state/model";
import {
  isAsciiViewMode,
  isAuthenticInteractionModel,
  isPngExportViewMode,
  isPreviewViewMode,
} from "@/lib/ipod-state/selectors";
import { clampSnapshotTime, ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import {
  AUTHENTIC_CASE_COLORS,
  BACKGROUND_OKLCH_CONFIG,
  CASE_OKLCH_CONFIG,
} from "@/lib/color-manifest";
import { IPOD_CLASSIC_PRESETS, getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { formatTimecode, parseTimecode } from "@/lib/time-utils";

const MAX_CUSTOM_COLORS = 6;
const OKLCH_CASE_L = CASE_OKLCH_CONFIG.lightness;
const OKLCH_CASE_C = CASE_OKLCH_CONFIG.chroma;
const OKLCH_BG_L = BACKGROUND_OKLCH_CONFIG.lightness;
const OKLCH_BG_C = BACKGROUND_OKLCH_CONFIG.chroma;
const OKLCH_CASE_STEPS = CASE_OKLCH_CONFIG.steps;
const OKLCH_BG_STEPS = BACKGROUND_OKLCH_CONFIG.steps;
const SHELL_PADDING = 48;
const EXPORT_COUNTER_PAD = 4;
type ExportKind = "png" | "gif";

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
const LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS =
  "rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors border-[#111827] bg-white/90 text-[#111827]";
const LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS =
  "rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors border-[#C8CDD3] bg-white/65 text-[#6B7280] hover:bg-white/80";

function getLockedInteractionModeButtonClass(
  isActive: boolean,
  extraClassName?: string,
): string {
  return [
    extraClassName,
    isActive
      ? LOCKED_INTERACTION_MODE_BUTTON_ACTIVE_CLASS
      : LOCKED_INTERACTION_MODE_BUTTON_INACTIVE_CLASS,
  ]
    .filter(Boolean)
    .join(" ");
}

const supportsOklch = () =>
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("color", "oklch(0.7 0.1 20)");

const oklchToHex = (lightness: number, chroma: number, hue: number) => {
  if (typeof document === "undefined") return null;
  const swatch = document.createElement("div");
  swatch.style.color = `oklch(${lightness} ${chroma} ${hue})`;
  swatch.style.display = "none";
  document.body.appendChild(swatch);
  const computed = getComputedStyle(swatch).color;
  document.body.removeChild(swatch);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  const [r, g, b] = match.slice(1, 4).map((value) => Number(value));
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
};

const buildOklchPalette = (
  steps: number,
  lightness: number,
  chroma: number,
  offset = 0,
) =>
  Array.from({ length: steps }, (_, index) => {
    const hue = Math.round(((index / steps) * 360 + offset) % 360);
    return {
      label: `OKLCH ${hue}°`,
      value: `oklch(${lightness} ${chroma} ${hue})`,
      hue,
    };
  });

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

  // Customization State
  const [showSettings, setShowSettings] = useState(false);
  const [savedCaseColors, setSavedCaseColors] = useState<string[]>([]);
  const [savedBgColors, setSavedBgColors] = useState<string[]>([]);
  const [isExportCapturing, setIsExportCapturing] = useState(false);
  const [titleCanMarquee, setTitleCanMarquee] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [exportCounter, setExportCounter] = useState(0);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  const [oklchReady, setOklchReady] = useState(false);
  const [oklchCasePalette, setOklchCasePalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
  const [oklchBgPalette, setOklchBgPalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
  const [rangeStartDraft, setRangeStartDraft] = useState("");
  const [rangeEndDraft, setRangeEndDraft] = useState("");
  const state = model.metadata;
  const selectionKind = model.playback.selectionKind;
  const rangeStartTime = model.playback.rangeStartTime;
  const rangeEndTime = model.playback.rangeEndTime;
  const viewMode = model.presentation.viewMode;
  const hardwarePreset = model.presentation.hardwarePreset;
  const skinColor = model.presentation.skinColor;
  const bgColor = model.presentation.bgColor;
  const interactionModel = model.interaction.interactionModel;
  const isPlaying = model.interaction.isPlaying;
  const osScreen = model.interaction.osScreen;
  const osMenuIndex = model.interaction.menuIndex;
  const osOriginalMenuSplit = model.interaction.osOriginalMenuSplit;
  const osNowPlayingLayout = model.interaction.osNowPlayingLayout;
  const isOsNowPlayingEditable = model.interaction.isNowPlayingEditable;
  const isFlatView = viewMode === "flat";
  const isFocusView = viewMode === "focus";
  const isPreviewView = isPreviewViewMode(viewMode);
  const isAsciiView = isAsciiViewMode(viewMode);
  const canPngExport = isPngExportViewMode(viewMode);
  const isAuthenticInteraction = isAuthenticInteractionModel(interactionModel);
  const isCompactToolbox = viewportSize.width > 0 && viewportSize.width < 768;
  const isToolboxVisible = !isCompactToolbox || isToolboxOpen;
  const activePreset = useMemo(
    () => getIpodClassicPreset(hardwarePreset),
    [hardwarePreset],
  );

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

  useEffect(() => {
    setHasEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    setOklchReady(supportsOklch());
  }, []);

  useEffect(() => {
    if (!oklchReady) return;
    setOklchCasePalette(buildOklchPalette(OKLCH_CASE_STEPS, OKLCH_CASE_L, OKLCH_CASE_C));
    setOklchBgPalette(buildOklchPalette(OKLCH_BG_STEPS, OKLCH_BG_L, OKLCH_BG_C, 180));
  }, [oklchReady]);

  useEffect(() => {
    setSavedCaseColors(loadCustomColors(CASE_CUSTOM_COLORS_KEY));
    setSavedBgColors(loadCustomColors(BG_CUSTOM_COLORS_KEY));
  }, []);

  const saveCustomColor = useCallback((target: "case" | "bg", hex: string) => {
    const key = target === "case" ? CASE_CUSTOM_COLORS_KEY : BG_CUSTOM_COLORS_KEY;
    const current = loadCustomColors(key);
    const next = [hex, ...current.filter((c) => c !== hex)].slice(0, MAX_CUSTOM_COLORS);
    persistCustomColors(key, next);
    if (target === "case") setSavedCaseColors(next);
    else setSavedBgColors(next);
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

  useEffect(() => {
    setRangeStartDraft(selectionKind === "range" ? formatTimecode(rangeStartTime) : "");
  }, [selectionKind, rangeStartTime]);

  useEffect(() => {
    setRangeEndDraft(selectionKind === "range" ? formatTimecode(rangeEndTime) : "");
  }, [selectionKind, rangeEndTime]);

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

  const formatExportId = useCallback((id: number) => {
    return String(id).padStart(EXPORT_COUNTER_PAD, "0");
  }, []);

  const resetExportUi = useCallback(() => {
    setIsExportCapturing(false);
    setActiveExportKind(null);
    setExportStatus("idle");
  }, []);

  const completeSuccessfulExport = useCallback(
    (id: number, label: string) => {
      const nextCounter = id + 1;
      setExportCounter(nextCounter);
      savePersistedExportCounter(nextCounter);
      showSoftNotice(`${label} Exported`);
      setExportStatus("success");
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

    try {
      console.info("[png-export] starting capture", { filename });
      const result = await exportWorkbenchPng(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        onStatusChange: setExportStatus,
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
  ]);

  useEffect(() => {
    handlePngExportRef.current = handlePngExport;
  }, [handlePngExport]);

  const handleGifExportRef = useRef<(() => void) | null>(null);

  const handleGifExport = useCallback(async () => {
    if (exportStatus !== "idle") return;
    resetInteractionChrome({
      closeSettings: true,
      closeEditor: true,
      closeToolbox: true,
      clearNotice: true,
    });
    if (!isPreviewView && !isAsciiView) {
      playClick();
      showSoftNotice("Switch to Preview or ASCII for GIF");
      return;
    }
    playClick();
    if (!exportTargetRef.current) return;

    const exportId = exportCounter;
    const exportTag = formatExportId(exportId);
    const filename = `ipod-${exportTag}-${buildExportSlug()}.gif`;

    setActiveExportKind("gif");
    setIsExportCapturing(true);

    try {
      console.info("[gif-export] starting preview export", { filename });
      const result = await exportWorkbenchGif(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        onStatusChange: setExportStatus,
      });
      console.info("[gif-export] finished", result);

      if (result.success) {
        completeSuccessfulExport(exportId, `Animated #${exportTag}`);
      } else {
        toast.error("GIF export failed", {
          description: result.error,
          action: {
            label: "Retry",
            onClick: () => handleGifExportRef.current?.(),
          },
        });
        resetExportUi();
      }
    } catch (error) {
      console.error("[gif-export] critical failure", error);
      toast.error("Critical GIF export error");
      resetExportUi();
    }
  }, [
    bgColor,
    buildExportSlug,
    completeSuccessfulExport,
    exportCounter,
    exportStatus,
    formatExportId,
    isPreviewView,
    isAsciiView,
    playClick,
    resetExportUi,
    resetInteractionChrome,
    showSoftNotice,
  ]);

  useEffect(() => {
    handleGifExportRef.current = handleGifExport;
  }, [handleGifExport]);

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

  const handleSelectionKindChange = useCallback((nextKind: SnapshotSelectionKind) => {
    dispatch({ type: "SET_SELECTION_KIND", payload: nextKind });
  }, []);

  const commitRangeInput = useCallback(
    (target: "start" | "end", raw: string) => {
      const seconds = parseTimecode(raw);
      if (seconds === null) {
        if (target === "start") setRangeStartDraft(formatTimecode(rangeStartTime));
        else setRangeEndDraft(formatTimecode(rangeEndTime));
        return;
      }

      if (target === "start") setRangeStartTime(seconds);
      else setRangeEndTime(seconds);
    },
    [rangeStartTime, rangeEndTime, setRangeStartTime, setRangeEndTime],
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
      if (isAuthenticInteraction && osScreen === "menu") {
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
      isAuthenticInteraction,
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

  const openEyeDropper = useCallback(
    async (target: "case" | "bg") => {
      if (!hasEyeDropper) return;
      try {
        // @ts-expect-error - EyeDropper is a new experimental API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const hex = result.sRGBHex.toUpperCase();
        if (target === "case") setSkinColor(hex);
        else setBgColor(hex);
        saveCustomColor(target, hex);
      } catch (e) {
        console.warn("EyeDropper failed or cancelled", e);
      }
    },
    [hasEyeDropper, saveCustomColor, setBgColor, setSkinColor],
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
        showSoftNotice(`${activeItem.label} is queued for the fuller OS pass`);
    }
  }, [isCompactToolbox, osMenuIndex, showSoftNotice, setOsScreen]);

  const handleNowPlayingCenterClick = useCallback(() => {
    dispatch({ type: "TOGGLE_OS_NOW_PLAYING_EDITABLE" });
  }, []);

  const handleMenuButtonPress = useCallback(() => {
    if (!isAuthenticInteraction) return;
    dispatch({ type: "SET_OS_NOW_PLAYING_EDITABLE", payload: false });
    setOsScreen("menu");
  }, [isAuthenticInteraction, setOsScreen]);

  const handlePreviousButtonPress = useCallback(() => {
    if (isAuthenticInteraction && osScreen === "menu") {
      cycleOsMenu(-1);
      return;
    }
    handleSeek(-1);
  }, [cycleOsMenu, handleSeek, isAuthenticInteraction, osScreen]);

  const handleNextButtonPress = useCallback(() => {
    if (isAuthenticInteraction && osScreen === "menu") {
      cycleOsMenu(1);
      return;
    }
    handleSeek(1);
  }, [cycleOsMenu, handleSeek, isAuthenticInteraction, osScreen]);

  const handlePlayPauseButtonPress = useCallback(() => {
    if (isAuthenticInteraction && osScreen === "menu") {
      setOsScreen("now-playing");
      return;
    }

    dispatch({ type: "TOGGLE_IS_PLAYING" });
    playClick();

    const nextIsPlaying = !isPlaying;
    showSoftNotice(nextIsPlaying ? "Playing" : "Paused");
  }, [
    isAuthenticInteraction,
    osScreen,
    isPlaying,
    playClick,
    showSoftNotice,
    setOsScreen,
  ]);

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
      isEditable={
        !isExportCapturing &&
        (isAuthenticInteraction
          ? isOsNowPlayingEditable && osScreen === "now-playing"
          : isFlatView)
      }
      exportSafe={isExportCapturing}
      titlePreview={isPreviewView || isPlaying}
      animateText={isPlaying}
      titleCaptureReady={isPreviewView || activeExportKind === "gif"}
      onTitleOverflowChange={setTitleCanMarquee}
    />
  );

  const wheelComponent = (
    // The click wheel is treated as a hardware control assembly, even though
    // the handlers ultimately mutate workbench state.
    <IpodClickWheel
      preset={activePreset}
      skinColor={skinColor}
      playClick={playClick}
      onSeek={handleWheelSeek}
      onCenterClick={
        isAuthenticInteraction
          ? osScreen === "menu"
            ? handleOsMenuSelect
            : handleNowPlayingCenterClick
          : undefined
      }
      onMenuPress={handleMenuButtonPress}
      onPreviousPress={handlePreviousButtonPress}
      onNextPress={handleNextButtonPress}
      onPlayPausePress={handlePlayPauseButtonPress}
      disabled={
        isExportCapturing ||
        isAsciiView ||
        (!isFlatView && !isFocusView && !isAuthenticInteraction)
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
    showSoftNotice("Snapshot saved");
  }, [model, playClick, showSoftNotice, resetInteractionChrome]);

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
      setShowSettings(false);
      showSoftNotice("Snapshot loaded");
      return;
    }

    dispatch({ type: "APPLY_SONG_SNAPSHOT", payload: TEST_SONG_SNAPSHOT });
    savePersistedSongSnapshot(TEST_SONG_SNAPSHOT);
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

    const horizontalReserve = viewportSize.width >= 768 ? 112 : 24;
    const verticalReserve = isCompactToolbox ? 128 : 32;
    const availableWidth = Math.max(viewportSize.width - horizontalReserve, 260);
    const availableHeight = Math.max(viewportSize.height - verticalReserve, 320);
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

  const scaledFrameWidth = frameWidth * previewScale;
  const scaledFrameHeight = frameHeight * previewScale;
  const pngBusy = activeExportKind === "png" && exportStatus !== "idle";
  const gifBusy = activeExportKind === "gif" && exportStatus !== "idle";
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
        className="min-h-[100dvh] w-full flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto px-4 pt-4 pb-24 transition-colors duration-500 sm:justify-center sm:p-6"
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
              label={isToolboxVisible ? "Hide Toolbox" : "Toolbox"}
              data-testid="toolbox-toggle-button"
              onClick={handleToggleToolbox}
              isActive={isToolboxVisible}
              className="w-12 h-12 border border-[#D0D4DA] bg-[#F2F2F0]/95 text-black backdrop-blur-sm"
            />
          )}

          <div data-testid="toolbox-panel" className={toolboxPanelClass}>
            {/* Settings / Theme */}
            <div className="relative group">
              <IconButton
                icon={<Settings className="w-5 h-5" />}
                label="Theme"
                data-testid="theme-button"
                onClick={handleToggleSettings}
                isActive={showSettings}
              />

              {showSettings && (
                <div
                  data-testid="theme-panel"
                  className={`z-20 overflow-y-auto overscroll-contain rounded-[20px] border border-[#D6D8DC] bg-[#F0F0EC]/96 p-4 shadow-[0_18px_34px_rgba(0,0,0,0.16)] backdrop-blur-md animate-in ${
                    isCompactToolbox
                      ? "slide-in-from-bottom-2 fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] max-h-[min(52dvh,24rem)] rounded-2xl"
                      : "slide-in-from-right-2 absolute top-0 right-14 w-[292px] max-h-[min(74dvh,40rem)]"
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-2 px-1">
                      Revision Attempt
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {IPOD_CLASSIC_PRESETS.map((presetOption) => (
                        <button
                          key={presetOption.id}
                          type="button"
                          data-testid={`hardware-preset-${presetOption.id}-button`}
                          aria-pressed={hardwarePreset === presetOption.id}
                          onClick={() => handleHardwarePresetChange(presetOption.id)}
                          className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                            hardwarePreset === presetOption.id
                              ? "border-[#111827] bg-white/90 shadow-[inset_0_0_0_1px_rgba(17,24,39,0.08)]"
                              : "border-[#C8CDD3] bg-white/65 hover:bg-white/80"
                          }`}
                        >
                          <div className="text-[11px] font-semibold text-[#111827]">
                            {presetOption.label}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#6B7280]">
                            {presetOption.notes}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-2 px-1">
                      Interaction
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="interaction-mode-direct-button"
                        aria-pressed={interactionModel === "direct"}
                        onClick={() => handleInteractionModelChange("direct")}
                        className={getLockedInteractionModeButtonClass(
                          interactionModel === "direct",
                        )}
                      >
                        Direct Edit
                      </button>
                      <button
                        type="button"
                        data-testid="interaction-mode-ipod-os-button"
                        aria-pressed={interactionModel === "ipod-os"}
                        onClick={() => handleInteractionModelChange("ipod-os")}
                        className={getLockedInteractionModeButtonClass(
                          interactionModel === "ipod-os",
                        )}
                      >
                        iPod OS
                      </button>
                      <button
                        type="button"
                        data-testid="interaction-mode-ipod-os-original-button"
                        aria-pressed={interactionModel === "ipod-os-original"}
                        onClick={() => handleInteractionModelChange("ipod-os-original")}
                        className={getLockedInteractionModeButtonClass(
                          interactionModel === "ipod-os-original",
                          "col-span-2",
                        )}
                      >
                        iPod OS Original
                      </button>
                    </div>
                    {interactionModel === "ipod-os-original" ? (
                      <p className="mt-2 px-1 text-[10px] leading-[1.35] text-[#6B7280]">
                        Mirrors the standard iPod OS layout.
                      </p>
                    ) : null}
                  </div>

                  <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-3 px-1">
                    Case Color
                  </h3>
                  <div className="mb-4">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Authentic Apple Releases
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                      {AUTHENTIC_CASE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setSkinColor(c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border transition-transform hover:scale-105 ${
                            skinColor === c.value
                              ? "border-[#111827] scale-105 ring-2 ring-[#CDD1D6]"
                              : "border-[#B5BBC3]"
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <GreyPalettePicker
                    target="case"
                    currentColor={skinColor}
                    onColorSelect={setSkinColor}
                    onColorCommit={(hex) => saveCustomColor("case", hex)}
                    oklchToHex={oklchToHex}
                    oklchReady={oklchReady}
                  />
                  {oklchReady && oklchCasePalette.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        OKLCH Spectrum
                      </h4>
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                        {oklchCasePalette.map((swatch) => (
                          <button
                            key={swatch.hue}
                            onClick={() => {
                              const hex = oklchToHex(
                                OKLCH_CASE_L,
                                OKLCH_CASE_C,
                                swatch.hue,
                              );
                              if (!hex) return;
                              setSkinColor(hex);
                              saveCustomColor("case", hex);
                            }}
                            title={swatch.label}
                            className="w-8 h-8 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {savedCaseColors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        Recent Custom
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {savedCaseColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSkinColor(color)}
                            title={`Custom ${color}`}
                            className={`w-7 h-7 rounded-full border ${
                              skinColor === color
                                ? "border-[#111827] ring-2 ring-[#CDD1D6]"
                                : "border-[#B5BBC3]"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!oklchReady && (
                    <p className="mb-4 px-1 text-[10px] text-[#6B7280]">
                      OKLCH palettes need a modern browser. Use the custom picker for full
                      compatibility.
                    </p>
                  )}
                  <div className="flex items-end gap-1 mb-4">
                    <HexColorInput
                      value={skinColor}
                      onChange={(color) => {
                        setSkinColor(color);
                        saveCustomColor("case", color);
                      }}
                    />
                    {hasEyeDropper && (
                      <button
                        type="button"
                        onClick={() => openEyeDropper("case")}
                        className="p-1 rounded hover:bg-black/5 text-[#6B7280] hover:text-[#111827] transition-colors"
                        title="Pick color from screen"
                        aria-label="Pick case color from screen"
                      >
                        <Pipette className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-3 px-1">
                    Background
                  </h3>
                  <GreyPalettePicker
                    target="bg"
                    currentColor={bgColor}
                    onColorSelect={setBgColor}
                    onColorCommit={(hex) => saveCustomColor("bg", hex)}
                    oklchToHex={oklchToHex}
                    oklchReady={oklchReady}
                  />
                  {oklchReady && oklchBgPalette.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        OKLCH Ambient
                      </h4>
                      <div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
                        {oklchBgPalette.map((swatch) => (
                          <button
                            key={swatch.hue}
                            onClick={() => {
                              const hex = oklchToHex(OKLCH_BG_L, OKLCH_BG_C, swatch.hue);
                              if (!hex) return;
                              setBgColor(hex);
                              saveCustomColor("bg", hex);
                            }}
                            title={swatch.label}
                            className="w-6 h-6 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {savedBgColors.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        Recent Custom
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {savedBgColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setBgColor(color)}
                            title={`Custom ${color}`}
                            className={`w-6 h-6 rounded-full border ${
                              bgColor === color
                                ? "border-[#111827] ring-2 ring-[#CDD1D6]"
                                : "border-[#B5BBC3]"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-1">
                    <HexColorInput
                      value={bgColor}
                      onChange={(color) => {
                        setBgColor(color);
                        saveCustomColor("bg", color);
                      }}
                    />
                    {hasEyeDropper && (
                      <button
                        type="button"
                        onClick={() => openEyeDropper("bg")}
                        className="p-1 rounded hover:bg-black/5 text-[#6B7280] hover:text-[#111827] transition-colors"
                        title="Pick color from screen"
                        aria-label="Pick background color from screen"
                      >
                        <Pipette className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D5D7DA]">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Snapshot
                    </h4>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="snapshot-selection-moment-button"
                        aria-pressed={selectionKind === "moment"}
                        onClick={() => handleSelectionKindChange("moment")}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                          selectionKind === "moment"
                            ? "border-[#111827] bg-white/90 text-[#111827]"
                            : "border-[#BEC3CA] bg-white/75 text-[#6B7280] hover:bg-white"
                        }`}
                      >
                        Exact Moment
                      </button>
                      <button
                        type="button"
                        data-testid="snapshot-selection-range-button"
                        aria-pressed={selectionKind === "range"}
                        onClick={() => handleSelectionKindChange("range")}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                          selectionKind === "range"
                            ? "border-[#111827] bg-white/90 text-[#111827]"
                            : "border-[#BEC3CA] bg-white/75 text-[#6B7280] hover:bg-white"
                        }`}
                      >
                        Range
                      </button>
                    </div>

                    {selectionKind === "range" && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                          Start
                          <input
                            type="text"
                            inputMode="numeric"
                            data-testid="snapshot-range-start-input"
                            value={rangeStartDraft}
                            onChange={(event) => setRangeStartDraft(event.target.value)}
                            onBlur={() => commitRangeInput("start", rangeStartDraft)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                commitRangeInput("start", rangeStartDraft);
                              }
                            }}
                            className="rounded-lg border border-[#BEC3CA] bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-[#111827] outline-none focus:border-[#111827]"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                          End
                          <input
                            type="text"
                            inputMode="numeric"
                            data-testid="snapshot-range-end-input"
                            value={rangeEndDraft}
                            onChange={(event) => setRangeEndDraft(event.target.value)}
                            onBlur={() => commitRangeInput("end", rangeEndDraft)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                commitRangeInput("end", rangeEndDraft);
                              }
                            }}
                            className="rounded-lg border border-[#BEC3CA] bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-[#111827] outline-none focus:border-[#111827]"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mb-3 rounded-lg border border-[#D5D7DA] bg-white/60 px-3 py-2 text-[10px] text-[#4F555D]">
                      <div className="font-semibold text-[#111827]">
                        {activePreset.label} ·{" "}
                        {interactionModel === "direct"
                          ? "Direct Edit"
                          : interactionModel === "ipod-os-original"
                            ? "iPod OS Original"
                            : "iPod OS"}
                      </div>
                      <div className="mt-0.5">
                        {selectionKind === "range"
                          ? `Range ${formatTimecode(rangeStartTime)} to ${formatTimecode(rangeEndTime)}`
                          : `Moment ${formatTimecode(state.currentTime)}`}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="load-song-snapshot-button"
                        onClick={handleLoadSnapshot}
                        className="rounded-lg border border-[#BEC3CA] bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-[#111827] transition-colors hover:bg-white"
                      >
                        Load Snapshot
                      </button>
                      <button
                        type="button"
                        data-testid="save-song-snapshot-button"
                        onClick={handleSaveSnapshot}
                        className="rounded-lg border border-[#BEC3CA] bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-[#111827] transition-colors hover:bg-white"
                      >
                        Save Snapshot
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* View Modes */}
            <div className="flex flex-col gap-2 p-2 bg-[#E7E7E3]/80 backdrop-blur-sm rounded-xl border border-[#D0D4DA] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
              <IconButton
                icon={<Smartphone className="w-5 h-5" />}
                label="Flat"
                data-testid="flat-view-button"
                isActive={viewMode === "flat"}
                onClick={() => handleViewModeChange("flat")}
              />
              <IconButton
                icon={<Eye className="w-5 h-5" />}
                label="Preview"
                data-testid="preview-view-button"
                isActive={viewMode === "preview"}
                onClick={() => handleViewModeChange("preview")}
              />
              <IconButton
                icon={<Box className="w-5 h-5" />}
                label="3D Experience"
                badge="WIP"
                data-testid="three-d-view-button"
                isActive={viewMode === "3d"}
                onClick={() => handleViewModeChange("3d")}
              />
              <IconButton
                icon={<Monitor className="w-5 h-5" />}
                label="Focus Mode"
                data-testid="focus-view-button"
                isActive={viewMode === "focus"}
                onClick={() => handleViewModeChange("focus")}
              />
              <IconButton
                icon={<Terminal className="w-5 h-5" />}
                label="ASCII Mode"
                badge="WIP"
                data-testid="ascii-view-button"
                isActive={viewMode === "ascii"}
                onClick={() => handleViewModeChange("ascii")}
              />
              <IconButton
                icon={
                  isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />
                }
                label={isPlaying ? "Pause" : "Play"}
                data-testid="play-pause-toggle-button"
                onClick={() => {
                  playClick();
                  dispatch({ type: "TOGGLE_IS_PLAYING" });
                }}
                className={isPlaying ? "bg-blue-100 text-blue-600 border-blue-200" : ""}
              />
            </div>

            {/* Export Action */}
            <IconButton
              icon={
                activeExportKind === "png" && exportStatus === "success" ? (
                  <Check className="w-5 h-5" />
                ) : pngBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share className="w-5 h-5" />
                )
              }
              label={
                activeExportKind === "png" && exportStatus === "preparing"
                  ? "Preparing..."
                  : activeExportKind === "png" && exportStatus === "sharing"
                    ? "Sharing..."
                    : activeExportKind === "png" && exportStatus === "success"
                      ? "Done!"
                      : !canPngExport
                        ? "Flat or Focus View"
                        : "Export 2D Image"
              }
              onClick={handlePngExport}
              data-testid="export-button"
              contrast={true}
              disabled={!canPngExport || exportStatus !== "idle"}
              className={`transition-colors duration-300 ${
                activeExportKind === "png" && exportStatus === "success"
                  ? "bg-green-500 hover:bg-green-600 border-none"
                  : pngBusy
                    ? "bg-blue-500 hover:bg-blue-600 border-none"
                    : ""
              } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
            />
            {(isPreviewView || gifBusy) && (
              <IconButton
                icon={
                  activeExportKind === "gif" && exportStatus === "success" ? (
                    <Check className="w-5 h-5" />
                  ) : gifBusy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Film className="w-5 h-5" />
                  )
                }
                label={
                  activeExportKind === "gif" && exportStatus === "preparing"
                    ? "Preparing..."
                    : activeExportKind === "gif" && exportStatus === "encoding"
                      ? "Encoding GIF..."
                      : activeExportKind === "gif" && exportStatus === "success"
                        ? "Done!"
                        : "Export Animated GIF"
                }
                onClick={handleGifExport}
                data-testid="gif-export-button"
                contrast={true}
                disabled={!isPreviewView || exportStatus !== "idle"}
                className={`transition-colors duration-300 ${
                  activeExportKind === "gif" && exportStatus === "success"
                    ? "bg-green-500 hover:bg-green-600 border-none"
                    : gifBusy
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

        {isPreviewView && exportStatus === "idle" && (
          <div className="mb-4 flex w-full max-w-[28rem] items-center justify-center">
            <div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Marquee Preview
              </div>
              <div className="mt-0.5 text-[12px] font-medium text-black/70">
                {titleCanMarquee
                  ? "The title is crawling. Export Animated GIF to capture it."
                  : "Title will scroll in the GIF along with progress and time."}
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
                Terminal-style Now Playing. Export GIF to animate the progress bar.
              </div>
            </div>
          </div>
        )}

        {/* 3D MODE (R3F) */}
        {viewMode === "3d" && (
          <ThreeDIpod
            skinColor={skinColor}
            screen={screenComponent}
            wheel={wheelComponent}
          />
        )}

        {/* 2D / EXPORT MODE */}
        <div
          className={`relative transition-all duration-700 ${viewMode !== "3d" ? "opacity-100" : "opacity-0 pointer-events-none absolute"}`}
        >
          <div
            className="relative"
            style={{
              width: `${scaledFrameWidth}px`,
              height: `${scaledFrameHeight}px`,
            }}
          >
            <div
              className="origin-top-left"
              style={{
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                transform: `scale(${previewScale})`,
              }}
            >
              <div
                ref={exportTargetRef}
                data-export-shell={isExportCapturing ? "true" : "false"}
                className="p-12"
                style={{
                  backgroundColor: isExportCapturing ? bgColor : "transparent",
                }}
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
        </div>
      </div>
    </FixedEditorProvider>
  );
}
