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
} from "lucide-react";
import { toast } from "sonner";
import type { ExportStatus } from "@/lib/export-utils";
import {
  loadMetadata,
  saveMetadata,
  loadUiState,
  saveUiState,
  loadExportCounter,
  saveExportCounter,
  loadSongSnapshot,
  saveSongSnapshot,
} from "@/lib/storage";
import { TEST_SONG_SNAPSHOT } from "@/lib/song-snapshots";
import defaultArtwork from "@/public/default-artwork.png";
import { IconButton } from "@/components/ui/icon-button";
import dynamic from "next/dynamic";
const ThreeDIpod = dynamic(
  () =>
    import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    ),
  },
);
import { FixedEditorProvider } from "./fixed-editor";
import { IpodScreen } from "./ipod-screen";
import { AsciiIpod } from "./ascii-ipod";
import { ClickWheel } from "./click-wheel";
import { GreyPalettePicker } from "./grey-palette-picker";
import { HexColorInput } from "./hex-color-input";
import type { SongMetadata } from "@/types/ipod";
import {
  DEFAULT_INTERACTION_MODEL,
  DEFAULT_MENU_INDEX,
  DEFAULT_OS_SCREEN,
  DEFAULT_SELECTION_KIND,
  SONG_SNAPSHOT_SCHEMA_VERSION,
  type IpodInteractionModel,
  type IpodOsScreen,
  type IpodViewMode,
  type SnapshotSelectionKind,
  type SongSnapshot,
  type IpodHardwarePresetId,
} from "@/types/ipod-state";
import {
  AUTHENTIC_CASE_COLORS,
  BACKGROUND_OKLCH_CONFIG,
  CASE_OKLCH_CONFIG,
  DEFAULT_BACKDROP_COLOR,
  DEFAULT_SHELL_COLOR,
} from "@/lib/color-manifest";
import {
  DEFAULT_HARDWARE_PRESET_ID,
  IPOD_CLASSIC_PRESETS,
  getIpodClassicPreset,
} from "@/lib/ipod-classic-presets";
import { formatTimecode, parseTimecode } from "@/lib/time-utils";

const CASE_CUSTOM_COLORS_KEY = "ipodSnapshotCaseCustomColors";
const BG_CUSTOM_COLORS_KEY = "ipodSnapshotBgCustomColors";
const MAX_CUSTOM_COLORS = 6;
const OKLCH_CASE_L = CASE_OKLCH_CONFIG.lightness;
const OKLCH_CASE_C = CASE_OKLCH_CONFIG.chroma;
const OKLCH_BG_L = BACKGROUND_OKLCH_CONFIG.lightness;
const OKLCH_BG_C = BACKGROUND_OKLCH_CONFIG.chroma;
const OKLCH_CASE_STEPS = CASE_OKLCH_CONFIG.steps;
const OKLCH_BG_STEPS = BACKGROUND_OKLCH_CONFIG.steps;
const SHELL_WIDTH = 370;
const SHELL_HEIGHT = 620;
const SHELL_PADDING = 48;
const PREVIEW_FRAME_WIDTH = SHELL_WIDTH + SHELL_PADDING * 2;
const PREVIEW_FRAME_HEIGHT = SHELL_HEIGHT + SHELL_PADDING * 2;
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

const initialState: SongMetadata = {
  title: "Chamakay",
  artist: "Blood Orange",
  album: "Cupid Deluxe",
  artwork: defaultArtwork.src,
  duration: 252,
  currentTime: 47,
  rating: 4,
  trackNumber: 2,
  totalTracks: 12,
};

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

type Action =
  | { type: "UPDATE_TITLE"; payload: string }
  | { type: "UPDATE_ARTIST"; payload: string }
  | { type: "UPDATE_ALBUM"; payload: string }
  | { type: "UPDATE_ARTWORK"; payload: string }
  | { type: "UPDATE_CURRENT_TIME"; payload: number }
  | { type: "UPDATE_DURATION"; payload: number }
  | { type: "UPDATE_RATING"; payload: number }
  | { type: "UPDATE_TRACK_NUMBER"; payload: number }
  | { type: "UPDATE_TOTAL_TRACKS"; payload: number }
  | { type: "RESTORE_ALL"; payload: SongMetadata };

