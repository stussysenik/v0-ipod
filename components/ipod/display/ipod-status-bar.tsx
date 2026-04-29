"use client";

import { getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { ScreenBattery } from "@/components/ipod/screen-battery";

interface IpodStatusBarProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  showOsMenu: boolean;
}

export function IpodStatusBar({ screenTokens, showOsMenu }: IpodStatusBarProps) {
  return (
    <div
      className="flex items-center justify-between border-b"
      style={{
        height: screenTokens.statusBarHeight,
        paddingInline: screenTokens.statusBarPaddingX,
        backgroundImage: `linear-gradient(180deg, ${getSurfaceToken("screen.statusbar.bg.from")}, ${getSurfaceToken("screen.statusbar.bg.to")})`,
        borderColor: "#9B9B9B",
      }}
    >
      <div
        className="flex items-center gap-[4px] font-semibold leading-none tracking-[-0.01em]"
        style={{
          color: getTextTokenCss("screen.statusbar.text"),
          fontSize: Math.max(7.5, screenTokens.statusBarHeight - 8),
        }}
        data-testid="screen-status-label"
      >
        {!showOsMenu && <span className="text-[7px] text-[#3B79C4]">▶</span>}
        <span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
      </div>
      <ScreenBattery />
    </div>
  );
}
