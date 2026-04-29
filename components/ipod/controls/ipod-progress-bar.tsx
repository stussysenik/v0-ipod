"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";

interface IpodProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
  trackHeight?: number;
}

export function IpodProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  trackHeight = 7,
}: IpodProgressBarProps) {
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
  const visibleProgress = progress > 0 ? Math.max(progress, 1.9) : 0;
  const visualTrackHeight = Math.max(trackHeight, 8);

  return (
    <div className="w-full flex items-center h-full">
      <div
        ref={progressRef}
        data-testid="progress-track"
        className={`relative w-full border ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          height: visualTrackHeight,
          borderRadius: 2,
          borderColor: "#b8b8b8",
          borderTopColor: "#9e9e9e",
          background: "linear-gradient(to bottom, #fdfdfd, #f1f1f1 40%, #e5e5e5)",
          boxShadow: "inset 0 1px 1px rgba(0,0,0,.15)",
          touchAction: "none",
        }}
      >
        <div
          data-testid="progress-fill"
          className="absolute inset-y-0 left-0"
          style={{
            width: `${visibleProgress}%`,
            background:
              "linear-gradient(to bottom, #b8e0ff 0%, #7fc1ff 15%, #3a9cf5 50%, #1e7fd8 51%, #5aa8f0 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
            maxWidth: "100%",
            borderRadius: "1px 0 0 1px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[5px]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.75), rgba(255,255,255,0.15))",
            borderRadius: "1px 1px 0 0",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
