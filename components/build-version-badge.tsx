"use client";

import { useEffect, useMemo, useState } from "react";

interface BuildVersionBadgeProps {
  initialVersion: string;
}

interface NextDataWindow extends Window {
  __NEXT_DATA__?: {
    buildId?: string;
  };
}

function normalizeVersion(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  if (trimmed === "dev") return "dev";
  return trimmed.slice(0, 12);
}

export function BuildVersionBadge({ initialVersion }: BuildVersionBadgeProps) {
  const [version, setVersion] = useState(() => normalizeVersion(initialVersion));

  useEffect(() => {
    if (version !== "dev" && version !== "unknown") {
      return;
    }

    const nextData = window as NextDataWindow;
    const runtimeBuildId = nextData.__NEXT_DATA__?.buildId;
    if (runtimeBuildId) {
      setVersion(normalizeVersion(runtimeBuildId));
    }
  }, [version]);

  const label = useMemo(() => {
    if (version === "dev") {
      return "build dev";
    }
    return `build ${version}`;
  }, [version]);

  return (
    <div className="fixed left-4 bottom-4 z-50 pointer-events-none select-none">
      <div className="rounded-full border border-black/15 bg-white/78 px-3 py-1 font-mono text-[11px] tracking-[0.02em] text-black/70 shadow-[0_4px_14px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}
