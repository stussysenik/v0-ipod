import type { MutableRefObject } from "react";
import {
  loadExportCounter,
  loadMetadata,
  loadSongSnapshot,
  loadUiState,
  saveExportCounter,
  saveMetadata,
  saveSongSnapshot,
  saveUiState,
} from "@/lib/ipod-state/storage";
import type { ExportStatus } from "@/lib/export-utils";
import type { IpodWorkbenchModel, SongSnapshot } from "./model";
import { buildPersistedUiState, buildSongSnapshot } from "./update";

export const CASE_CUSTOM_COLORS_KEY = "ipodSnapshotCaseCustomColors";
export const BG_CUSTOM_COLORS_KEY = "ipodSnapshotBgCustomColors";

function waitForFrameBoundary(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

export function loadPersistedWorkbenchModel(
  fallback: IpodWorkbenchModel,
): IpodWorkbenchModel {
  const savedMetadata = loadMetadata();
  const savedUi = loadUiState();

  return {
    metadata: {
      ...fallback.metadata,
      ...savedMetadata,
    },
    playback: {
      ...fallback.playback,
      currentTime: savedMetadata?.currentTime ?? fallback.playback.currentTime,
      duration: savedMetadata?.duration ?? fallback.playback.duration,
      selectionKind: savedUi?.selectionKind ?? fallback.playback.selectionKind,
      rangeStartTime:
        savedUi?.rangeStartTime !== undefined
          ? savedUi.rangeStartTime
          : fallback.playback.rangeStartTime,
      rangeEndTime:
        savedUi?.rangeEndTime !== undefined
          ? savedUi.rangeEndTime
          : fallback.playback.rangeEndTime,
    },
    presentation: {
      skinColor: savedUi?.skinColor ?? fallback.presentation.skinColor,
      bgColor: savedUi?.bgColor ?? fallback.presentation.bgColor,
      viewMode: savedUi?.viewMode ?? fallback.presentation.viewMode,
      hardwarePreset: savedUi?.hardwarePreset ?? fallback.presentation.hardwarePreset,
    },
    interaction: {
      interactionModel:
        savedUi?.interactionModel ?? fallback.interaction.interactionModel,
      osScreen: savedUi?.osScreen ?? fallback.interaction.osScreen,
      menuIndex: savedUi?.menuIndex ?? fallback.interaction.menuIndex,
      osOriginalMenuSplit:
        savedUi?.osOriginalMenuSplit ?? fallback.interaction.osOriginalMenuSplit,
      osNowPlayingLayout:
        savedUi?.osNowPlayingLayout ?? fallback.interaction.osNowPlayingLayout,
      isNowPlayingEditable: false,
      isPlaying: savedUi?.isPlaying ?? fallback.interaction.isPlaying,
    },
  };
}

export function persistWorkbenchModel(model: IpodWorkbenchModel): void {
  saveMetadata(model.metadata);
  saveUiState(buildPersistedUiState(model));
}

export function loadPersistedExportCounter(): number {
  return loadExportCounter();
}

export function savePersistedExportCounter(counter: number): void {
  saveExportCounter(counter);
}

export function loadPersistedSongSnapshot(): SongSnapshot | null {
  return loadSongSnapshot();
}

export function savePersistedSongSnapshot(snapshot: SongSnapshot): void {
  saveSongSnapshot(snapshot);
}

export function saveWorkbenchSnapshot(model: IpodWorkbenchModel): SongSnapshot {
  const snapshot = buildSongSnapshot(model);
  savePersistedSongSnapshot(snapshot);
  return snapshot;
}

export function playClickAudio(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
): void {
  if (!audioRef.current) {
    audioRef.current = new Audio("/click.mp3");
  }

  audioRef.current.currentTime = 0;
  audioRef.current.play().catch(() => {});
}

export function loadCustomColors(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function persistCustomColors(storageKey: string, colors: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(colors));
  } catch {
    // Ignore storage failures.
  }
}

export async function exportWorkbenchPng(
  element: HTMLElement,
  options: {
    filename: string;
    backgroundColor: string;
    onStatusChange: (status: ExportStatus) => void;
  },
) {
  await waitForFrameBoundary();
  const { exportImage } = await import("@/lib/export-utils");

  return exportImage(element, {
    filename: options.filename,
    backgroundColor: options.backgroundColor,
    pixelRatio: 4,
    constrainedFrame: true,
    onStatusChange: options.onStatusChange,
  });
}

export async function exportWorkbenchGif(
  element: HTMLElement,
  options: {
    filename: string;
    backgroundColor: string;
    onStatusChange: (status: ExportStatus) => void;
  },
) {
  await waitForFrameBoundary();
  const { exportAnimatedGif } = await import("@/lib/export-utils");

  return exportAnimatedGif(element, {
    filename: options.filename,
    backgroundColor: options.backgroundColor,
    constrainedFrame: true,
    onStatusChange: options.onStatusChange,
  });
}
