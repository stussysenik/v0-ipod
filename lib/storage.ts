import type { SongMetadata } from "@/types/ipod";

const STORAGE_KEY = "ipodSnapshotMetadata";

export function loadMetadata(): Partial<SongMetadata> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}
