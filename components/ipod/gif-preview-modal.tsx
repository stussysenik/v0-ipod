"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Repeat, RotateCcw, X, MonitorUp, Loader2 } from "lucide-react";
import { getExportPreset, type ExportPresetId } from "@/lib/export-scene";

declare global {
  interface Window {
    __ipodGifPreviewPerf?: {
      pendingAt: number | null;
      lastDeltaMs: number | null;
      start: () => void;
      complete: () => void;
      reset: () => void;
      getLastDelta: () => number | null;
    };
  }
}

function ensureGifPreviewPerf() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.__ipodGifPreviewPerf) {
    window.__ipodGifPreviewPerf = {
      pendingAt: null,
      lastDeltaMs: null,
      start() {
        this.pendingAt = performance.now();
        this.lastDeltaMs = null;
        performance.clearMarks("gif-preview-control-start");
        performance.clearMarks("gif-preview-visual-ready");
        performance.clearMeasures("gif-preview-control-latency");
        performance.mark("gif-preview-control-start");
      },
      complete() {
        if (this.pendingAt === null) return;
        performance.mark("gif-preview-visual-ready");
        performance.measure(
          "gif-preview-control-latency",
          "gif-preview-control-start",
          "gif-preview-visual-ready",
        );
        this.lastDeltaMs = performance.now() - this.pendingAt;
        this.pendingAt = null;
      },
      reset() {
        this.pendingAt = null;
        this.lastDeltaMs = null;
        performance.clearMarks("gif-preview-control-start");
        performance.clearMarks("gif-preview-visual-ready");
        performance.clearMeasures("gif-preview-control-latency");
      },
      getLastDelta() {
        return this.lastDeltaMs;
      },
    };
  }

  return window.__ipodGifPreviewPerf;
}

interface GifPreviewModalProps {
  open: boolean;
  frames: string[];
  frameDelayMs: number;
  presetId: ExportPresetId;
  isPreparing: boolean;
  progress: number;
  error?: string | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenRecordingWindow: () => void;
}

export function GifPreviewModal({
  open,
  frames,
  frameDelayMs,
  presetId,
  isPreparing,
  progress,
  error,
  onClose,
  onRetry,
  onOpenRecordingWindow,
}: GifPreviewModalProps) {
  const preset = getExportPreset(presetId);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const playbackTimerRef = useRef<number | null>(null);
  const currentFrameSrc = frames[currentFrameIndex] ?? frames[0] ?? null;
  const totalFrames = frames.length;

  const progressPercent = useMemo(() => Math.round(progress * 100), [progress]);

  const beginPerfInteraction = useCallback(() => {
    ensureGifPreviewPerf()?.start();
  }, []);

  useEffect(() => {
    if (!open) return;
    ensureGifPreviewPerf()?.reset();
  }, [open]);

  useEffect(() => {
    if (!open || totalFrames === 0 || !isPlaying || isPreparing) {
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    playbackTimerRef.current = window.setTimeout(() => {
      setCurrentFrameIndex((current) => {
        const next = current + 1;
        if (next < totalFrames) {
          return next;
        }
        if (isLooping) {
          return 0;
        }
        setIsPlaying(false);
        return current;
      });
    }, frameDelayMs);

    return () => {
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [
    frameDelayMs,
    isLooping,
    isPlaying,
    isPreparing,
    open,
    totalFrames,
    currentFrameIndex,
  ]);

  useEffect(() => {
    if (!open) return;
    const perf = ensureGifPreviewPerf();
    if (!perf || perf.pendingAt === null) return;

    const rafId = requestAnimationFrame(() => {
      perf.complete();
    });

    return () => cancelAnimationFrame(rafId);
  }, [open, currentFrameIndex, isLooping, isPlaying]);

  useEffect(() => {
    if (!open) return;
    if (totalFrames === 0) return;
    setCurrentFrameIndex((current) => Math.min(current, totalFrames - 1));
  }, [open, totalFrames]);

  useEffect(() => {
    if (!open) {
      setCurrentFrameIndex(0);
      setIsPlaying(true);
      setIsLooping(true);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <div className="grid w-full max-w-6xl gap-4 rounded-[28px] border border-white/30 bg-[#F2F1ED] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-black/10 bg-[#E7E5DF] p-4">
          <div
            className="flex max-h-[75vh] w-full items-center justify-center"
            style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
            data-testid="gif-preview-stage"
          >
            {isPreparing ? (
              <div className="flex flex-col items-center gap-3 text-[#111827]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm font-semibold">
                  Preparing preview {progressPercent}%
                </p>
              </div>
            ) : error ? (
              <div className="max-w-sm text-center text-[#111827]">
                <p className="text-lg font-semibold">Preview failed</p>
                <p className="mt-2 text-sm text-[#4B5563]">{error}</p>
              </div>
            ) : currentFrameSrc ? (
              <img
                src={currentFrameSrc}
                alt="GIF preview frame"
                className="max-h-[75vh] max-w-full rounded-[22px] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
                data-testid="gif-preview-image"
              />
            ) : (
              <p className="text-sm font-semibold text-[#111827]">Preview is empty</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border border-black/10 bg-white/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                Preview / Record
              </p>
              <p className="mt-1 text-sm text-[#374151]">
                Clean stage for manual screen recording or screenshots.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 p-2 text-[#111827] transition-colors hover:bg-black/5"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F6F5F1] px-3 py-2 text-xs text-[#4B5563]">
            <p>Preset: {preset.label}</p>
            <p>Frames: {totalFrames}</p>
            <p>Timing: {frameDelayMs}ms per frame</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                beginPerfInteraction();
                setIsPlaying((current) => !current);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="gif-preview-play-toggle"
              disabled={isPreparing || totalFrames === 0}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                beginPerfInteraction();
                setCurrentFrameIndex(0);
                setIsPlaying(true);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="gif-preview-restart"
              disabled={isPreparing || totalFrames === 0}
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </button>
            <button
              type="button"
              onClick={() => {
                beginPerfInteraction();
                setIsLooping((current) => !current);
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                isLooping
                  ? "border-[#111827] bg-[#111827] text-white"
                  : "border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              data-testid="gif-preview-loop-toggle"
              disabled={isPreparing || totalFrames === 0}
            >
              <Repeat className="h-4 w-4" />
              {isLooping ? "Looping" : "Loop Off"}
            </button>
            <button
              type="button"
              onClick={onOpenRecordingWindow}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="gif-preview-record-window"
              disabled={isPreparing || totalFrames === 0}
            >
              <MonitorUp className="h-4 w-4" />
              Pop Out
            </button>
          </div>

          <div className="space-y-2 rounded-2xl border border-black/10 bg-[#F6F5F1] p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#374151]">
              <span>Frame</span>
              <span data-testid="gif-preview-frame-readout">
                {totalFrames === 0
                  ? "0 / 0"
                  : `${currentFrameIndex + 1} / ${totalFrames}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(totalFrames - 1, 0)}
              step={1}
              value={Math.min(currentFrameIndex, Math.max(totalFrames - 1, 0))}
              onChange={(event) => {
                beginPerfInteraction();
                setCurrentFrameIndex(Number(event.target.value));
                setIsPlaying(false);
              }}
              className="w-full"
              data-testid="gif-preview-scrubber"
              disabled={isPreparing || totalFrames === 0}
            />
          </div>

          {error ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]"
              data-testid="gif-preview-retry"
            >
              Retry Preview
            </button>
          ) : (
            <p className="text-xs leading-5 text-[#4B5563]">
              The image area is intentionally clean. Use this view or the pop-out window
              if GIF download fails and you need a manual screen recording fallback.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
