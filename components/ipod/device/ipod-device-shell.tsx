"use client";

import { useMemo } from "react";
import {
  BASE_EXPORT_SCENE_HEIGHT,
  BASE_EXPORT_SCENE_WIDTH,
} from "@/lib/export/export-scene";

/**
 * Physical enclosure for the iPod device.
 *
 * This component is intentionally limited to the outer body and its material
 * treatment. It should not own playback logic, screen scene logic, or click
 * wheel behavior. Those concerns are passed in as composed child assemblies.
 */
interface IPodDeviceShellProps {
  skinColor: string;
  screen: React.ReactNode;
  wheel: React.ReactNode;
  exportSafe?: boolean;
  showShadowLayer?: boolean;
  dataTestId?: string;
}

/**
 * Render the outer shell assembly around the display and click wheel.
 *
 * Naming note:
 * - "shell" refers to the enclosure only
 * - "screen" is the composed display assembly inserted into the enclosure
 * - "wheel" is the composed input assembly inserted into the enclosure
 */
export function IPodDeviceShell({
  skinColor,
  screen,
  wheel,
  exportSafe = false,
  showShadowLayer = false,
  dataTestId,
}: IPodDeviceShellProps) {
  const shellShadow =
    "0 20px 34px -24px rgba(0,0,0,0.42), 0 42px 58px -44px rgba(0,0,0,0.34), inset 0 2px 0 rgba(255,255,255,0.52), inset 0 -1px 0 rgba(0,0,0,0.1)";
  const shellSurfaceStyle = useMemo(
    () => ({
      backgroundColor: skinColor,
      backgroundImage: [
        "linear-gradient(158deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0) 34%)",
        "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.08) 100%)",
        "radial-gradient(circle at 50% 102%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0) 44%)",
      ].join(", "),
    }),
    [skinColor],
  );

  return (
    <div
      className="relative"
      style={{
        width: `${BASE_EXPORT_SCENE_WIDTH}px`,
        height: `${BASE_EXPORT_SCENE_HEIGHT}px`,
      }}
      data-testid={dataTestId}
    >
      {/* Ground contact shadows anchor the device in the preview scene. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[510px] h-[88px] w-[248px] -translate-x-1/2 rounded-full opacity-70 blur-[30px]"
        style={{
          background:
            "radial-gradient(circle, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.16) 42%, rgba(0,0,0,0) 74%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[522px] h-[42px] w-[196px] -translate-x-1/2 rounded-full opacity-50 blur-[18px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 78%)",
        }}
        aria-hidden="true"
      />
      <div className="relative p-12">
        <div
          className="relative flex h-[620px] w-[370px] flex-col items-center justify-between overflow-hidden rounded-[36px] border border-white/45 p-6 transition-all duration-300"
          style={{
            ...shellSurfaceStyle,
            boxShadow: shellShadow,
          }}
          data-export-layer="shell"
        >
          {(showShadowLayer || exportSafe) && (
            <div
              className="absolute inset-0 rounded-[36px]"
              style={{
                boxShadow:
                  "0 20px 34px -24px rgba(0,0,0,0.42), 0 42px 58px -44px rgba(0,0,0,0.34)",
              }}
              aria-hidden="true"
              data-export-layer="shell-shadow"
            />
          )}
          <div
            className="pointer-events-none absolute inset-[3px] rounded-[33px]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 -14px 24px rgba(0,0,0,0.035)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-[9%] top-[3.5%] h-[34%] w-[76%] rounded-[88px] opacity-50"
            style={{
              background:
                "linear-gradient(166deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0) 54%)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-[7%] bottom-[6%] h-[22%] rounded-[72px] opacity-28"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.07) 74%, rgba(0,0,0,0.11) 100%)",
            }}
            aria-hidden="true"
          />
          {/* Child assemblies stay above the finish overlays so they read as parts. */}
          <div className="relative z-10 w-full">{screen}</div>
          <div className="relative z-10 -mt-4 flex flex-1 items-center justify-center">
            {wheel}
          </div>
        </div>
      </div>
    </div>
  );
}
