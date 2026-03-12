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
  exportSafe?: boolean;
}

export function ClickWheel({
  playClick,
  onSeek,
  onCenterClick,
  className,
  style,
  disabled = false,
  exportSafe = false,
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel || disabled) return;

    let activePointerId: number | null = null;
    let lastAngle = 0;

    const calculateAngle = (clientX: number, clientY: number) => {
      const rect = wheel.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      activePointerId = event.pointerId;
      lastAngle = calculateAngle(event.clientX, event.clientY);
      wheel.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      event.preventDefault();

      const currentAngle = calculateAngle(event.clientX, event.clientY);
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

    const handlePointerEnd = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      wheel.releasePointerCapture?.(event.pointerId);
    };

    wheel.addEventListener("pointerdown", handlePointerDown, { passive: false });
    wheel.addEventListener("pointermove", handlePointerMove, { passive: false });
    wheel.addEventListener("pointerup", handlePointerEnd);
    wheel.addEventListener("pointercancel", handlePointerEnd);
    wheel.addEventListener("lostpointercapture", handlePointerEnd);

    return () => {
      wheel.removeEventListener("pointerdown", handlePointerDown);
      wheel.removeEventListener("pointermove", handlePointerMove);
      wheel.removeEventListener("pointerup", handlePointerEnd);
      wheel.removeEventListener("pointercancel", handlePointerEnd);
      wheel.removeEventListener("lostpointercapture", handlePointerEnd);
    };
  }, [onSeek, playClick, disabled]);

  return (
    <div
      ref={wheelRef}
      className={`relative w-[240px] h-[240px] touch-none rounded-full ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${className}`}
      style={style}
      data-export-wheel={exportSafe ? "true" : "false"}
    >
      {/* Wheel Surface - Clean Matte Look */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, var(--ipod-wheel-surface-top) 0%, var(--ipod-wheel-surface-bottom) 100%)",
          border: "1px solid var(--ipod-wheel-border)",
          boxShadow: "var(--ipod-wheel-shadow)",
        }}
        data-export-layer="wheel"
      >
        {/* Subtle analog sheen and bevel */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 33% 24%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 34%, rgba(0,0,0,0.015) 100%)",
          }}
        />
        <div
          className="absolute inset-[1px] rounded-full pointer-events-none"
          style={{
            background:
              "conic-gradient(from 225deg, rgba(0,0,0,0.03), rgba(255,255,255,0.06), rgba(0,0,0,0.015), rgba(255,255,255,0.05), rgba(0,0,0,0.03))",
            mixBlendMode: "normal",
            opacity: 0.08,
          }}
        />
        <div
          className="absolute inset-[3px] rounded-full border pointer-events-none"
          style={{
            borderColor: "var(--ipod-wheel-highlight-border)",
          }}
        />
        <div
          className="absolute inset-[31%] rounded-full border pointer-events-none"
          style={{
            borderColor: "var(--ipod-wheel-inner-border)",
          }}
        />

        {/* Button Labels */}
        <div
          className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[12px] font-bold tracking-widest uppercase pointer-events-none font-sans"
          style={{ color: "var(--ipod-wheel-label)" }}
        >
          Menu
        </div>

        {/* Play/Pause Button - Adjusted SVG to fix overlap */}
        <div
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 pointer-events-none flex gap-1 items-center"
          style={{ color: "var(--ipod-wheel-label)" }}
        >
          <Play className="w-4 h-4 fill-current" />
          <Pause className="w-4 h-4 fill-current" />
        </div>

        <div
          className="absolute left-[12%] top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--ipod-wheel-label)" }}
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </div>
        <div
          className="absolute right-[12%] top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--ipod-wheel-label)" }}
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </div>
      </div>

      {/* Center halo ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] rounded-full border pointer-events-none"
        style={{ borderColor: "var(--ipod-wheel-halo)" }}
      />

      {/* Center Button */}
      <div
        className={`absolute top-1/2 left-1/2 z-20 h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform ${
          disabled ? "cursor-default" : "active:scale-95 cursor-pointer"
        }`}
        style={{
          background:
            "linear-gradient(180deg, var(--ipod-wheel-center-top) 0%, var(--ipod-wheel-center-bottom) 100%)",
          borderColor: "var(--ipod-wheel-center-border)",
          boxShadow: "var(--ipod-wheel-center-shadow)",
        }}
        data-export-layer="wheel-center"
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
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0) 40%)",
            boxShadow:
              "inset 1px 1px 2px rgba(255,255,255,0.42), inset -1px -1px 2px rgba(0,0,0,0.02)",
          }}
        />
      </div>
    </div>
  );
}
