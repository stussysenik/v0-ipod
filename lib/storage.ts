import type { SongMetadata } from "@/types/ipod";

const METADATA_STORAGE_KEY = "ipodSnapshotMetadata";
const UI_STORAGE_KEY = "ipodSnapshotUiState";
const SNAPSHOT_STORAGE_KEY = "ipodSnapshotSongSnapshot";
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export type IpodViewMode = "flat" | "3d" | "focus";

export interface IpodUiState {
  skinColor: string;
  bgColor: string;
  viewMode: IpodViewMode;
}

export interface SongSnapshot {
  metadata: SongMetadata;
  ui: IpodUiState;
}

export function loadMetadata(): Partial<SongMetadata> | null {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<SongMetadata>;
  } catch {
    return null;
  }
}

export function saveMetadata(state: SongMetadata): void {
  try {
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

function isViewMode(value: unknown): value is IpodViewMode {
  return value === "flat" || value === "3d" || value === "focus";
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

function isSongMetadata(value: unknown): value is SongMetadata {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SongMetadata>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.artist === "string" &&
    typeof candidate.album === "string" &&
    typeof candidate.artwork === "string" &&
    typeof candidate.duration === "number" &&
    typeof candidate.currentTime === "number" &&
    typeof candidate.rating === "number" &&
    typeof candidate.trackNumber === "number" &&
    typeof candidate.totalTracks === "number"
  );
}

export function loadUiState(): Partial<IpodUiState> | null {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const candidate = parsed as Partial<IpodUiState>;
    const safe: Partial<IpodUiState> = {};
    if (isHexColor(candidate.skinColor)) safe.skinColor = candidate.skinColor;
    if (isHexColor(candidate.bgColor)) safe.bgColor = candidate.bgColor;
    if (isViewMode(candidate.viewMode)) safe.viewMode = candidate.viewMode;
    return safe;
  } catch {
    return null;
  }
}

export function saveUiState(state: IpodUiState): void {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function loadSongSnapshot(): SongSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<SongSnapshot>;

    if (!isSongMetadata(candidate.metadata)) {
      return null;
    }
    if (
      !candidate.ui ||
      !isHexColor(candidate.ui.skinColor) ||
      !isHexColor(candidate.ui.bgColor) ||
      !isViewMode(candidate.ui.viewMode)
    ) {
      return null;
    }

    return {
      metadata: candidate.metadata,
      ui: candidate.ui,
    };
  } catch {
    return null;
  }
}

export function saveSongSnapshot(snapshot: SongSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors
  }
}