function songReducer(state: SongMetadata, action: Action): SongMetadata {
  switch (action.type) {
    case "UPDATE_TITLE":
      return { ...state, title: action.payload };
    case "UPDATE_ARTIST":
      return { ...state, artist: action.payload };
    case "UPDATE_ALBUM":
      return { ...state, album: action.payload };
    case "UPDATE_ARTWORK":
      return { ...state, artwork: action.payload };
    case "UPDATE_CURRENT_TIME":
      return {
        ...state,
        currentTime: Math.max(0, Math.min(action.payload, state.duration)),
      };
    case "UPDATE_DURATION":
      return {
        ...state,
        duration: action.payload,
        currentTime: Math.min(state.currentTime, action.payload),
      };
    case "UPDATE_RATING":
      return { ...state, rating: action.payload };
    case "UPDATE_TRACK_NUMBER":
      return {
        ...state,
        trackNumber: Math.max(1, Math.min(action.payload, state.totalTracks)),
      };
    case "UPDATE_TOTAL_TRACKS":
      return { ...state, totalTracks: Math.max(1, action.payload) };
    case "RESTORE_ALL":
      return action.payload;
    default:
      return state;
  }
}

function clampSnapshotTime(value: number | null, duration: number): number | null {
  if (value === null) return null;
  return Math.min(Math.max(Math.floor(value), 0), duration);
}

