export function formatTimecode(seconds: number | null): string {
  const safe = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function parseTimecode(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [minutesRaw, secondsRaw] = trimmed.replace("-", "").split(":");
  const minutes = Number.parseInt(minutesRaw ?? "", 10);
  const seconds = Number.parseInt(secondsRaw ?? "", 10);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }
  if (minutes < 0 || seconds < 0 || seconds >= 60) {
    return null;
  }

  return minutes * 60 + seconds;
}
