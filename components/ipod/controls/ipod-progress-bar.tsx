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

  return (
    <div className="w-full">
      <div
        ref={progressRef}
        data-testid="progress-track"
        className={`relative w-full overflow-hidden border ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          height: trackHeight,
          borderRadius: Math.max(1, Math.round(trackHeight / 3)),
          borderColor: "#AEAEAB",
          background:
            "linear-gradient(180deg, rgba(251,251,249,1) 0%, rgba(238,238,234,1) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.42), inset 0 1px 2px rgba(0,0,0,0.08)",
          touchAction: "none",
        }}
      >
        <div
          data-testid="progress-fill"
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress}%`,
            backgroundImage:
              "linear-gradient(180deg, rgba(123,195,246,1) 0%, rgba(63,145,222,1) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)",
          }}
        />
      </div>
    </div>
  );
}
