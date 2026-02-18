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
  const wheelShadow =
    "0 22px 30px -24px rgba(0,0,0,0.46), 0 8px 16px -18px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.06)";
  const centerShadow =
    "0 10px 14px -12px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)";

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
        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#F9F9F9] to-[#F0F0F0]"
        style={{ boxShadow: wheelShadow }}
      >
        {/* Subtle analog sheen and bevel */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.24) 34%, rgba(0,0,0,0.04) 100%)",
          }}
        />
        <div
          className="absolute inset-[1px] rounded-full pointer-events-none"
          style={{
            background:
              "conic-gradient(from 225deg, rgba(0,0,0,0.05), rgba(255,255,255,0.1), rgba(0,0,0,0.02), rgba(255,255,255,0.08), rgba(0,0,0,0.05))",
            mixBlendMode: "soft-light",
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-[3px] rounded-full border border-white/65 pointer-events-none" />
        <div className="absolute inset-[31%] rounded-full border border-black/[0.045] pointer-events-none" />

        {/* Button Labels */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#C7C7C7] tracking-widest uppercase pointer-events-none font-sans">
          Menu
        </div>

        {/* Play/Pause Button - Adjusted SVG to fix overlap */}
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[#C7C7C7] pointer-events-none flex gap-1 items-center">
          <Play className="w-4 h-4 fill-current" />
          <Pause className="w-4 h-4 fill-current" />
        </div>

        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 text-[#C7C7C7] pointer-events-none">
          <SkipBack className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute right-[12%] top-1/2 -translate-y-1/2 text-[#C7C7C7] pointer-events-none">
          <SkipForward className="w-5 h-5 fill-current" />
        </div>
      </div>

      {/* Center halo ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] rounded-full border border-black/[0.05] pointer-events-none" />

      {/* Center Button */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-full bg-gradient-to-b from-[#F9F9F9] to-[#ECECEC] transition-transform z-20 border border-[#E6E6E6] ${
          disabled ? "cursor-default" : "active:scale-95 cursor-pointer"
        }`}
        style={{ boxShadow: centerShadow }}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          playClick();
          onCenterClick && onCenterClick();
        }}
      >
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 44%)",
            boxShadow:
              "inset 2px 2px 4px rgba(255,255,255,0.75), inset -2px -2px 4px rgba(0,0,0,0.035)",
          }}
        />
      </div>
    </div>
  );
}
