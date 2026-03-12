"use client";

import { useReducer, useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  Settings,
  Box,
  Share,
  Monitor,
  Smartphone,
  Check,
  AlertCircle,
  Plus,
  Loader2,
  Menu,
  Pipette,
  Film,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { exportAnimatedGif, exportImage, type ExportStatus } from "@/lib/export-utils";
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
import { HexColorInput } from "./hex-color-input";
import type { SongMetadata } from "@/types/ipod";

// Base64 click sound
const CLICK_SOUND =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//oeBAAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBBEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBCEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBDEAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r//////////////////////////////////////////////////////////////////oeBEIAAAAABB9AAACAAACD6AAAEAAAB//////////////5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r/5w5r////////////////////////////////////////////////////////////////";

const CASE_COLOR_PRESETS = [
  { label: "Bright White", value: "#FBFBF8" },
  { label: "Reference White", value: "#FFFFFF" },
  { label: "White (5G)", value: "#F5F5F7" },
  { label: "Soft Silver", value: "#ECEDEE" },
  { label: "Pearl Gray", value: "#E4E4E6" },
  { label: "Powder Cyan", value: "#96D9EE" },
  { label: "Signal Pink", value: "#E96477" },
  { label: "Paper Lilac", value: "#FEF7FB" },
  { label: "Voltage Red", value: "#FF273D" },
  { label: "Aqua Blue", value: "#0094DC" },
  { label: "Peach Skin", value: "#F7DECA" },
  { label: "Warm Sand", value: "#E4CAB6" },
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

const CASE_COLOR_AUTHENTIC = [
  { label: "White (1st-3rd Gen)", value: "#FFFFFF" },
  { label: "White (4th Gen)", value: "#F7F7F7" },
  { label: "White (5th Gen)", value: "#F5F5F5" },
  { label: "Black (5th Gen)", value: "#1A1A1A" },
  { label: "Silver (Classic 6th)", value: "#D9D9D9" },
  { label: "Black (Classic 6th)", value: "#1C1C1E" },
  { label: "Classic Black 2008", value: "#2D2F34" },
  { label: "U2 Black Front", value: "#111111" },
  { label: "U2 Red Wheel", value: "#B00020" },
];

const BG_COLOR_PRESETS = [
  { label: "Gallery White", value: "#FCFBF8" },
  { label: "Paper White", value: "#F4F4EF" },
  { label: "Powder Sky", value: "#EFF8FC" },
  { label: "Soft Blush", value: "#FEF7FB" },
  { label: "Peach Wash", value: "#F7DECA" },
  { label: "Sand Linen", value: "#E4CAB6" },
  { label: "Light Mist", value: "#EBECE7" },
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
const OKLCH_CASE_L = 0.72;
const OKLCH_CASE_C = 0.15;
const OKLCH_BG_L = 0.88;
const OKLCH_BG_C = 0.07;
const OKLCH_CASE_STEPS = 18;
const OKLCH_BG_STEPS = 14;
const SHELL_WIDTH = 370;
const SHELL_HEIGHT = 620;
const SHELL_PADDING = 48;
const PREVIEW_FRAME_WIDTH = SHELL_WIDTH + SHELL_PADDING * 2;
const PREVIEW_FRAME_HEIGHT = SHELL_HEIGHT + SHELL_PADDING * 2;
const EXPORT_COUNTER_PAD = 4;
type ExportKind = "png" | "gif";

function getExportStageContent(
  kind: ExportKind | null,
  status: ExportStatus,
  detail?: string | null,
): {
  eyebrow: string;
  title: string;
  description: string;
} | null {
  if (!kind || status === "idle") return null;

  const eyebrow = kind === "gif" ? "Animated GIF Export" : "Still Image Export";

  switch (status) {
    case "preparing":
      return {
        eyebrow,
        title: "Preparing scene",
        description: "Locking layout, artwork, and typography for a clean capture.",
      };
    case "encoding":
      return {
        eyebrow,
        title: "Encoding frames",
        description: detail ?? "Rendering the marquee motion. This can take a moment.",
      };
    case "sharing":
      return {
        eyebrow,
        title: kind === "gif" ? "Saving GIF" : "Saving image",
        description: "Handing the export to your browser or native share sheet.",
      };
    case "success":
      return {
        eyebrow,
        title: "Complete",
        description:
          kind === "gif"
            ? "The animated export finished successfully."
            : "The still image export finished successfully.",
      };
    case "error":
      return {
        eyebrow,
        title: "Export failed",
        description: "The capture did not finish cleanly. You can retry now.",
      };
    default:
      return null;
  }
}

const initialState: SongMetadata = {
  title: "Charcoal Baby",
  artist: "Blood Orange",
  album: "Negro Swan",
  artwork: placeholderLogo.src,
  duration: 244,
  currentTime: 0,
  rating: 5,
  trackNumber: 7,
  totalTracks: 16,
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

  // Customization State
  const [skinColor, setSkinColor] = useState(CASE_COLOR_PRESETS[0].value);
  const [bgColor, setBgColor] = useState(BG_COLOR_PRESETS[0].value);
  const [showSettings, setShowSettings] = useState(false);
  const [savedCaseColors, setSavedCaseColors] = useState<string[]>([]);
  const [savedBgColors, setSavedBgColors] = useState<string[]>([]);
  const [isExportCapturing, setIsExportCapturing] = useState(false);
  const [titleCanMarquee, setTitleCanMarquee] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [exportCounter, setExportCounter] = useState(0);
  const [exportStageDetail, setExportStageDetail] = useState<string | null>(null);
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  const [oklchReady, setOklchReady] = useState(false);
  const [oklchCasePalette, setOklchCasePalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
  const [oklchBgPalette, setOklchBgPalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
  const isFlatView = viewMode === "flat";
  const isPreviewView = viewMode === "preview";
  const isCompactToolbox = viewportSize.width > 0 && viewportSize.width < 768;
  const isToolboxVisible = !isCompactToolbox || isToolboxOpen;
  const useExportSafeVisuals = isExportCapturing;

  const containerRef = useRef<HTMLDivElement>(null);
  const exportTargetRef = useRef<HTMLDivElement>(null); // Wrapper for export
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const softNoticeTimerRef = useRef<number | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio(CLICK_SOUND);
    setHasEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supportsOklch()) return;
    setOklchReady(true);
    setOklchCasePalette(buildOklchPalette(OKLCH_CASE_STEPS, OKLCH_CASE_L, OKLCH_CASE_C));
    setOklchBgPalette(buildOklchPalette(OKLCH_BG_STEPS, OKLCH_BG_L, OKLCH_BG_C, 30));
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

  const buildExportSlug = useCallback(
    () =>
      state.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "snapshot",
    [state.title],
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
      setExportStageDetail(null);
    }, 1500);
  }, []);

  const handlePngExportRef = useRef<() => void>();
  const handleGifExportRef = useRef<() => void>();

  const handlePngExport = useCallback(async () => {
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
    if (!exportTargetRef.current) return;

    const exportId = exportCounter;
    const exportTag = formatExportId(exportId);
    const filename = `ipod-${exportTag}-${buildExportSlug()}.png`;

    setActiveExportKind("png");
    setExportStageDetail(null);
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
    isFlatView,
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
    if (!isPreviewView) {
      playClick();
      showSoftNotice("Switch to Preview Mode for GIF");
      return;
    }
    if (!titleCanMarquee) {
      playClick();
      showSoftNotice("Use a longer title to trigger the marquee");
      return;
    }

    playClick();
    if (!exportTargetRef.current) return;

    const exportId = exportCounter;
    const exportTag = formatExportId(exportId);
    const filename = `ipod-${exportTag}-${buildExportSlug()}.gif`;

    setActiveExportKind("gif");
    setExportStageDetail(null);
    setIsExportCapturing(true);

    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      console.info("[gif-export] starting preview export", { filename });
      const result = await exportAnimatedGif(exportTargetRef.current, {
        filename,
        backgroundColor: bgColor,
        constrainedFrame: true,
        onStatusChange: setExportStatus,
        onProgress: ({ frameIndex, frameCount }) => {
          if (frameIndex <= 0) {
            setExportStageDetail("Measuring the marquee timing and frame budget.");
            return;
          }
          setExportStageDetail(`Rendering frame ${frameIndex} of ${frameCount}.`);
        },
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
    titleCanMarquee,
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

  const screenComponent = (
    <IpodScreen
      state={state}
      dispatch={dispatch}
      playClick={playClick}
      isEditable={isFlatView && !isExportCapturing}
      exportSafe={useExportSafeVisuals}
      titlePreview={isPreviewView}
      titleCaptureReady={isPreviewView || activeExportKind === "gif"}
      onTitleOverflowChange={setTitleCanMarquee}
    />
  );

  const wheelComponent = (
    <ClickWheel
      playClick={playClick}
      onSeek={handleSeek}
      disabled={!isFlatView}
      exportSafe={useExportSafeVisuals}
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
  const shellShadow = "var(--ipod-shell-shadow)";
  const pngBusy = activeExportKind === "png" && exportStatus !== "idle";
  const gifBusy = activeExportKind === "gif" && exportStatus !== "idle";
  const exportStageContent = getExportStageContent(
    activeExportKind,
    exportStatus,
    exportStageDetail,
  );
  const toolboxDockClass = isCompactToolbox
    ? "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
    : "fixed top-6 right-6";
  const toolboxPanelClass = isCompactToolbox
    ? `absolute right-0 bottom-14 max-w-[calc(100vw-2rem)] flex flex-col gap-3 rounded-2xl border border-[#D0D4DA] bg-[#E7E7E3]/88 p-2 shadow-[0_16px_34px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 ${isToolboxVisible ? "opacity-100 translate-y-0 visible pointer-events-auto" : "opacity-0 translate-y-2 invisible pointer-events-none"}`
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
                  className="z-20 absolute top-0 right-14 max-h-[min(78dvh,42rem)] overflow-y-auto overscroll-contain bg-[#F2F2F0]/95 p-4 backdrop-blur-sm rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.18)] w-[280px] animate-in slide-in-from-right-2 border border-[#D5D7DA] max-sm:right-0 max-sm:bottom-14 max-sm:top-auto max-sm:w-[min(92vw,320px)] max-sm:max-h-[min(60dvh,28rem)]"
                >
                  <h3 className="text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-3 px-1">
                    Case Color
                  </h3>
                  <div className="mb-4">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Authentic Apple Releases
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                      {CASE_COLOR_AUTHENTIC.map((c) => (
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
                  <div className="mb-4">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Studio Palette
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
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
                      {/* System Color Picker — native input, tap-friendly */}
                      <div className="relative w-8 h-8 rounded-full border border-dashed border-[#7A838E] flex items-center justify-center hover:border-[#111827] cursor-pointer overflow-hidden transition-colors">
                        <Plus className="w-4 h-4 text-[#4B5563] pointer-events-none" />
                        <input
                          type="color"
                          data-testid="custom-case-color-button"
                          value={skinColor}
                          onInput={(e) =>
                            setSkinColor((e.target as HTMLInputElement).value)
                          }
                          onChange={(e) => {
                            setSkinColor(e.target.value);
                            saveCustomColor("case", e.target.value);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          title="Custom case color"
                          aria-label="Open custom case color picker"
                        />
                      </div>
                    </div>
                  </div>
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
                  <div className="mb-3">
                    <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                      Studio Palette
                    </h4>
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
                      {/* Background color picker — native input, tap-friendly */}
                      <div className="relative w-6 h-6 rounded-full border border-[#B5BBC3] flex items-center justify-center hover:scale-110 cursor-pointer overflow-hidden bg-white">
                        <Plus className="w-3 h-3 text-[#1F2937] pointer-events-none" />
                        <input
                          type="color"
                          data-testid="custom-bg-color-button"
                          value={bgColor}
                          onInput={(e) =>
                            setBgColor((e.target as HTMLInputElement).value)
                          }
                          onChange={(e) => {
                            setBgColor(e.target.value);
                            saveCustomColor("bg", e.target.value);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          title="Custom background color"
                          aria-label="Open custom background color picker"
                        />
                      </div>
                    </div>
                  </div>
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
                icon={<Eye className="w-5 h-5" />}
                label="Preview Mode"
                data-testid="preview-view-button"
                isActive={viewMode === "preview"}
                onClick={() => handleViewModeChange("preview")}
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
                      : !isFlatView
                        ? "Flat View Only"
                        : "Export 2D Image"
              }
              onClick={handlePngExport}
              data-testid="export-button"
              contrast={true}
              disabled={!isFlatView || exportStatus !== "idle"}
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
                        : !titleCanMarquee
                          ? "Need Longer Title"
                          : "Export Animated GIF"
                }
                onClick={handleGifExport}
                data-testid="gif-export-button"
                contrast={true}
                disabled={!isPreviewView || !titleCanMarquee || exportStatus !== "idle"}
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

        {exportStageContent && (
          <div className="mb-4 flex w-full max-w-[30rem] items-center justify-center">
            <div
              data-testid="export-stage-panel"
              aria-live="polite"
              className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white/88 px-4 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.1)] backdrop-blur-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  exportStatus === "success"
                    ? "bg-green-500 text-white"
                    : exportStatus === "error"
                      ? "bg-red-500 text-white"
                      : "bg-black text-white"
                }`}
              >
                {exportStatus === "success" ? (
                  <Check className="h-5 w-5" />
                ) : exportStatus === "error" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : exportStatus === "sharing" ? (
                  activeExportKind === "gif" ? (
                    <Film className="h-5 w-5" />
                  ) : (
                    <Share className="h-5 w-5" />
                  )
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                  {exportStageContent.eyebrow}
                </div>
                <div
                  data-testid="export-stage-title"
                  className="mt-0.5 text-[13px] font-semibold text-black/80"
                >
                  {exportStageContent.title}
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-black/60">
                  {exportStageContent.description}
                </div>
              </div>
            </div>
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
                  : "This title fits. Use a longer song title to trigger the crawl."}
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
                data-export-shell={useExportSafeVisuals ? "true" : "false"}
                className="p-12"
                style={{
                  backgroundColor: "transparent",
                }}
              >
                <div
                  className="relative w-[370px] h-[620px] rounded-[36px] border border-white/45 transition-all duration-300 flex flex-col items-center justify-between p-6"
                  style={{
                    borderColor: "var(--ipod-shell-border)",
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
