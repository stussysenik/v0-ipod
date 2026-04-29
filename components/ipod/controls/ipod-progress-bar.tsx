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
        className={`relative w-full overflow-hidden border ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          height: visualTrackHeight,
          borderRadius: 3,
          borderColor: "#d5d5d5",
          borderTopColor: "#c5c5c5",
          borderBottomColor: "#e0e0e0",
          background:
            "linear-gradient(to bottom, #ffffff 0%, #fdfdfd 5%, #f5f5f5 15%, #ebebeb 50%, #e8e8e8 70%, #f2f2f2 100%)",
          boxShadow:
            "inset 0 1px 2px rgba(0,0,0,0.1), inset 0 -1px 0 rgba(255,255,255,0.8)",
          touchAction: "none",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: 2,
          }}
        >
          <div
            data-testid="progress-fill"
            className="absolute inset-y-[1px] left-0"
            style={{
              width: `${visibleProgress}%`,
              borderRight: "1px solid #4a8fd6",
              background:
                "linear-gradient(to bottom, #ffffff 0%, #e8f2ff 8%, #b3d4f5 20%, #7fb4eb 45%, #5a9fe5 60%, #3f8de0 80%, #6aaee9 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              borderRadius: "2px 0 0 2px",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10"
            style={{
              height: "50%",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
