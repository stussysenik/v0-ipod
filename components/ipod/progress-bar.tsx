"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
  trackHeight?: number;
  variant?: "experimental" | "classic";
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  trackHeight = 7,
  variant = "classic",
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
  const isClassic = variant === "classic";

  return (
    <div className="w-full">
      <div
        ref={progressRef}
        data-testid="progress-track"
        className={`relative w-full overflow-visible ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          height: isClassic ? 12 : trackHeight,
          borderRadius: isClassic ? 0 : Math.max(1, Math.round(trackHeight / 3)),
          background: isClassic
            ? "#d1d1d1"
            : "linear-gradient(180deg, rgba(251,251,249,1) 0%, rgba(238,238,234,1) 100%)",
          boxShadow: isClassic
            ? "inset 0 1px 2px rgba(0,0,0,0.2)"
            : "inset 0 1px 0 rgba(255,255,255,0.42), inset 0 1px 2px rgba(0,0,0,0.08)",
          touchAction: "none",
        }}
      >
        <div
          data-testid="progress-fill"
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress}%`,
            backgroundColor: isClassic ? "#0099DD" : undefined,
            backgroundImage: isClassic
              ? "none"
              : "linear-gradient(180deg, rgba(123,195,246,1) 0%, rgba(63,145,222,1) 100%)",
            boxShadow: isClassic ? "none" : "inset 0 1px 0 rgba(255,255,255,0.26)",
          }}
        />
        {isClassic && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] z-10"
            style={{
              left: `${progress}%`,
              backgroundColor: "#f0f0f0",
              border: "1px solid #999",
              transform: "translateY(-50%) rotate(45deg)",
              boxShadow: "-1px 1px 3px rgba(0,0,0,0.3)",
              marginTop: "-1px",
            }}
          />
        )}
      </div>
    </div>
  );
}
