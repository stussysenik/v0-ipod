"use client";

import { useReducer, useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  Box,
  Share,
  Monitor,
  Smartphone,
  Check,
  Loader2,
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
import { SceneInspectorShell } from "./scene-inspector-shell";
import type { SongMetadata } from "@/types/ipod";
import {
  DEFAULT_INTERACTION_MODEL,
  DEFAULT_MENU_INDEX,
  DEFAULT_OS_NOW_PLAYING_LAYOUT,
  DEFAULT_OS_SCREEN,
  DEFAULT_OS_ORIGINAL_MENU_SPLIT,
  DEFAULT_SELECTION_KIND,
  SONG_SNAPSHOT_SCHEMA_VERSION,
  type IpodInteractionModel,
  type IpodNowPlayingLayoutState,
  type IpodOsScreen,
  type IpodUiState,
  type IpodViewMode,
  type SnapshotSelectionKind,
  type SongSnapshot,
  type IpodHardwarePresetId,
} from "@/types/ipod-state";
import {
  buildSceneProjectionState,
  selectActiveProjectionProfile,
  selectSceneNode,
  selectSelectedScenePath,
} from "@/lib/scene-document";
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
import type { SceneNodeId } from "@/types/scene-document";

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

const SCENE_NODE_LABELS: Record<SceneNodeId, string> = {
  scene: "Scene",
  stage: "Stage",
  shell: "Device Shell",
  screen: "Screen",
  "status-bar": "Status Bar",
  "now-playing": "Now Playing",
  artwork: "Artwork",
  title: "Title",
  artist: "Artist",
  album: "Album",
  rating: "Rating",
  "track-info": "Track Info",
  progress: "Progress",
  "elapsed-time": "Elapsed Time",
  "remaining-time": "Remaining Time",
  wheel: "Click Wheel",
  toolbox: "Inspector",
};

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
  const [hardwarePreset, setHardwarePreset] = useState<IpodHardwarePresetId>(
    DEFAULT_HARDWARE_PRESET_ID,
  );
  const [interactionModel, setInteractionModel] = useState<IpodInteractionModel>(
    DEFAULT_INTERACTION_MODEL,
  );
  const [selectionKind, setSelectionKind] =
    useState<SnapshotSelectionKind>(DEFAULT_SELECTION_KIND);
  const [rangeStartTime, setRangeStartTime] = useState<number | null>(null);
  const [rangeEndTime, setRangeEndTime] = useState<number | null>(null);
  const [osScreen, setOsScreen] = useState<IpodOsScreen>(DEFAULT_OS_SCREEN);
  const [osMenuIndex, setOsMenuIndex] = useState(DEFAULT_MENU_INDEX);
  const [osOriginalMenuSplit, setOsOriginalMenuSplit] = useState(
    DEFAULT_OS_ORIGINAL_MENU_SPLIT,
  );
  const [osNowPlayingLayout, setOsNowPlayingLayout] = useState<IpodNowPlayingLayoutState>(
    DEFAULT_OS_NOW_PLAYING_LAYOUT,
  );
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
  const isAuthenticInteraction = interactionModel !== "direct";
  const compactViewport = viewportSize.width > 0 && viewportSize.width < 768;
  const currentUiState = useMemo<IpodUiState>(
    () => ({
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
      osOriginalMenuSplit,
      osNowPlayingLayout,
    }),
    [
      bgColor,
      hardwarePreset,
      interactionModel,
      osMenuIndex,
      osNowPlayingLayout,
      osOriginalMenuSplit,
      osScreen,
      rangeEndTime,
      rangeStartTime,
      selectionKind,
      skinColor,
      viewMode,
    ],
  );
  const sceneProjectionState = useMemo(
    () =>
      buildSceneProjectionState(currentUiState, {
        compactViewport,
        selectedNodeId:
          interactionModel !== "direct" && osScreen === "menu"
            ? "screen"
            : isAuthenticInteraction
              ? "now-playing"
              : "title",
      }),
    [compactViewport, currentUiState, interactionModel, isAuthenticInteraction, osScreen],
  );
  const activeProjectionProfile = useMemo(
    () => selectActiveProjectionProfile(sceneProjectionState),
    [sceneProjectionState],
  );
  const selectedScenePath = useMemo(
    () => selectSelectedScenePath(sceneProjectionState),
    [sceneProjectionState],
  );
  const selectedSceneNode = useMemo(
    () => selectSceneNode(sceneProjectionState, sceneProjectionState.document.selectedNodeId),
    [sceneProjectionState],
  );
  const breadcrumbItems = useMemo(
    () =>
      selectedScenePath.map((nodeId) => ({
        id: nodeId,
        label: SCENE_NODE_LABELS[nodeId] ?? nodeId,
      })),
    [selectedScenePath],
  );
  const isCompactToolbox = activeProjectionProfile.inspector.mode === "sheet";
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
    if (typeof savedUi.osOriginalMenuSplit === "number") {
      setOsOriginalMenuSplit(savedUi.osOriginalMenuSplit);
    }
    if (savedUi.osNowPlayingLayout) {
      setOsNowPlayingLayout(savedUi.osNowPlayingLayout);
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
      osOriginalMenuSplit,
      osNowPlayingLayout,
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
    osOriginalMenuSplit,
    osNowPlayingLayout,
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

  const handleHardwarePresetChange = useCallback((nextPresetId: IpodHardwarePresetId) => {
    const nextPreset = getIpodClassicPreset(nextPresetId);
    setHardwarePreset(nextPresetId);
    setSkinColor(nextPreset.defaultShellColor);
    setBgColor(nextPreset.defaultBackdropColor);
  }, []);

  const handleInteractionModelChange = useCallback(
    (nextModel: IpodInteractionModel) => {
      clearSoftNotice();
      setInteractionModel(nextModel);
      if (nextModel !== "direct") {
        setOsScreen("menu");
        return;
      }
      setOsScreen("now-playing");
    },
    [clearSoftNotice],
  );

  const handleSelectionKindChange = useCallback(
    (nextKind: SnapshotSelectionKind) => {
      setSelectionKind(nextKind);
      if (nextKind === "range") {
        setRangeStartTime((prev) => prev ?? state.currentTime);
        setRangeEndTime(
          (prev) => prev ?? Math.min(state.duration, state.currentTime + 15),
        );
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

  const buildExportSlug = useCallback(() => {
    const screenContext = interactionModel === "direct" ? "now-playing" : osScreen;
    return [
      hardwarePreset,
      interactionModel,
      screenContext,
      selectionKind,
      slugifyExportSegment(state.title),
    ].join("-");
  }, [hardwarePreset, interactionModel, osScreen, selectionKind, state.title]);

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
        osOriginalMenuSplit,
        osNowPlayingLayout,
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
      osOriginalMenuSplit,
      osNowPlayingLayout,
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
        isExportCapturing ||
        isAsciiView ||
        (!isFlatView && !isFocusView && !isAuthenticInteraction)
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
    setOsOriginalMenuSplit(snapshot.ui.osOriginalMenuSplit);
    setOsNowPlayingLayout(snapshot.ui.osNowPlayingLayout);
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

    const horizontalReserve = viewportSize.width >= 1280 ? 408 : viewportSize.width >= 768 ? 132 : 24;
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
  const shellSurfaceStyle = useMemo(
    () => ({
      backgroundColor: skinColor,
      backgroundImage: [
        "radial-gradient(circle at 22% 10%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0) 44%)",
        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 16%, rgba(255,255,255,0) 36%, rgba(0,0,0,0.03) 100%)",
        "linear-gradient(104deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 24%, rgba(0,0,0,0.04) 78%, rgba(0,0,0,0.08) 100%)",
        "repeating-linear-gradient(115deg, rgba(255,255,255,0.02) 0 2px, rgba(0,0,0,0.012) 2px 6px, rgba(255,255,255,0) 6px 12px)",
      ].join(", "),
    }),
    [skinColor],
  );
  const pngBusy = activeExportKind === "png" && exportStatus !== "idle";
  const gifBusy = activeExportKind === "gif" && exportStatus !== "idle";
  const selectedNodeLabel = selectedSceneNode
    ? SCENE_NODE_LABELS[selectedSceneNode.id] ?? selectedSceneNode.id
    : "Scene";
  const interactionLabel =
    interactionModel === "direct"
      ? "Direct Edit"
      : interactionModel === "ipod-os-original"
        ? "iPod OS Original"
        : "iPod OS";
  const sceneTreePanel = (
    <div className="space-y-3">
      <div className="text-[12px] leading-5 text-[var(--scene-inspector-ink-muted)]">
        Stage 1 keeps the canonical scene path visible while the full expandable tree lands in
        Stage 2.
      </div>
      <div className="space-y-2">
        {selectedScenePath.map((nodeId, index) => {
          const node = sceneProjectionState.document.nodes[nodeId];
          return (
            <div
              key={nodeId}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                index === selectedScenePath.length - 1
                  ? "border-[var(--scene-inspector-border-strong)] bg-[var(--scene-inspector-accent-soft)]"
                  : "border-[var(--scene-inspector-border)] bg-white/60"
              }`}
            >
              <div>
                <div className="text-[12px] font-semibold text-[var(--scene-inspector-ink)]">
                  {SCENE_NODE_LABELS[nodeId] ?? nodeId}
                </div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--scene-inspector-ink-muted)]">
                  {node.kind}
                </div>
              </div>
              <div className="text-right text-[10px] text-[var(--scene-inspector-ink-muted)]">
                <div>{node.children.length} child</div>
                <div>{node.children.length === 1 ? "node" : "nodes"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  const sceneNodePanel = selectedSceneNode ? (
    <div className="space-y-3 text-[12px]">
      <div className="rounded-2xl border border-[var(--scene-inspector-border)] bg-white/60 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--scene-inspector-ink-muted)]">
          Active Node
        </div>
        <div className="mt-1 text-[14px] font-semibold text-[var(--scene-inspector-ink)]">
          {selectedNodeLabel}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[var(--scene-inspector-ink-muted)]">
          <span className="scene-inspector-chip px-2 py-1">{selectedSceneNode.kind}</span>
          <span className="scene-inspector-chip px-2 py-1">{selectedSceneNode.role}</span>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--scene-inspector-border)] bg-white/60 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--scene-inspector-ink-muted)]">
          Stage 1 Placeholder
        </div>
        <div className="mt-1 leading-5 text-[var(--scene-inspector-ink-muted)]">
          Node-scoped controls will replace the mixed settings sheet in Stage 3. Current scene
          controls stay available above so authoring does not regress during the shell cutover.
        </div>
      </div>
    </div>
  ) : (
    <div className="text-[12px] leading-5 text-[var(--scene-inspector-ink-muted)]">
      No scene node is selected.
    </div>
  );
  const sceneHistoryPanel = (
    <div className="space-y-3 text-[12px]">
      <div className="rounded-2xl border border-dashed border-[var(--scene-inspector-border-strong)] bg-white/50 p-3 leading-5 text-[var(--scene-inspector-ink-muted)]">
        Local-first snapshot and export provenance lands in Stage 4. This shell already reserves
        the persistent history rail so saved work becomes visible in the authoring surface instead
        of hiding in storage.
      </div>
      <div className="flex gap-2">
        <div className="scene-inspector-chip px-2.5 py-1 text-[10px] font-semibold">
          Next export #{formatExportId(exportCounter)}
        </div>
        <div className="scene-inspector-chip px-2.5 py-1 text-[10px] font-semibold">
          Snapshot context {selectionKind === "range" ? "Range" : "Moment"}
        </div>
      </div>
    </div>
  );

  return (
    <FixedEditorProvider resetKey={editorResetKey}>
      <div
        ref={containerRef}
        className="ipod-studio-stage min-h-[100dvh] w-full flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto px-4 pt-4 pb-24 transition-colors duration-500 sm:justify-center sm:p-6 lg:items-start lg:justify-center lg:pr-[25rem] xl:pr-[27rem]"
        style={{ "--ipod-stage-color": bgColor } as React.CSSProperties}
      >
        <div
          className={`z-50 transition-opacity duration-700 ${exportStatus !== "idle" ? "opacity-0 pointer-events-none" : ""}`}
        >
          <SceneInspectorShell
            toolsRef={toolsRef}
            compact={isCompactToolbox}
            open={isToolboxVisible}
            controlsOpen={showSettings}
            onToggleShell={handleToggleToolbox}
            onToggleControls={handleToggleSettings}
            selectedNodeLabel={selectedNodeLabel}
            profileLabel={isCompactToolbox ? "Phone" : "Desktop"}
            viewModeLabel={
              viewMode === "3d"
                ? "3D"
                : viewMode === "preview"
                  ? "Preview"
                  : viewMode === "focus"
                    ? "Focus"
                    : viewMode === "ascii"
                      ? "Text"
                      : "Flat"
            }
            interactionLabel={
              interactionModel === "direct" ? "Tap to edit" : "Use click wheel"
            }
            exportPresetLabel={
              selectionKind === "range" ? "Moving capture" : "Still capture"
            }
            breadcrumbs={breadcrumbItems}
            controlsPanel={
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F555D]">
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

                <div>
                  <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F555D]">
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

                <div>
                  <h3 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F555D]">
                    Case Color
                  </h3>
                  <div className="mb-4">
                    <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                      Authentic Apple Releases
                    </h4>
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                      {AUTHENTIC_CASE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setSkinColor(c.value)}
                          title={c.label}
                          className={`h-8 w-8 rounded-full border transition-transform hover:scale-105 ${
                            skinColor === c.value
                              ? "scale-105 border-[#111827] ring-2 ring-[#CDD1D6]"
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
                  {oklchReady && oklchCasePalette.length > 0 ? (
                    <div className="mb-4">
                      <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                        OKLCH Spectrum
                      </h4>
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                        {oklchCasePalette.map((swatch) => (
                          <button
                            key={swatch.hue}
                            onClick={() => {
                              const hex = oklchToHex(OKLCH_CASE_L, OKLCH_CASE_C, swatch.hue);
                              if (!hex) return;
                              setSkinColor(hex);
                              saveCustomColor("case", hex);
                            }}
                            title={swatch.label}
                            className="h-8 w-8 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {savedCaseColors.length > 0 ? (
                    <div className="mb-4">
                      <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                        Recent Custom
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {savedCaseColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSkinColor(color)}
                            title={`Custom ${color}`}
                            className={`h-7 w-7 rounded-full border ${
                              skinColor === color
                                ? "border-[#111827] ring-2 ring-[#CDD1D6]"
                                : "border-[#B5BBC3]"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!oklchReady ? (
                    <p className="mb-4 px-1 text-[10px] text-[#6B7280]">
                      OKLCH palettes need a modern browser. Use the custom picker for full
                      compatibility.
                    </p>
                  ) : null}
                  <div className="mb-4 flex items-end gap-1">
                    <HexColorInput
                      value={skinColor}
                      onChange={(color) => {
                        setSkinColor(color);
                        saveCustomColor("case", color);
                      }}
                    />
                    {hasEyeDropper ? (
                      <button
                        type="button"
                        onClick={() => openEyeDropper("case")}
                        className="rounded p-1 text-[#6B7280] transition-colors hover:bg-black/5 hover:text-[#111827]"
                        title="Pick color from screen"
                        aria-label="Pick case color from screen"
                      >
                        <Pipette className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F555D]">
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
                  {oklchReady && oklchBgPalette.length > 0 ? (
                    <div className="mb-3">
                      <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                        OKLCH Ambient
                      </h4>
                      <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
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
                            className="h-6 w-6 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {savedBgColors.length > 0 ? (
                    <div className="mt-3">
                      <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                        Recent Custom
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {savedBgColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setBgColor(color)}
                            title={`Custom ${color}`}
                            className={`h-6 w-6 rounded-full border ${
                              bgColor === color
                                ? "border-[#111827] ring-2 ring-[#CDD1D6]"
                                : "border-[#B5BBC3]"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-end gap-1">
                    <HexColorInput
                      value={bgColor}
                      onChange={(color) => {
                        setBgColor(color);
                        saveCustomColor("bg", color);
                      }}
                    />
                    {hasEyeDropper ? (
                      <button
                        type="button"
                        onClick={() => openEyeDropper("bg")}
                        className="rounded p-1 text-[#6B7280] transition-colors hover:bg-black/5 hover:text-[#111827]"
                        title="Pick color from screen"
                        aria-label="Pick background color from screen"
                      >
                        <Pipette className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-[#D5D7DA] pt-3">
                  <h4 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
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

                  {selectionKind === "range" ? (
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
                  ) : null}

                  <div className="mb-3 rounded-lg border border-[#D5D7DA] bg-white/60 px-3 py-2 text-[10px] text-[#4F555D]">
                    <div className="font-semibold text-[#111827]">
                      {activePreset.label} · {interactionLabel}
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
            }
            actionsPanel={
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--scene-inspector-ink-muted)]">
                    Pick A View
                  </div>
                  <p className="px-1 text-[11px] leading-[1.45] text-[var(--scene-inspector-ink-muted)]">
                    Start with the simplest view that helps you frame the iPod.
                  </p>
                  <div className="scene-inspector-control-rail flex flex-wrap gap-2 p-2.5">
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
                      label="3D"
                      badge="WIP"
                      data-testid="three-d-view-button"
                      isActive={viewMode === "3d"}
                      onClick={() => handleViewModeChange("3d")}
                    />
                    <IconButton
                      icon={<Monitor className="w-5 h-5" />}
                      label="Focus"
                      data-testid="focus-view-button"
                      isActive={viewMode === "focus"}
                      onClick={() => handleViewModeChange("focus")}
                    />
                    <IconButton
                      icon={<Terminal className="w-5 h-5" />}
                      label="Text"
                      badge="WIP"
                      data-testid="ascii-view-button"
                      isActive={viewMode === "ascii"}
                      onClick={() => handleViewModeChange("ascii")}
                    />
                  </div>
                </div>

                <div className="scene-inspector-divider" />

                <div className="space-y-3">
                  <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--scene-inspector-ink-muted)]">
                    Save Or Share
                  </div>
                  <p className="px-1 text-[11px] leading-[1.45] text-[var(--scene-inspector-ink-muted)]">
                    When it looks right, save one picture or a moving version.
                  </p>
                  <div className="scene-inspector-control-rail flex flex-wrap gap-3 p-2.5">
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
                                ? "Use Flat or Focus"
                                : "Save Picture"
                      }
                      onClick={handlePngExport}
                      data-testid="export-button"
                      contrast={true}
                      disabled={!canPngExport || exportStatus !== "idle"}
                      className={`transition-colors duration-300 ${
                        activeExportKind === "png" && exportStatus === "success"
                          ? "border-none bg-green-500 hover:bg-green-600"
                          : pngBusy
                            ? "border-none bg-blue-500 hover:bg-blue-600"
                            : ""
                      } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100`}
                    />
                    {(isPreviewView || gifBusy) ? (
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
                                : "Make GIF"
                        }
                        onClick={handleGifExport}
                        data-testid="gif-export-button"
                        contrast={true}
                        disabled={!isPreviewView || exportStatus !== "idle"}
                        className={`transition-colors duration-300 ${
                          activeExportKind === "gif" && exportStatus === "success"
                            ? "border-none bg-green-500 hover:bg-green-600"
                            : gifBusy
                              ? "border-none bg-blue-500 hover:bg-blue-600"
                              : ""
                        } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100`}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            }
            treePanel={sceneTreePanel}
            nodePanel={sceneNodePanel}
            historyPanel={sceneHistoryPanel}
          />
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
            className="relative rounded-[2.75rem] border border-white/50 bg-white/20 shadow-[0_24px_60px_rgba(31,25,20,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[2px]"
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
                    ...shellSurfaceStyle,
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
