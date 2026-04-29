"use client";

import { useRef, useEffect } from "react";
// No lucide imports — all wheel icons are hand-crafted SVGs matching real iPod hardware
import { getSurfaceToken, deriveWheelColors } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const WHEEL_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * Interactive click wheel assembly.
 *
 * This is a physical control surface, not an application-level toolbar. It is
 * responsible for rotational input and discrete hardware button presses while
 * remaining visually tied to the active hardware preset.
 */
interface IpodClickWheelProps {
  preset: IpodClassicPresetDefinition;
  skinColor?: string;
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

/**
 * Render the iPod click wheel as a self-contained hardware control assembly.
 */
export function IpodClickWheel({
  preset,
  skinColor,
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
}: IpodClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const derived = skinColor ? deriveWheelColors(skinColor) : null;
  const isWhite =
    skinColor?.toLowerCase() === "#ffffff" || skinColor?.toLowerCase() === "#f2f2f2";

  const wheelShadow = isWhite
    ? "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)"
    : exportSafe
      ? "0 0 0 1px rgba(92,96,104,0.1), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(0,0,0,0.05)"
      : "0 14px 18px -18px rgba(0,0,0,0.24), 0 8px 14px -18px rgba(0,0,0,0.14), 0 0 0 1px rgba(92,96,104,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)";

  const wheelBorder = derived?.border ?? getSurfaceToken("wheel.border");
  const wheelGradientFrom =
    derived?.gradient.from ?? getSurfaceToken("wheel.gradient.from");
  const wheelGradientVia = derived?.gradient.via ?? getSurfaceToken("wheel.gradient.via");
  const wheelGradientTo = derived?.gradient.to ?? getSurfaceToken("wheel.gradient.to");
  const wheelCenterBorder =
    derived?.centerBorder ?? getSurfaceToken("wheel.center.border");
  const wheelCenterFrom =
    derived?.centerGradient.from ?? getSurfaceToken("wheel.center.from");
  const wheelCenterVia =
    derived?.centerGradient.via ?? getSurfaceToken("wheel.center.via");
  const wheelCenterTo = derived?.centerGradient.to ?? getSurfaceToken("wheel.center.to");
  const wheelLabelColor = derived?.labelColor ?? getSurfaceToken("wheel.label");
  const wheelTokens = preset.wheel;

  const wheelSurfaceStyle = isWhite
    ? {
        backgroundColor: "#e8e8e8",
        backgroundImage:
          "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)",
      }
    : {
        backgroundImage: `linear-gradient(180deg, ${wheelGradientFrom}, ${wheelGradientVia}, ${wheelGradientTo})`,
      };

  const centerShadow = isWhite
    ? "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)"
    : exportSafe
      ? "0 0 0 1px rgba(92,96,104,0.05), inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)"
      : "0 4px 10px -12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(92,96,104,0.04), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(0,0,0,0.03)";

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel || disabled) return;

    let activePointerId: number | null = null;
    let lastAngle = 0;

    // Rotation is derived from pointer angle around the wheel center so the
    // interaction reads like a physical scrub gesture rather than a slider.
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
      const target = event.target as HTMLElement;
      if (
        target.closest('[data-testid="click-wheel-center"]') ||
        target.closest("button")
      )
        return;
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
      {/* Wheel surface, labels, and center button form one hardware subassembly. */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: isWhite ? "#d1d1d1" : wheelBorder,
          ...wheelSurfaceStyle,
          boxShadow: wheelShadow,
        }}
        data-export-layer="wheel"
        data-testid="click-wheel"
      >
        {/* Fine Wheel Rim Highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "inset 0 1px 0.5px rgba(255,255,255,0.45), inset 0 -0.5px 0.5px rgba(0,0,0,0.05)",
          }}
          aria-hidden="true"
        />

        {/* Subsurface texture for material depth */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute inset-[1px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 70%)",
          }}
        />

        {/* Center Button Cavity/Bezel */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: wheelTokens.centerSize + 2,
            height: wheelTokens.centerSize + 2,
            background: "rgba(0,0,0,0.15)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.1)",
          }}
        />

        {/* Button Labels */}
        <button
          type="button"
          data-testid="click-wheel-menu-button"
          className="absolute left-1/2 z-10 -translate-x-1/2 bg-transparent px-2 py-1 uppercase font-sans leading-none"
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
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center bg-transparent px-2 py-1 leading-none"
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
          <svg
            viewBox="0 0 24 16"
            fill="currentColor"
            style={{
              width: wheelTokens.playPauseIconSize * 1.5,
              height: wheelTokens.playPauseIconSize,
            }}
          >
            <polygon points="1,1 10,8 1,15" />
            <rect x="13" y="1" width="3.5" height="14" rx="0.5" />
            <rect x="19" y="1" width="3.5" height="14" rx="0.5" />
          </svg>
        </button>

        <button
          type="button"
          data-testid="click-wheel-prev-button"
          className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none"
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
          <svg
            viewBox="0 0 24 16"
            fill="currentColor"
            style={{
              width: wheelTokens.sideIconSize * 1.4,
              height: wheelTokens.sideIconSize,
            }}
          >
            <rect x="1" y="1" width="2.5" height="14" rx="0.5" />
            <polygon points="14,1 5,8 14,15" />
            <polygon points="23,1 14,8 23,15" />
          </svg>
        </button>
        <button
          type="button"
          data-testid="click-wheel-next-button"
          className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none"
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
          <svg
            viewBox="0 0 24 16"
            fill="currentColor"
            style={{
              width: wheelTokens.sideIconSize * 1.4,
              height: wheelTokens.sideIconSize,
            }}
          >
            <polygon points="1,1 10,8 1,15" />
            <polygon points="10,1 19,8 10,15" />
            <rect x="20.5" y="1" width="2.5" height="14" rx="0.5" />
          </svg>
        </button>
      </div>

      <div
        className={`absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-100 ${
          disabled
            ? "cursor-default"
            : "cursor-pointer active:scale-[0.96] active:shadow-none"
        }`}
        style={{
          width: wheelTokens.centerSize,
          height: wheelTokens.centerSize,
          borderColor: wheelCenterBorder,
          backgroundImage: `linear-gradient(180deg, ${wheelCenterFrom}, ${wheelCenterVia}, ${wheelCenterTo})`,
          boxShadow: centerShadow,
        }}
        data-export-layer="wheel-center"
        data-testid="click-wheel-center"
        role="button"
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleControlPress(onCenterClick);
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 80%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 60%)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
