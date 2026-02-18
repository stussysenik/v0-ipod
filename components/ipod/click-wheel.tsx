"use client";

import { useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface ClickWheelProps {
  playClick: () => void;
  onSeek: (direction: number) => void;
  onCenterClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function ClickWheel({
  playClick,
  onSeek,
  onCenterClick,
  className,
  style,
  disabled = false,
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel || disabled) return;

    let isInternalDrag = false;
    let startAngle = 0;
    let lastAngle = 0;

    const calculateAngle = (e: MouseEvent | TouchEvent) => {
      const rect = wheel.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isInternalDrag = true;
      startAngle = calculateAngle(e);
      lastAngle = startAngle;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isInternalDrag) return;
      e.preventDefault();

      const currentAngle = calculateAngle(e);
      let delta = currentAngle - lastAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      if (Math.abs(delta) > 15) {
        const direction = delta > 0 ? 1 : -1;
        onSeek(direction);
        playClick();
        lastAngle = currentAngle;
      }
    };

    const handleEnd = () => {
      isInternalDrag = false;
    };

    wheel.addEventListener("mousedown", handleStart);
    wheel.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    return () => {
      wheel.removeEventListener("mousedown", handleStart);
      wheel.removeEventListener("touchstart", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [onSeek, playClick, disabled]);

  return (
    <div
      ref={wheelRef}
      className={`relative w-[240px] h-[240px] touch-none rounded-full ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${className}`}
      style={style}
    >
      {/* Wheel Surface - Clean Matte Look */}
      <div
        className="absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08),_inset_0_1px_2px_rgba(255,255,255,0.6)] bg-[#F5F5F5]"
      >
        {/* Button Labels */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#CCC] tracking-widest uppercase pointer-events-none font-sans">
          Menu
        </div>

        {/* Play/Pause Button - Adjusted SVG to fix overlap */}
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[#CCC] pointer-events-none flex gap-1 items-center">
          <Play className="w-4 h-4 fill-current" />
          <Pause className="w-4 h-4 fill-current" />
        </div>

        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 text-[#CCC] pointer-events-none">
          <SkipBack className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute right-[12%] top-1/2 -translate-y-1/2 text-[#CCC] pointer-events-none">
          <SkipForward className="w-5 h-5 fill-current" />
        </div>
      </div>

      {/* Center Button */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-full bg-linear-to-b from-white to-[#F0F0F0] shadow-[0_2px_5px_rgba(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,1)] transition-transform z-20 border border-[#EBEBEB] ${
          disabled ? "cursor-default" : "active:scale-95 cursor-pointer"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          playClick();
          onCenterClick && onCenterClick();
        }}
      />
    </div>
  );
}