export default function IPodClassic() {
  const [state, dispatch] = useReducer(songReducer, initialState);
  const hasRestoredRef = useRef(false);
  const hasRestoredUiRef = useRef(false);

  // Hydration-safe: restore persisted metadata after mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = loadMetadata();
    if (saved) {
      dispatch({ type: "RESTORE_ALL", payload: { ...initialState, ...saved } });
    }
  }, []);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [activeExportKind, setActiveExportKind] = useState<ExportKind | null>(null);

  // View State: 'flat' (Standard 2D), 'preview' (Animated marquee), '3d' (R3F), 'focus' (Close-up)
  const [viewMode, setViewMode] = useState<IpodViewMode>("flat");
  const [hardwarePreset, setHardwarePreset] =
    useState<IpodHardwarePresetId>(DEFAULT_HARDWARE_PRESET_ID);
  const [interactionModel, setInteractionModel] =
    useState<IpodInteractionModel>(DEFAULT_INTERACTION_MODEL);
  const [selectionKind, setSelectionKind] =
    useState<SnapshotSelectionKind>(DEFAULT_SELECTION_KIND);
  const [rangeStartTime, setRangeStartTime] = useState<number | null>(null);
  const [rangeEndTime, setRangeEndTime] = useState<number | null>(null);
  const [osScreen, setOsScreen] = useState<IpodOsScreen>(DEFAULT_OS_SCREEN);
  const [osMenuIndex, setOsMenuIndex] = useState(DEFAULT_MENU_INDEX);
  const [isOsNowPlayingEditable, setIsOsNowPlayingEditable] = useState(false);

  // Customization State
  const [skinColor, setSkinColor] = useState(DEFAULT_SHELL_COLOR);
  const [bgColor, setBgColor] = useState(DEFAULT_BACKDROP_COLOR);
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
  const isFlatView = viewMode === "flat";
  const isFocusView = viewMode === "focus";
  const isPreviewView = viewMode === "preview";
  const isAsciiView = viewMode === "ascii";
  const canPngExport = isFlatView || isFocusView;
  const isAuthenticInteraction = interactionModel === "ipod-os";
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

  useEffect(() => {
    setHasEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supportsOklch()) return;
    setOklchReady(true);
    setOklchCasePalette(
      buildOklchPalette(
        OKLCH_CASE_STEPS,
        OKLCH_CASE_L,
        OKLCH_CASE_C,
        CASE_OKLCH_CONFIG.hueOffset,
      ),
    );
    setOklchBgPalette(
      buildOklchPalette(
        OKLCH_BG_STEPS,
        OKLCH_BG_L,
        OKLCH_BG_C,
        BACKGROUND_OKLCH_CONFIG.hueOffset,
      ),
    );
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
    if (hasRestoredUiRef.current) return;
    hasRestoredUiRef.current = true;
    const savedUi = loadUiState();
    if (!savedUi) return;
    if (savedUi.skinColor) {
      setSkinColor(savedUi.skinColor);
    }
    if (savedUi.bgColor) {
      setBgColor(savedUi.bgColor);
    }
    if (savedUi.viewMode) {
      setViewMode(savedUi.viewMode);
    }
    if (savedUi.hardwarePreset) {
      setHardwarePreset(savedUi.hardwarePreset);
    }
    if (savedUi.interactionModel) {
      setInteractionModel(savedUi.interactionModel);
    }
    if (savedUi.selectionKind) {
      setSelectionKind(savedUi.selectionKind);
    }
    if (savedUi.rangeStartTime !== undefined) {
      setRangeStartTime(savedUi.rangeStartTime);
    }
    if (savedUi.rangeEndTime !== undefined) {
      setRangeEndTime(savedUi.rangeEndTime);
    }
    if (savedUi.osScreen) {
      setOsScreen(savedUi.osScreen);
    }
    if (typeof savedUi.menuIndex === "number") {
      setOsMenuIndex(savedUi.menuIndex);
    }
  }, []);

  useEffect(() => {
    setExportCounter(loadExportCounter());
  }, []);

  // Persist song metadata on every change (skip until restored)
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    saveMetadata(state);
  }, [state]);

  useEffect(() => {
    if (!hasRestoredUiRef.current) return;
    saveUiState({
      skinColor,
      bgColor,
      viewMode,
      hardwarePreset,
      interactionModel,
      selectionKind,
      rangeStartTime,
      rangeEndTime,
      osScreen,
      menuIndex: osMenuIndex,
    });
  }, [
    skinColor,
    bgColor,
    viewMode,
    hardwarePreset,
    interactionModel,
    selectionKind,
    rangeStartTime,
    rangeEndTime,
    osScreen,
    osMenuIndex,
  ]);

  useEffect(() => {
    if (isFlatView && !isAuthenticInteraction) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    window.getSelection?.()?.removeAllRanges();
  }, [isFlatView, isAuthenticInteraction]);

  useEffect(() => {
    if (selectionKind !== "range") {
      if (rangeStartTime !== null) setRangeStartTime(null);
      if (rangeEndTime !== null) setRangeEndTime(null);
      return;
    }

    const nextStart = clampSnapshotTime(rangeStartTime ?? state.currentTime, state.duration);
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
  }, [selectionKind, rangeStartTime, rangeEndTime, state.currentTime, state.duration]);

  useEffect(() => {
    setRangeStartDraft(selectionKind === "range" ? formatTimecode(rangeStartTime) : "");
  }, [selectionKind, rangeStartTime]);

  useEffect(() => {
    setRangeEndDraft(selectionKind === "range" ? formatTimecode(rangeEndTime) : "");
  }, [selectionKind, rangeEndTime]);

  useEffect(() => {
    if (!showSettings && !isToolboxVisible) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (toolsRef.current?.contains(target)) return;
      setShowSettings(false);
      if (isCompactToolbox) {
        setIsToolboxOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettings(false);
        if (isCompactToolbox) {
          setIsToolboxOpen(false);
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings, isCompactToolbox, isToolboxVisible]);

  useEffect(() => {
    if (viewportSize.width === 0) return;
    setIsToolboxOpen(!isCompactToolbox);
  }, [viewportSize.width, isCompactToolbox]);

  useEffect(() => {
    try {
      const storedCase = localStorage.getItem(CASE_CUSTOM_COLORS_KEY);
      const storedBg = localStorage.getItem(BG_CUSTOM_COLORS_KEY);
      if (storedCase) {
        setSavedCaseColors(JSON.parse(storedCase));
      }
      if (storedBg) {
        setSavedBgColors(JSON.parse(storedBg));
      }
    } catch {
      setSavedCaseColors([]);
      setSavedBgColors([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CASE_CUSTOM_COLORS_KEY, JSON.stringify(savedCaseColors));
    } catch {
      // Ignore storage failures
    }
  }, [savedCaseColors]);

  useEffect(() => {
    try {
      localStorage.setItem(BG_CUSTOM_COLORS_KEY, JSON.stringify(savedBgColors));
    } catch {
      // Ignore storage failures
    }
  }, [savedBgColors]);

  const playClick = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/click.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const clearSoftNotice = useCallback(() => {
    if (softNoticeTimerRef.current !== null) {
      window.clearTimeout(softNoticeTimerRef.current);
      softNoticeTimerRef.current = null;
    }
    setSoftNotice(null);
  }, []);

  const showSoftNotice = useCallback(
    (message: string) => {
      clearSoftNotice();
      setSoftNotice(message);
      softNoticeTimerRef.current = window.setTimeout(() => {
        setSoftNotice(null);
        softNoticeTimerRef.current = null;
      }, 1700);
    },
    [clearSoftNotice],
  );

  const resetInteractionChrome = useCallback(
    (options?: {
      closeSettings?: boolean;
      closeEditor?: boolean;
      closeToolbox?: boolean;
      clearNotice?: boolean;
    }) => {
      if (options?.closeSettings) {
        setShowSettings(false);
      }
      if (options?.clearNotice) {
        clearSoftNotice();
      }
      if (options?.closeEditor) {
        setEditorResetKey((prev) => prev + 1);
      }
      if (options?.closeToolbox && isCompactToolbox) {
        setIsToolboxOpen(false);
      }
    },
    [clearSoftNotice, isCompactToolbox],
  );

  useEffect(() => {
    return () => {
      clearSoftNotice();
    };
  }, [clearSoftNotice]);

  const handleSeek = useCallback(
    (direction: number) => {
      dispatch({
        type: "UPDATE_CURRENT_TIME",
        payload: state.currentTime + direction * 5,
      });
    },
    [state.currentTime],
  );

  const cycleOsMenu = useCallback((direction: number) => {
    setOsMenuIndex((prev) => {
      const total = CLASSIC_OS_MENU_ITEMS.length;
      return (prev + direction + total) % total;
    });
  }, []);

  const handleWheelSeek = useCallback(
    (direction: number) => {
      if (isAuthenticInteraction && osScreen === "menu") {
        cycleOsMenu(direction > 0 ? 1 : -1);
        return;
      }
      handleSeek(direction);
    },
    [cycleOsMenu, handleSeek, isAuthenticInteraction, osScreen],
  );

  const handleHardwarePresetChange = useCallback(
    (nextPresetId: IpodHardwarePresetId) => {
      const nextPreset = getIpodClassicPreset(nextPresetId);
      setHardwarePreset(nextPresetId);
      setSkinColor(nextPreset.defaultShellColor);
      setBgColor(nextPreset.defaultBackdropColor);
    },
    [],
  );

  const handleInteractionModelChange = useCallback((nextModel: IpodInteractionModel) => {
    clearSoftNotice();
    setInteractionModel(nextModel);
    if (nextModel === "ipod-os") {
      setOsScreen("menu");
      return;
    }
    setOsScreen("now-playing");
  }, [clearSoftNotice]);

  const handleSelectionKindChange = useCallback(
    (nextKind: SnapshotSelectionKind) => {
      setSelectionKind(nextKind);
      if (nextKind === "range") {
        setRangeStartTime((prev) => prev ?? state.currentTime);
        setRangeEndTime((prev) => prev ?? Math.min(state.duration, state.currentTime + 15));
      }
    },
    [state.currentTime, state.duration],
  );

  const commitRangeInput = useCallback(
    (target: "start" | "end", draftValue: string) => {
      const parsed = parseTimecode(draftValue);
      if (parsed === null) {
        if (target === "start") {
          setRangeStartDraft(formatTimecode(rangeStartTime));
        } else {
          setRangeEndDraft(formatTimecode(rangeEndTime));
        }
        return;
      }

      if (target === "start") {
        setRangeStartTime(clampSnapshotTime(parsed, state.duration));
        return;
      }
      setRangeEndTime(clampSnapshotTime(parsed, state.duration));
    },
    [rangeEndTime, rangeStartTime, state.duration],
  );

  const formatExportId = useCallback(
    (counter: number) =>
      String(Math.max(0, Math.floor(counter))).padStart(EXPORT_COUNTER_PAD, "0"),
    [],
  );

  const buildExportSlug = useCallback(
    () => {
      const screenContext = interactionModel === "ipod-os" ? osScreen : "now-playing";
      return [
        hardwarePreset,
        interactionModel,
        screenContext,
        selectionKind,
        slugifyExportSegment(state.title),
      ].join("-");
    },
    [hardwarePreset, interactionModel, osScreen, selectionKind, state.title],
  );

  const completeSuccessfulExport = useCallback(
    (exportId: number, notice: string) => {
      const nextCounter = exportId + 1;
      setExportCounter(nextCounter);
      saveExportCounter(nextCounter);
      showSoftNotice(notice);
    },
    [showSoftNotice],
  );

  const resetExportUi = useCallback(() => {
    setIsExportCapturing(false);
    window.setTimeout(() => {
      setExportStatus("idle");
      setActiveExportKind(null);
    }, 1500);
  }, []);

  const handlePngExportRef = useRef<(() => void) | null>(null);
  const handleGifExportRef = useRef<(() => void) | null>(null);

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
      showSoftNotice("Switch to Flat or Focus View to export");
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
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      console.info("[export] starting flat export", { filename });
      const { exportImage } = await import("@/lib/export-utils");
      const result = await exportImage(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        pixelRatio: 4,
        constrainedFrame: true,
        onStatusChange: setExportStatus,
      });
      console.info("[export] finished", result);

      if (result.success) {
        completeSuccessfulExport(
          exportId,
          result.method === "share" ? `Shared #${exportTag}` : `Exported #${exportTag}`,
        );
      } else {
        toast.error("Export failed", {
          description: result.error,
          action: {
            label: "Retry",
            onClick: () => handlePngExportRef.current?.(),
          },
        });
      }
    } catch (error) {
      console.error("[export] flat export threw", error);
      setExportStatus("error");
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
        action: {
          label: "Retry",
          onClick: () => handlePngExportRef.current?.(),
        },
      });
    } finally {
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
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      console.info("[gif-export] starting preview export", { filename });
      const { exportAnimatedGif } = await import("@/lib/export-utils");
      const result = await exportAnimatedGif(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        constrainedFrame: true,
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
      }
    } catch (error) {
      console.error("[gif-export] preview export threw", error);
      setExportStatus("error");
      toast.error("GIF export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
        action: {
          label: "Retry",
          onClick: () => handleGifExportRef.current?.(),
        },
      });
    } finally {
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
    handlePngExportRef.current = handlePngExport;
  }, [handlePngExport]);

  useEffect(() => {
    handleGifExportRef.current = handleGifExport;
  }, [handleGifExport]);

  const saveCustomColor = useCallback((target: "case" | "bg", rawColor: string) => {
    const color = rawColor.toUpperCase();
    if (target === "case") {
      setSavedCaseColors((prev) =>
        [color, ...prev.filter((c) => c !== color)].slice(0, MAX_CUSTOM_COLORS),
      );
      return;
    }
    setSavedBgColors((prev) =>
      [color, ...prev.filter((c) => c !== color)].slice(0, MAX_CUSTOM_COLORS),
    );
  }, []);

  const openEyeDropper = useCallback(
    async (target: "case" | "bg") => {
      if (!("EyeDropper" in window)) return;
      try {
        // @ts-expect-error EyeDropper API not yet in all TS libs
        const dropper = new window.EyeDropper();
        const result = await dropper.open();
        const color = (result.sRGBHex as string).toUpperCase();
        if (target === "case") {
          setSkinColor(color);
        } else {
          setBgColor(color);
        }
        saveCustomColor(target, color);
      } catch {
        // User cancelled or API unavailable
      }
    },
    [saveCustomColor],
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
  }, [isCompactToolbox, osMenuIndex, showSoftNotice]);

  const handleNowPlayingCenterClick = useCallback(() => {
    setIsOsNowPlayingEditable((prev) => !prev);
  }, []);

  const handleMenuButtonPress = useCallback(() => {
    if (!isAuthenticInteraction) return;
    setIsOsNowPlayingEditable(false);
    setOsScreen("menu");
  }, [isAuthenticInteraction]);

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
    showSoftNotice("Playback remains visual in this build");
  }, [isAuthenticInteraction, osScreen, showSoftNotice]);

  const buildSongSnapshot = useCallback(
    (): SongSnapshot => ({
      schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
      metadata: state,
      ui: {
        skinColor,
        bgColor,
        viewMode,
        hardwarePreset,
        interactionModel,
        selectionKind,
        rangeStartTime: selectionKind === "range" ? rangeStartTime : null,
        rangeEndTime: selectionKind === "range" ? rangeEndTime : null,
        osScreen,
        menuIndex: osMenuIndex,
      },
      playback: {
        currentTime: state.currentTime,
        duration: state.duration,
        selectionKind,
        rangeStartTime: selectionKind === "range" ? rangeStartTime : null,
        rangeEndTime: selectionKind === "range" ? rangeEndTime : null,
      },
    }),
    [
      bgColor,
      hardwarePreset,
      interactionModel,
      osMenuIndex,
      osScreen,
      rangeEndTime,
      rangeStartTime,
      selectionKind,
      skinColor,
      state,
      viewMode,
    ],
  );

  const screenComponent = isAsciiView ? (
    <AsciiIpod state={state} />
  ) : (
    <IpodScreen
      preset={activePreset}
      state={state}
      dispatch={dispatch}
      playClick={playClick}
      interactionModel={interactionModel}
      osScreen={osScreen}
      osMenuItems={CLASSIC_OS_MENU_ITEMS}
      osMenuIndex={osMenuIndex}
      isEditable={
        !isExportCapturing &&
        (isAuthenticInteraction ? isOsNowPlayingEditable && osScreen === "now-playing" : isFlatView)
      }
      exportSafe={isExportCapturing}
      titlePreview={isPreviewView && !isExportCapturing}
      titleCaptureReady={isPreviewView || activeExportKind === "gif"}
      onTitleOverflowChange={setTitleCanMarquee}
    />
  );

  const wheelComponent = (
    <ClickWheel
      preset={activePreset}
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
        isExportCapturing || isAsciiView || (!isFlatView && !isFocusView && !isAuthenticInteraction)
      }
      exportSafe={isExportCapturing}
    />
  );

  const applySongSnapshot = useCallback((snapshot: SongSnapshot) => {
    dispatch({
      type: "RESTORE_ALL",
      payload: {
        ...snapshot.metadata,
        currentTime: snapshot.playback.currentTime,
        duration: snapshot.playback.duration,
      },
    });
    setSkinColor(snapshot.ui.skinColor);
    setBgColor(snapshot.ui.bgColor);
    setViewMode(snapshot.ui.viewMode);
    setHardwarePreset(snapshot.ui.hardwarePreset);
    setInteractionModel(snapshot.ui.interactionModel);
    setSelectionKind(snapshot.playback.selectionKind);
    setRangeStartTime(snapshot.playback.rangeStartTime);
    setRangeEndTime(snapshot.playback.rangeEndTime);
    setOsScreen(snapshot.ui.osScreen);
    setOsMenuIndex(snapshot.ui.menuIndex);
    setShowSettings(false);
  }, []);

  const handleSaveSnapshot = useCallback(() => {
    resetInteractionChrome({
      closeSettings: true,
      closeEditor: true,
      closeToolbox: true,
      clearNotice: true,
    });
    playClick();
    saveSongSnapshot(buildSongSnapshot());
    showSoftNotice("Snapshot saved");
  }, [buildSongSnapshot, playClick, showSoftNotice, resetInteractionChrome]);

  const handleLoadSnapshot = useCallback(() => {
    resetInteractionChrome({
      closeSettings: true,
      closeEditor: true,
      closeToolbox: true,
      clearNotice: true,
    });
    playClick();
    const persisted = loadSongSnapshot();
    if (persisted) {
      applySongSnapshot(persisted);
      saveSongSnapshot(persisted);
      showSoftNotice("Snapshot loaded");
      return;
    }

    applySongSnapshot(TEST_SONG_SNAPSHOT);
    saveSongSnapshot(TEST_SONG_SNAPSHOT);
    showSoftNotice("Loaded sample snapshot");
  }, [applySongSnapshot, playClick, showSoftNotice, resetInteractionChrome]);

  const handleViewModeChange = useCallback(
    (nextMode: IpodViewMode) => {
      resetInteractionChrome({
        closeSettings: true,
        closeEditor: true,
        closeToolbox: true,
        clearNotice: true,
      });
      setViewMode(nextMode);
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

  const previewScale = useMemo(() => {
    if (isExportCapturing || viewportSize.width === 0 || viewportSize.height === 0) {
      return 1;
    }

    const horizontalReserve = viewportSize.width >= 768 ? 112 : 24;
    const verticalReserve = isCompactToolbox ? 128 : 32;
    const availableWidth = Math.max(viewportSize.width - horizontalReserve, 260);
    const availableHeight = Math.max(viewportSize.height - verticalReserve, 320);
    const fitScale = Math.min(
      availableWidth / PREVIEW_FRAME_WIDTH,
      availableHeight / PREVIEW_FRAME_HEIGHT,
      1,
    );

    if (viewMode === "focus") {
      const maxScale = Math.min(
        availableWidth / PREVIEW_FRAME_WIDTH,
        availableHeight / PREVIEW_FRAME_HEIGHT,
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
  ]);

  const scaledFrameWidth = PREVIEW_FRAME_WIDTH * previewScale;
  const scaledFrameHeight = PREVIEW_FRAME_HEIGHT * previewScale;
  const shellShadow = isExportCapturing
    ? "0 0 0 1px rgba(82,88,97,0.12), 0 14px 20px -22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.52), inset 0 -1px 0 rgba(0,0,0,0.08)"
    : "0 20px 28px -28px rgba(0,0,0,0.36), 0 12px 18px -18px rgba(0,0,0,0.18), 0 0 0 1px rgba(88,94,102,0.10), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.04)";
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
              className="w-12 h-12 border border-[#D0D4DA] bg-[#F2F2F0]/95 text-black shadow-[0_14px_28px_rgba(0,0,0,0.22)] backdrop-blur-sm"
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
                        className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
                          interactionModel === "direct"
                            ? "border-[#111827] bg-white/90 text-[#111827]"
                            : "border-[#C8CDD3] bg-white/65 text-[#6B7280] hover:bg-white/80"
                        }`}
                      >
                        Direct Edit
                      </button>
                      <button
                        type="button"
                        data-testid="interaction-mode-ipod-os-button"
                        aria-pressed={interactionModel === "ipod-os"}
                        onClick={() => handleInteractionModelChange("ipod-os")}
                        className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors ${
                          interactionModel === "ipod-os"
                            ? "border-[#111827] bg-white/90 text-[#111827]"
                            : "border-[#C8CDD3] bg-white/65 text-[#6B7280] hover:bg-white/80"
                        }`}
                      >
                        iPod OS
                      </button>
                    </div>
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
                        {activePreset.label} · {interactionModel === "direct" ? "Direct Edit" : "iPod OS"}
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
            <div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
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
            <div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
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
                width: `${PREVIEW_FRAME_WIDTH}px`,
                height: `${PREVIEW_FRAME_HEIGHT}px`,
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
                <div
                  className="relative flex h-[620px] w-[370px] flex-col items-center border border-white/45 transition-all duration-300"
                  style={{
                    backgroundColor: skinColor,
                    borderColor: isExportCapturing ? "rgba(96,102,110,0.24)" : undefined,
                    boxShadow: shellShadow,
                    borderRadius: activePreset.shell.radius,
                    paddingLeft: activePreset.shell.paddingX,
                    paddingRight: activePreset.shell.paddingX,
                    paddingTop: activePreset.shell.paddingTop,
                    paddingBottom: activePreset.shell.paddingBottom,
                  }}
                  data-export-layer="shell"
                >
                  <div
                    className="pointer-events-none absolute inset-[1px]"
                    aria-hidden="true"
                    style={{
                      borderRadius: activePreset.shell.innerRadius,
                      background:
                        "radial-gradient(circle at 22% 10%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 22%), linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.02) 100%)",
                    }}
                  />
                  {/* SCREEN AREA */}
                  <div className="relative z-10 flex w-full justify-center">
                    {screenComponent}
                  </div>

                  {/* CONTROL AREA */}
                  <div
                    className="relative z-10 flex justify-center"
                    style={{ marginTop: activePreset.shell.controlMarginTop }}
                  >
                    {wheelComponent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FixedEditorProvider>
  );
}
