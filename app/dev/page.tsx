"use client";

import { IpodClickWheel } from "@/components/ipod/controls/ipod-click-wheel";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { useCallback, useState } from "react";

const { wheel } = getIpodClassicPreset("classic-2008-black");
const w = wheel.size;
const c = wheel.centerSize;
const cr = c / 2;
const wr = w / 2;
const ring = wr - cr;

// SVG proportions from Wikipedia IPv4_wheel.svg
const svgCenter = 256;
const svgOuterR = 245;
const svgInnerR = 90;
const svgRing = svgOuterR - svgInnerR;

// MENU text in SVG: center y ≈ 48.65 from top of canvas 11
// Top of wheel at y=11, text center ≈ y=48.65
const svgMenuCenterY = 48.65;
const svgMenuFromEdge = svgMenuCenterY - (svgCenter - svgOuterR); // ≈ 37.65px from wheel edge
const svgMenuPctOuterEdge = svgMenuFromEdge / (svgOuterR * 2); // % of wheel diameter from outer edge

// Skip icons: center x ≈ 61.75 from left edge of canvas (11)
const svgSkipCenterX = 61.75;
const svgSkipFromEdge = svgSkipCenterX - (svgCenter - svgOuterR); // ≈ 50.75px from wheel edge
const svgSkipPctOuterEdge = svgSkipFromEdge / (svgOuterR * 2);

function px(pct: number, size: number) {
  return ((pct / 100) * size).toFixed(1);
}

export default function DevWheelCalibration() {
  const [showOverlay, setShowOverlay] = useState(true);

  const noop = useCallback(() => {}, []);
  const seekNoop = useCallback((_d: number) => {}, []);

  const menuCalPct = svgMenuPctOuterEdge * 100;
  const skipCalPct = svgSkipPctOuterEdge * 100;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zinc-900 p-8 text-white">
      <h1 className="text-lg font-bold">Wheel Proportion Calibration</h1>

      <div className="flex flex-wrap items-start justify-center gap-16">
        {/* Render zone */}
        <div className="relative">
          <IpodClickWheel
            preset={getIpodClassicPreset("classic-2008-black")}
            playClick={noop}
            onSeek={seekNoop}
            disabled
            className="border border-zinc-700"
          />

          {/* SVG proportion overlay */}
          {showOverlay && (
            <svg
              className="pointer-events-none absolute inset-0"
              viewBox={`0 0 ${w} ${w}`}
              width={w}
              height={w}
            >
              {/* Outer edge reference */}
              <circle
                cx={wr}
                cy={wr}
                r={wr - 0.5}
                fill="none"
                stroke="rgba(255,255,0,0.3)"
                strokeWidth={1}
                strokeDasharray="4 2"
              />

              {/* Center button reference */}
              <circle
                cx={wr}
                cy={wr}
                r={cr}
                fill="none"
                stroke="rgba(255,255,0,0.3)"
                strokeWidth={1}
                strokeDasharray="4 2"
              />

              {/* MENU SVG proportion line */}
              <line
                x1={0}
                y1={wr - wr * (1 - menuCalPct / 100)}
                x2={w}
                y2={wr - wr * (1 - menuCalPct / 100)}
                stroke="magenta"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={2}
                y={wr - wr * (1 - menuCalPct / 100) - 4}
                fill="magenta"
                fontSize={9}
              >
                MENU ref {menuCalPct.toFixed(1)}%
              </text>

              {/* PAUSE SVG proportion line */}
              <line
                x1={0}
                y1={wr + wr * (1 - menuCalPct / 100)}
                x2={w}
                y2={wr + wr * (1 - menuCalPct / 100)}
                stroke="magenta"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={2}
                y={wr + wr * (1 - menuCalPct / 100) + 10}
                fill="magenta"
                fontSize={9}
              >
                PAUSE ref {menuCalPct.toFixed(1)}%
              </text>

              {/* Skip left SVG proportion line */}
              <line
                x1={wr - wr * (1 - skipCalPct / 100)}
                y1={0}
                x2={wr - wr * (1 - skipCalPct / 100)}
                y2={w}
                stroke="cyan"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={wr - wr * (1 - skipCalPct / 100) + 4}
                y={20}
                fill="cyan"
                fontSize={9}
              >
                SKIP ref {skipCalPct.toFixed(1)}%
              </text>

              {/* Skip right SVG proportion line */}
              <line
                x1={wr + wr * (1 - skipCalPct / 100)}
                y1={0}
                x2={wr + wr * (1 - skipCalPct / 100)}
                y2={w}
                stroke="cyan"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={wr + wr * (1 - skipCalPct / 100) - 70}
                y={20}
                fill="cyan"
                fontSize={9}
              >
                SKIP ref {skipCalPct.toFixed(1)}%
              </text>

              {/* Crosshair center */}
              <line
                x1={wr - 10}
                y1={wr}
                x2={wr + 10}
                y2={wr}
                stroke="rgba(255,255,255,0.2)"
              />
              <line
                x1={wr}
                y1={wr - 10}
                x2={wr}
                y2={wr + 10}
                stroke="rgba(255,255,255,0.2)"
              />
            </svg>
          )}
        </div>

        {/* Data panel */}
        <div className="space-y-4 font-mono text-xs">
          <div className="rounded border border-zinc-700 p-4">
            <h2 className="mb-2 font-bold">Wheel: {w}px</h2>
            <p>Center button: {c}px (r={cr})</p>
            <p>Ring width: {ring}px</p>
          </div>

          <div className="rounded border border-zinc-700 p-4">
            <h2 className="mb-2 font-bold">SVG Proportions</h2>
            <p>Outer R: {svgOuterR}, Inner R: {svgInnerR}</p>
            <p>Ring width: {svgRing}px SVG units</p>
            <p className="text-magenta-400">
              MENU y-center: {svgMenuCenterY} (from top edge: {svgMenuFromEdge.toFixed(1)}px ={" "}
              {menuCalPct.toFixed(1)}% of diameter)
            </p>
            <p className="text-cyan-400">
              SKIP x-center: {svgSkipCenterX} (from edge: {svgSkipFromEdge.toFixed(1)}px ={" "}
              {skipCalPct.toFixed(1)}% of diameter)
            </p>
          </div>

          <div className="rounded border border-zinc-700 p-4">
            <h2 className="mb-2 font-bold">Computed Insets for {w}px wheel</h2>
            <p className="text-magenta-400">
              MENU top inset: {px(menuCalPct, w)}px ({menuCalPct.toFixed(1)}%)
            </p>
            <p className="text-cyan-400">
              SKIP side inset: {px(skipCalPct, w)}px ({skipCalPct.toFixed(1)}%)
            </p>
            <p className="text-magenta-400">
              PAUSE bottom inset: {px(menuCalPct, w)}px ({menuCalPct.toFixed(1)}%)
            </p>
          </div>

          <button
            type="button"
            className="rounded bg-zinc-700 px-3 py-1 transition hover:bg-zinc-600"
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? "Hide" : "Show"} Overlay
          </button>
        </div>
      </div>
    </div>
  );
}
