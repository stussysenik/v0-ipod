"use client";

import { forwardRef } from "react";
import {
  BASE_EXPORT_SCENE_HEIGHT,
  BASE_EXPORT_SCENE_WIDTH,
  getExportPreset,
  getExportSceneScale,
  type ExportPresetId,
} from "@/lib/export/export-scene";
import { IPodDeviceShell } from "@/components/ipod/device/ipod-device-shell";
import {
  getIpodClassicPreset,
  DEFAULT_HARDWARE_PRESET_ID,
} from "@/lib/ipod-classic-presets";
import type { IpodHardwarePresetId } from "@/types/ipod-state";

interface FramedExportStageProps {
  presetId: ExportPresetId;
  hardwarePresetId?: IpodHardwarePresetId;
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
      hardwarePresetId = DEFAULT_HARDWARE_PRESET_ID,
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
    const hardwarePreset = getIpodClassicPreset(hardwarePresetId);

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
            preset={hardwarePreset}
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
