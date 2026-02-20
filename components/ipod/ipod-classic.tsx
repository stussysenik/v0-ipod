"use client";

import { useReducer, useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  Settings,
  Box,
  Share,
  Monitor,
  Smartphone,
  Check,
  Plus,
  Loader2,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import { exportImage, type ExportStatus } from "@/lib/export-utils";
import {
  loadMetadata,
  saveMetadata,
  loadUiState,
  saveUiState,
  loadExportCounter,
  saveExportCounter,
  type IpodViewMode,
  loadSongSnapshot,
  saveSongSnapshot,
  type SongSnapshot,
} from "@/lib/storage";
import { TEST_SONG_SNAPSHOT } from "@/lib/song-snapshots";
import placeholderLogo from "@/public/placeholder-logo.png";
import { IconButton } from "@/components/ui/icon-button";
import { ThreeDIpod } from "@/components/three/three-d-ipod";
import { FixedEditorProvider } from "./fixed-editor";
import { IpodScreen } from "./ipod-screen";
import { ClickWheel } from "./click-wheel";
import type { SongMetadata } from "@/types/ipod";

// Base64 click sound
const CLICK_SOUND =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//oeBAAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBBEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBCEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBDEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBEIAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r////////////////////////////////////////////////////////////////";

const CASE_COLOR_PRESETS = [
  { label: "White (5G)", value: "#F5F5F7" },
  { label: "Pearl Gray", value: "#E4E4E6" },
  { label: "Black (5G/Classic)", value: "#1B1B1F" },
  { label: "Graphite", value: "#2A2C31" },
  { label: "Charcoal", value: "#3B3D44" },
  { label: "Silver (Classic)", value: "#D9DADC" },
  { label: "Brushed Steel", value: "#C7C9CD" },
  { label: "Gunmetal", value: "#535861" },
  { label: "U2 Black/Red", value: "#19191D" },
  { label: "Slate Blue", value: "#7A90B8" },
  { label: "Fog Green", value: "#9AAE8E" },
  { label: "Muted Rose", value: "#BFA5AD" },
  { label: "Oxide Red", value: "#8D4A4A" },
];

const BG_COLOR_PRESETS = [
  { label: "Studio Warm", value: "#E5E5E5" },
  { label: "Cloud Gray", value: "#DBDCDD" },
  { label: "Concrete", value: "#D4D6D8" },
  { label: "Lo-Fi Silver", value: "#CACDD1" },
  { label: "Slate", value: "#A9AFB6" },
  { label: "Ash Blue", value: "#98A1AA" },
  { label: "Darkroom Gray", value: "#7F8791" },
  { label: "Night Graphite", value: "#5F6772" },
];

const CASE_CUSTOM_COLORS_KEY = "ipodSnapshotCaseCustomColors";
const BG_CUSTOM_COLORS_KEY = "ipodSnapshotBgCustomColors";
const MAX_CUSTOM_COLORS = 6;
const SHELL_WIDTH = 370;
const SHELL_HEIGHT = 620;
const SHELL_PADDING = 48;
const PREVIEW_FRAME_WIDTH = SHELL_WIDTH + SHELL_PADDING * 2;
const PREVIEW_FRAME_HEIGHT = SHELL_HEIGHT + SHELL_PADDING * 2;
const EXPORT_COUNTER_PAD = 4;

const initialState: SongMetadata = {
  title: "Have A Destination?",
  artist: "Mac Miller",
  album: "Balloonerism",
  artwork: placeholderLogo.src,
  duration: 334,
  currentTime: 0,
  rating: 5,
  trackNumber: 2,
  totalTracks: 10,
};

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

  // View State: 'flat' (Standard 2D), '3d' (R3F), 'focus' (Close-up)
  const [viewMode, setViewMode] = useState<IpodViewMode>("flat");

  // Customization State
  const [skinColor, setSkinColor] = useState(CASE_COLOR_PRESETS[0].value);
  const [bgColor, setBgColor] = useState(BG_COLOR_PRESETS[0].value);
  const [showSettings, setShowSettings] = useState(false);
  const [savedCaseColors, setSavedCaseColors] = useState<string[]>([]);
  const [savedBgColors, setSavedBgColors] = useState<string[]>([]);
  const [isExportCapturing, setIsExportCapturing] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [exportCounter, setExportCounter] = useState(0);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const isFlatView = viewMode === "flat";
  const isCompactToolbox = viewportSize.width > 0 && viewportSize.width < 768;
  const isToolboxVisible = !isCompactToolbox || isToolboxOpen;

  const containerRef = useRef<HTMLDivElement>(null);
  const exportTargetRef = useRef<HTMLDivElement>(null); // Wrapper for export
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const caseColorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);
  const softNoticeTimerRef = useRef<number | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio(CLICK_SOUND);
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
    saveUiState({ skinColor, bgColor, viewMode });
  }, [skinColor, bgColor, viewMode]);

  useEffect(() => {
    if (isFlatView) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    window.getSelection?.()?.removeAllRanges();
  }, [isFlatView]);

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
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
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

  const formatExportId = useCallback(
    (counter: number) =>
      String(Math.max(0, Math.floor(counter))).padStart(EXPORT_COUNTER_PAD, "0"),
    [],
  );

  const handleExportRef = useRef<() => void>();

  const handleExport = useCallback(async () => {
    if (exportStatus !== "idle") return;
    resetInteractionChrome({
      closeSettings: true,
      closeEditor: true,
      closeToolbox: true,
      clearNotice: true,
    });
    if (!isFlatView) {
      playClick();
      showSoftNotice("Switch to Flat View to export");
      return;
    }

    playClick();
    const exportId = exportCounter;
    const exportTag = formatExportId(exportId);
    const slug =
      state.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "snapshot";
    const filename = `ipod-${exportTag}-${slug}.png`;

    if (!exportTargetRef.current) return;

    setIsExportCapturing(true);

    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      console.info("[export] starting flat export", { filename });
      const result = await exportImage(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        pixelRatio: 4,
        constrainedFrame: true,
        onStatusChange: setExportStatus,
      });
      console.info("[export] finished", result);

      if (result.success) {
        const nextCounter = exportId + 1;
        setExportCounter(nextCounter);
        saveExportCounter(nextCounter);
        if (result.method === "share") {
          showSoftNotice(`Shared #${exportTag}`);
        } else {
          showSoftNotice(`Exported #${exportTag}`);
        }
      } else {
        toast.error("Export failed", {
          description: result.error,
          action: {
            label: "Retry",
            onClick: () => handleExportRef.current?.(),
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
          onClick: () => handleExportRef.current?.(),
        },
      });
    } finally {
      setIsExportCapturing(false);
      setTimeout(() => setExportStatus("idle"), 1500);
    }
  }, [
    playClick,
    state.title,
    bgColor,
    exportCounter,
    formatExportId,
    exportStatus,
    isFlatView,
    showSoftNotice,
    resetInteractionChrome,
  ]);

  useEffect(() => {
    handleExportRef.current = handleExport;
  }, [handleExport]);

  const screenComponent = (
    <IpodScreen
      state={state}
      dispatch={dispatch}
      playClick={playClick}
      isEditable={isFlatView && !isExportCapturing}
      exportSafe={isExportCapturing}
    />
  );

  const wheelComponent = (
    <ClickWheel
      playClick={playClick}
      onSeek={handleSeek}
      disabled={!isFlatView}
      exportSafe={isExportCapturing}
    />
  );

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

  const openSystemColorPicker = useCallback(
    (target: "case" | "bg") => {
      const input =
        target === "case" ? caseColorInputRef.current : bgColorInputRef.current;
      if (!input) return;

      // Keep picker invocation in the same user gesture for mobile browsers.
      try {
        if ("showPicker" in input) {
          (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
        } else {
          input.click();
        }
      } catch {
        input.click();
      }

      // Hide panel so users can sample colors from anywhere on-screen.
      setShowSettings(false);
      if (isCompactToolbox) {
        setIsToolboxOpen(false);
      }
    },
    [isCompactToolbox],
  );

  const applySongSnapshot = useCallback((snapshot: SongSnapshot) => {
    dispatch({ type: "RESTORE_ALL", payload: snapshot.metadata });
    setSkinColor(snapshot.ui.skinColor);
    setBgColor(snapshot.ui.bgColor);
    setViewMode(snapshot.ui.viewMode);
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
    saveSongSnapshot({
      metadata: state,
      ui: { skinColor, bgColor, viewMode },
    });
    showSoftNotice("Snapshot saved");
  }, [
    playClick,
    state,
    skinColor,
    bgColor,
    viewMode,
    showSoftNotice,
    resetInteractionChrome,
  ]);

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

    const toolbarReserve = viewportSize.width >= 768 ? 112 : 24;
    const availableWidth = Math.max(viewportSize.width - toolbarReserve, 260);
    const availableHeight = Math.max(viewportSize.height - 24, 320);
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
  }, [isExportCapturing, viewportSize.width, viewportSize.height, viewMode]);

  const scaledFrameWidth = PREVIEW_FRAME_WIDTH * previewScale;
  const scaledFrameHeight = PREVIEW_FRAME_HEIGHT * previewScale;
  const shellShadow = isExportCapturing
    ? "inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.08)"
    : "0 34px 54px -28px rgba(0,0,0,0.48), 0 14px 26px -18px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.08)";
  const toolboxDockClass = isCompactToolbox
    ? "fixed right-4 bottom-6"
    : "fixed top-6 right-6";
  const toolboxPanelClass = isCompactToolbox
    ? `absolute right-0 bottom-14 flex flex-col gap-3 rounded-2xl border border-[#D0D4DA] bg-[#E7E7E3]/88 p-2 shadow-[0_16px_34px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 ${isToolboxVisible ? "opacity-100 translate-y-0 visible pointer-events-auto" : "opacity-0 translate-y-2 invisible pointer-events-none"}`
    : "flex flex-col gap-3";

  return (
    <FixedEditorProvider resetKey={editorResetKey}>
      <div
        ref={containerRef}
        className="min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 py-6 sm:p-6 transition-colors duration-500 overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Persistent color inputs so native picker stays alive even when UI hides */}
        <input
          ref={caseColorInputRef}
          type="color"
          data-testid="case-color-input"
          value={skinColor}
          onChange={(e) => {
            setSkinColor(e.target.value);
            saveCustomColor("case", e.target.value);
            setShowSettings(false);
          }}
          className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          ref={bgColorInputRef}
          type="color"
          data-testid="bg-color-input"
          value={bgColor}
          onChange={(e) => {
            setBgColor(e.target.value);
            saveCustomColor("bg", e.target.value);
            setShowSettings(false);
          }}
          className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />

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
                  className="absolute top-0 right-14 max-sm:right-0 max-sm:bottom-14 max-sm:top-auto bg-[#F2F2F0]/95 backdrop-blur-sm p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.18)] w-[280px] max-sm:w-[min(92vw,320px)] animate-in slide-in-from-right-2 border border-[#D5D7DA]"
                >
                  <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-3 px-1">
                    Case Color
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CASE_COLOR_PRESETS.map((c) => (
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
                    {/* System Color Picker integrated */}
                    <div className="relative w-8 h-8 rounded-full border border-dashed border-[#7A838E] flex items-center justify-center hover:border-[#111827] cursor-pointer overflow-hidden transition-colors">
                      <Plus className="w-4 h-4 text-[#4B5563]" />
                      <button
                        type="button"
                        onClick={() => openSystemColorPicker("case")}
                        data-testid="custom-case-color-button"
                        className="absolute inset-0 bg-transparent"
                        title="Custom case color"
                        aria-label="Open custom case color picker"
                      />
                    </div>
                  </div>
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
                            className={`w-6 h-6 rounded-full border ${
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

                  <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-3 px-1">
                    Background
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {BG_COLOR_PRESETS.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setBgColor(bg.value)}
                        title={bg.label}
                        className={`w-6 h-6 rounded-full border ${
                          bgColor === bg.value
                            ? "border-[#111827] ring-2 ring-[#CDD1D6]"
                            : "border-[#B5BBC3]"
                        }`}
                        style={{ backgroundColor: bg.value }}
                      />
                    ))}
                    {/* Background color picker */}
                    <div className="relative w-6 h-6 rounded-full border border-[#B5BBC3] flex items-center justify-center hover:scale-110 cursor-pointer overflow-hidden bg-white">
                      <Plus className="w-3 h-3 text-[#1F2937]" />
                      <button
                        type="button"
                        onClick={() => openSystemColorPicker("bg")}
                        data-testid="custom-bg-color-button"
                        className="absolute inset-0 bg-transparent"
                        title="Custom background color"
                        aria-label="Open custom background color picker"
                      />
                    </div>
                  </div>
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

                  <div className="mt-4 pt-3 border-t border-[#D5D7DA]">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Snapshot
                    </h4>
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
                label="Flat View"
                data-testid="flat-view-button"
                isActive={viewMode === "flat"}
                onClick={() => handleViewModeChange("flat")}
              />
              <IconButton
                icon={<Box className="w-5 h-5" />}
                label="3D Experience"
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
            </div>

            {/* Export Action */}
            <IconButton
              icon={
                exportStatus === "success" ? (
                  <Check className="w-5 h-5" />
                ) : exportStatus === "preparing" || exportStatus === "sharing" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share className="w-5 h-5" />
                )
              }
              label={
                exportStatus === "preparing"
                  ? "Preparing..."
                  : exportStatus === "sharing"
                    ? "Sharing..."
                    : exportStatus === "success"
                      ? "Done!"
                      : !isFlatView
                        ? "Flat View Only"
                        : "Export 2D Image"
              }
              onClick={handleExport}
              data-testid="export-button"
              contrast={true}
              disabled={!isFlatView || exportStatus !== "idle"}
              className={`transition-colors duration-300 ${
                exportStatus === "success"
                  ? "bg-green-500 hover:bg-green-600 border-none"
                  : exportStatus === "preparing" || exportStatus === "sharing"
                    ? "bg-blue-500 hover:bg-blue-600 border-none"
                    : ""
              } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
            />
          </div>
        </div>

        {softNotice && exportStatus === "idle" && (
          <div className="fixed right-6 bottom-6 z-50 rounded-full border border-black/10 bg-white/72 px-3 py-1 text-[11px] font-medium text-black/65 shadow-[0_8px_18px_rgba(0,0,0,0.1)] backdrop-blur-sm">
            {softNotice}
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
                  className="relative w-[370px] h-[620px] rounded-[36px] border border-white/45 transition-all duration-300 flex flex-col items-center justify-between p-6"
                  style={{
                    backgroundColor: skinColor,
                    boxShadow: shellShadow,
                  }}
                  data-export-layer="shell"
                >
                  {/* SCREEN AREA */}
                  <div className="w-full">{screenComponent}</div>

                  {/* CONTROL AREA */}
                  <div className="flex-1 flex items-center justify-center relative -mt-4">
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
