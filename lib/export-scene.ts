import {
  BASE_EXPORT_SCENE_HEIGHT,
  BASE_EXPORT_SCENE_WIDTH,
  EXPORT_PRESET_ORDER,
  getExportProjectionProfile,
} from "@/lib/projection-profiles";
import type { SceneExportPresetId } from "@/types/scene-document";

export type ExportPresetId = SceneExportPresetId;

export interface ExportPresetConfig {
  id: ExportPresetId;
  label: string;
  width: number;
  height: number;
  padding: number;
  offsetY: number;
}

export { BASE_EXPORT_SCENE_HEIGHT, BASE_EXPORT_SCENE_WIDTH, EXPORT_PRESET_ORDER };

export function getExportPreset(presetId: ExportPresetId): ExportPresetConfig {
  const profile = getExportProjectionProfile(presetId);
  const exportFrame = profile.exportFrame;

  if (!exportFrame) {
    throw new Error(`Projection profile ${profile.id} is missing export frame geometry`);
  }

  return {
    id: exportFrame.presetId,
    label: exportFrame.presetId[0].toUpperCase() + exportFrame.presetId.slice(1),
    width: exportFrame.width,
    height: exportFrame.height,
    padding: exportFrame.padding,
    offsetY: exportFrame.offsetY,
  };
}

export function getExportPresets(): ExportPresetConfig[] {
  return EXPORT_PRESET_ORDER.map((presetId) => getExportPreset(presetId));
}

export function getExportSceneScale(presetId: ExportPresetId): number {
  const preset = getExportPreset(presetId);
  const availableWidth = Math.max(preset.width - preset.padding * 2, 1);
  const availableHeight = Math.max(preset.height - preset.padding * 2, 1);

  return Math.min(
    availableWidth / BASE_EXPORT_SCENE_WIDTH,
    availableHeight / BASE_EXPORT_SCENE_HEIGHT,
  );
}
