"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback(
    (clientX: number) => {
      if (progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.min(Math.max(x / rect.width, 0), 1);
        onSeek(percentage * duration);
      }
    },
    [duration, onSeek],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    setActivePointerId(e.pointerId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    handleDrag(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!isDragging || activePointerId !== e.pointerId) return;
    handleDrag(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (activePointerId !== e.pointerId) return;
    setIsDragging(false);
    setActivePointerId(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (activePointerId !== e.pointerId) return;
    setIsDragging(false);
    setActivePointerId(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const safeDuration = Math.max(duration, 1);
  const progress = Math.min(Math.max((currentTime / safeDuration) * 100, 0), 100);

  return (
    <div className="w-full">
      <div
        ref={progressRef}
        data-testid="progress-track"
        className={`relative h-[10px] w-full overflow-hidden rounded-[2px] border ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          backgroundColor: "var(--ipod-progress-track-bg)",
          borderColor: "var(--ipod-progress-track-border)",
          boxShadow: "var(--ipod-progress-track-shadow)",
          touchAction: "none",
        }}
      >
        <div className="absolute inset-[1px] overflow-hidden rounded-[1px]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.04) 100%)",
            }}
          />
          <div
            data-testid="progress-fill"
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{
              width: `${progress}%`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "var(--ipod-progress-fill)",
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-[45%]"
              style={{
                background: "var(--ipod-progress-fill-gloss)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
