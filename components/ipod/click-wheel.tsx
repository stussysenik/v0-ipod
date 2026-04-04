"use client";

import { useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { getSurfaceToken } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const WHEEL_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface ClickWheelProps {
  preset: IpodClassicPresetDefinition;
  playClick: () => void;
  onSeek: (direction: number) => void;
  onCenterClick?: () => void;
  onMenuPress?: () => void;
  onPreviousPress?: () => void;
  onNextPress?: () => void;
  onPlayPausePress?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  exportSafe?: boolean;
}

export function ClickWheel({
  preset,
  playClick,
  onSeek,
  onCenterClick,
  onMenuPress,
  onPreviousPress,
  onNextPress,
  onPlayPausePress,
  className,
  style,
  disabled = false,
  exportSafe = false,
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelShadow = exportSafe
    ? "0 0 0 1px rgba(92,96,104,0.1), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(0,0,0,0.05)"
    : "0 14px 18px -18px rgba(0,0,0,0.24), 0 8px 14px -18px rgba(0,0,0,0.14), 0 0 0 1px rgba(92,96,104,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)";
  const centerShadow = exportSafe
    ? "inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)"
    : "0 4px 10px -12px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(0,0,0,0.03)";
  const wheelBorder = getSurfaceToken("wheel.border");
  const wheelGradientFrom = getSurfaceToken("wheel.gradient.from");
  const wheelGradientVia = getSurfaceToken("wheel.gradient.via");
  const wheelGradientTo = getSurfaceToken("wheel.gradient.to");
  const wheelCenterBorderColor = exportSafe
    ? "rgba(227,229,230,0.8)"
    : "rgba(227,229,230,0.56)";
  const wheelCenterFrom = getSurfaceToken("wheel.center.from");
  const wheelCenterVia = getSurfaceToken("wheel.center.via");
  const wheelCenterTo = getSurfaceToken("wheel.center.to");
  const wheelLabelColor = getSurfaceToken("wheel.label");
  const wheelTokens = preset.wheel;

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

  const handleControlPress = (callback?: () => void) => {
    if (disabled) return;
    playClick();
    callback?.();
  };

  return (
    <div
      ref={wheelRef}
      className={`relative touch-none rounded-full ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${className}`}
      style={{
        width: wheelTokens.size,
        height: wheelTokens.size,
        ...style,
      }}
    >
      {/* Wheel Surface */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: wheelBorder,
          backgroundImage: `linear-gradient(180deg, ${wheelGradientFrom}, ${wheelGradientVia}, ${wheelGradientTo})`,
          boxShadow: wheelShadow,
        }}
        data-export-layer="wheel"
        data-testid="click-wheel"
      >
        <div
          className="pointer-events-none absolute inset-[2px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 34% 22%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 32%, rgba(255,255,255,0) 56%)",
          }}
        />
        <div className="pointer-events-none absolute inset-[3px] rounded-full border border-white/45" />
        <div
          className="pointer-events-none absolute inset-x-[18%] bottom-[11%] h-[12%] rounded-full opacity-20"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.045) 100%)",
          }}
        />

        {/* Button Labels */}
        <button
          type="button"
          data-testid="click-wheel-menu-button"
          className="absolute left-1/2 z-10 -translate-x-1/2 bg-transparent p-0 uppercase font-sans leading-none"
          style={{
            top: wheelTokens.menuTopInset,
            color: wheelLabelColor,
            fontSize: wheelTokens.labelFontSize,
            fontWeight: 700,
            letterSpacing: wheelTokens.labelTracking,
            fontFamily: WHEEL_FONT_FAMILY,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            handleControlPress(onMenuPress);
          }}
          disabled={disabled}
          aria-label="Menu"
        >
          Menu
        </button>

        <button
          type="button"
          data-testid="click-wheel-playpause-button"
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 bg-transparent p-0 leading-none"
          style={{
            bottom: wheelTokens.bottomInset,
            color: wheelLabelColor,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            handleControlPress(onPlayPausePress);
          }}
          disabled={disabled}
          aria-label="Play or pause"
        >
          <Play
            className="fill-current"
            style={{ width: wheelTokens.playPauseIconSize, height: wheelTokens.playPauseIconSize }}
          />
          <Pause
            className="fill-current"
            style={{ width: wheelTokens.playPauseIconSize, height: wheelTokens.playPauseIconSize }}
          />
        </button>

        <button
          type="button"
          data-testid="click-wheel-prev-button"
          className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent p-0 leading-none"
          style={{
            left: wheelTokens.sideInset,
            color: wheelLabelColor,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            handleControlPress(onPreviousPress);
          }}
          disabled={disabled}
          aria-label="Previous"
        >
          <SkipBack
            className="fill-current"
            style={{ width: wheelTokens.sideIconSize, height: wheelTokens.sideIconSize }}
          />
        </button>
        <button
          type="button"
          data-testid="click-wheel-next-button"
          className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent p-0 leading-none"
          style={{
            right: wheelTokens.sideInset,
            color: wheelLabelColor,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            handleControlPress(onNextPress);
          }}
          disabled={disabled}
          aria-label="Next"
        >
          <SkipForward
            className="fill-current"
            style={{ width: wheelTokens.sideIconSize, height: wheelTokens.sideIconSize }}
          />
        </button>
      </div>

      <div
        className={`absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform ${
          disabled ? "cursor-default" : "cursor-pointer active:scale-[0.97]"
        }`}
        style={{
          width: wheelTokens.centerSize,
          height: wheelTokens.centerSize,
          borderColor: wheelCenterBorderColor,
          backgroundImage: `linear-gradient(180deg, ${wheelCenterFrom}, ${wheelCenterVia}, ${wheelCenterTo})`,
          boxShadow: centerShadow,
        }}
        data-export-layer="wheel-center"
        data-testid="click-wheel-center"
        onClick={(e) => {
          e.stopPropagation();
          handleControlPress(onCenterClick);
        }}
      >
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0) 58%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.78), inset 0 -1px 2px rgba(0,0,0,0.03)",
          }}
        />
      </div>
    </div>
  );
}
