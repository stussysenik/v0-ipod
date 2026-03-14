"use client";

import { useMemo } from "react";
import type { SongMetadata } from "@/types/ipod";

interface AsciiIpodProps {
  state: SongMetadata;
}

const COLS = 30;
const PROGRESS_COLS = 27;

function formatTime(seconds: number, isRemaining: boolean): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  return `${isRemaining ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + " ".repeat(width - text.length);
}

function renderStars(rating: number): string {
  const filled = Math.min(Math.max(Math.round(rating), 0), 5);
  return "*".repeat(filled) + ".".repeat(5 - filled);
}

export function AsciiIpod({ state }: AsciiIpodProps) {
  const remaining = Math.max(state.duration - state.currentTime, 0);
  const elapsed = formatTime(state.currentTime, false);
  const remainingStr = formatTime(remaining, true);

  const ascii = useMemo(() => {
    const filledCount =
      state.duration > 0
        ? Math.round((state.currentTime / state.duration) * PROGRESS_COLS)
        : 0;
    const emptyCount = PROGRESS_COLS - filledCount;
    const progressBar = "▓".repeat(filledCount) + "░".repeat(emptyCount);

    const title = truncate(state.title, 18);
    const artist = truncate(state.artist, 18);
    const album = truncate(state.album, 18);
    const trackInfo = `${state.trackNumber} of ${state.totalTracks}`;
    const stars = renderStars(state.rating);
    const metaLine = `${trackInfo}  ${stars}`;

    // Time line: elapsed left-aligned, remaining right-aligned within 28 chars
    const timeInner = 28;
    const timeGap = Math.max(timeInner - elapsed.length - remainingStr.length, 1);
    const timeLine = ` ${elapsed}${" ".repeat(timeGap)}${remainingStr} `;

    const lines = [
      `┌${"─".repeat(COLS)}┐`,
      `│ > Now Playing${" ".repeat(COLS - 18)}[=] │`,
      `├────────┬${"─".repeat(COLS - 9)}┤`,
      `│ ┌────┐ │ ${padRight(title, COLS - 11)} │`,
      `│ │ ♫  │ │ ${padRight(artist, COLS - 11)} │`,
      `│ │    │ │ ${padRight(album, COLS - 11)} │`,
      `│ └────┘ │ ${padRight(metaLine, COLS - 11)} │`,
      `├────────┴${"─".repeat(COLS - 9)}┤`,
      `│ ${progressBar}  │`,
      `│${timeLine}│`,
      `└${"─".repeat(COLS)}┘`,
    ];

    return lines.join("\n");
  }, [
    state.title,
    state.artist,
    state.album,
    state.currentTime,
    state.duration,
    state.trackNumber,
    state.totalTracks,
    state.rating,
    elapsed,
    remainingStr,
  ]);

  return (
    <div
      className="w-[322px] h-[240px] rounded-[10px] p-3 mx-auto z-10 shrink-0 relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#0a0a0a",
        boxShadow: "0 3px 0 rgba(0,0,0,0.84), 0 1px 5px rgba(0,0,0,0.32)",
      }}
      data-export-layer="screen"
      data-testid="ascii-screen"
    >
      <pre
        className="text-[11.5px] leading-[1.45] font-mono select-none whitespace-pre"
        style={{ color: "#33ff33", textShadow: "0 0 6px rgba(51,255,51,0.35)" }}
        data-testid="ascii-pre"
        data-export-time-value={state.currentTime}
        data-export-duration={state.duration}
      >
        {ascii}
      </pre>
    </div>
  );
}
