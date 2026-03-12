"use client";

import { forwardRef } from "react";
import {
  type ExportPresetId,
  getExportPreset,
  getExportSceneScale,
  BASE_EXPORT_SCENE_HEIGHT,
  BASE_EXPORT_SCENE_WIDTH,
} from "@/lib/export-scene";
import { IPodDeviceShell } from "./ipod-device-shell";

interface FramedExportStageProps {
  presetId: ExportPresetId;
  backgroundColor: string;
  skinColor: string;
  screen: React.ReactNode;
  wheel: React.ReactNode;
  exportSafe?: boolean;
  showShadowLayer?: boolean;
  dataTestId?: string;
  className?: string;
}

export const FramedExportStage = forwardRef<HTMLDivElement, FramedExportStageProps>(
  function FramedExportStage(
    {
      presetId,
      backgroundColor,
      skinColor,
      screen,
      wheel,
      exportSafe = false,
      showShadowLayer = false,
      dataTestId,
      className = "",
    },
    ref,
  ) {
    const preset = getExportPreset(presetId);
    const scale = getExportSceneScale(presetId);

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        style={{
          width: `${preset.width}px`,
          height: `${preset.height}px`,
          backgroundColor,
        }}
        data-testid={dataTestId}
      >
        <div
          className="absolute left-1/2 top-1/2 origin-top-left"
          style={{
            width: `${BASE_EXPORT_SCENE_WIDTH}px`,
            height: `${BASE_EXPORT_SCENE_HEIGHT}px`,
            transform: `translate(-50%, -50%) translateY(${preset.offsetY}px) scale(${scale})`,
          }}
        >
          <IPodDeviceShell
            skinColor={skinColor}
            screen={screen}
            wheel={wheel}
            exportSafe={exportSafe}
            showShadowLayer={showShadowLayer}
          />
        </div>
      </div>
    );
  },
);
