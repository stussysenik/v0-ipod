"use client";

import { getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { screenChromeTokens } from "@/lib/design-system";
import { ScreenBattery } from "@/components/ipod/display/screen-battery";

interface IpodStatusBarProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  showOsMenu: boolean;
}

export function IpodStatusBar({ screenTokens, showOsMenu }: IpodStatusBarProps) {
  const statusBarTokens = screenChromeTokens.statusBar;

  return (
    <div
      className="flex items-center justify-between border-b"
      style={{
        height: screenTokens.statusBarHeight,
        paddingInline: screenTokens.statusBarPaddingX,
        backgroundImage: `linear-gradient(180deg, ${getSurfaceToken("screen.statusbar.bg.from")}, ${getSurfaceToken("screen.statusbar.bg.to")})`,
        borderColor: screenChromeTokens.statusBar.divider,
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
        <span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
      </div>
      <div className="flex items-center gap-[3px]">
        {!showOsMenu && (
          <svg
            aria-hidden="true"
            className="shrink-0"
            viewBox="0 0 10 9"
            style={{ width: 9, height: 8.5 }}
          >
            <path
              d="M1.2 0.75L8.35 4.5L1.2 8.25V0.75Z"
              fill={statusBarTokens.playIndicator}
              stroke="rgba(255,255,255,0.42)"
              strokeWidth="0.45"
              strokeLinejoin="round"
            />
            <path d="M2.2 1.7L6.95 4.2L2.2 4.2V1.7Z" fill="rgba(255,255,255,0.28)" />
          </svg>
        )}
        <ScreenBattery level={1} />
      </div>
    </div>
  );
}
