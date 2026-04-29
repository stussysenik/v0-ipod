"use client";

import { screenChromeTokens } from "@/lib/design-system";

export function IpodGlassOverlay({ exportSafe = false }: { exportSafe?: boolean }) {
  const glassOverlay = {
    background: exportSafe
      ? screenChromeTokens.frame.glassOverlayExport
      : screenChromeTokens.frame.glassOverlayLive,
  };

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={glassOverlay}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[11px] top-[9px] h-[32%] w-[48%] rounded-[18px] opacity-25"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.024) 18%, rgba(255,255,255,0) 58%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
