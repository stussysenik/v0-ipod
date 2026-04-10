import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR } from "@/lib/color-manifest";
import type { IpodHardwarePresetId } from "@/types/ipod-state";

interface ShellPresetTokens {
  radius: number;
  innerRadius: number;
  paddingX: number;
  paddingTop: number;
  paddingBottom: number;
  controlMarginTop: number;
}

interface ScreenPresetTokens {
  frameWidth: number;
  frameHeight: number;
  outerRadius: number;
  innerRadius: number;
  statusBarHeight: number;
  statusBarPaddingX: number;
  contentHeight: number;
  contentPaddingX: number;
  contentPaddingTop: number;
  contentGapX: number;
  artworkSize: number;
  artworkColumnWidth: number;
  progressHeight: number;
  progressBottom: number;
  progressPaddingX: number;
  progressPaddingTop: number;
  titleFontSize: number;
  artistFontSize: number;
  albumFontSize: number;
  metaFontSize: number;
  titleMarginBottom: number;
  artistMarginBottom: number;
  albumMarginBottom: number;
  metaMarginBottom: number;
}

interface WheelPresetTokens {
  size: number;
  centerSize: number;
  menuTopInset: string;
  sideInset: string;
  bottomInset: string;
  labelFontSize: number;
  labelTracking: string;
  sideIconSize: number;
  playPauseIconSize: number;
}

export interface IpodClassicPresetDefinition {
  id: IpodHardwarePresetId;
  label: string;
  shortLabel: string;
  yearLabel: string;
  notes: string;
  defaultShellColor: string;
  defaultBackdropColor: string;
  shell: ShellPresetTokens;
  screen: ScreenPresetTokens;
  wheel: WheelPresetTokens;
}

export const DEFAULT_HARDWARE_PRESET_ID: IpodHardwarePresetId = "classic-2007";

export const IPOD_CLASSIC_PRESETS: readonly IpodClassicPresetDefinition[] = [
  {
    id: "classic-2007",
    label: "Classic 2007 · 6th Gen",
    shortLabel: "2007",
    yearLabel: "2007",
    notes: "Original all-metal iPod classic launch proportions.",
    defaultShellColor: DEFAULT_SHELL_COLOR,
    defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
    shell: {
      radius: 36,
      innerRadius: 35,
      paddingX: 40,
      paddingTop: 40,
      paddingBottom: 60,
      controlMarginTop: 40,
    },
    screen: {
      frameWidth: 320,
      frameHeight: 240,
      outerRadius: 8,
      innerRadius: 6,
      statusBarHeight: 16,
      statusBarPaddingX: 6,
      contentHeight: 148,
      contentPaddingX: 12,
      contentPaddingTop: 18,
      contentGapX: 12,
      artworkSize: 120,
      artworkColumnWidth: 144,
      progressHeight: 33,
      progressBottom: 12,
      progressPaddingX: 14,
      progressPaddingTop: 4,
      titleFontSize: 13,
      artistFontSize: 11,
      albumFontSize: 11,
      metaFontSize: 11,
      titleMarginBottom: 2,
      artistMarginBottom: 1,
      albumMarginBottom: 5,
      metaMarginBottom: 4,
    },
    wheel: {
      size: 220,
      centerSize: 73,
      menuTopInset: "10.5%",
      sideInset: "10.5%",
      bottomInset: "11.5%",
      labelFontSize: 11.2,
      labelTracking: "0.18em",
      sideIconSize: 18,
      playPauseIconSize: 14,
    },
  },
  {
    id: "classic-2008",
    label: "Classic 2008 · 120GB refresh",
    shortLabel: "2008",
    yearLabel: "2008",
    notes: "Slightly tighter chrome and calmer spacing than the launch model.",
    defaultShellColor: "#E4E4E6",
    defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
    shell: {
      radius: 35,
      innerRadius: 34,
      paddingX: 40,
      paddingTop: 40,
      paddingBottom: 60,
      controlMarginTop: 42,
    },
    screen: {
      frameWidth: 320,
      frameHeight: 240,
      outerRadius: 8,
      innerRadius: 6,
      statusBarHeight: 16,
      statusBarPaddingX: 6,
      contentHeight: 148,
      contentPaddingX: 12,
      contentPaddingTop: 18,
      contentGapX: 12,
      artworkSize: 120,
      artworkColumnWidth: 144,
      progressHeight: 32,
      progressBottom: 12,
      progressPaddingX: 14,
      progressPaddingTop: 4,
      titleFontSize: 13,
      artistFontSize: 11,
      albumFontSize: 11,
      metaFontSize: 11,
      titleMarginBottom: 2,
      artistMarginBottom: 1,
      albumMarginBottom: 5,
      metaMarginBottom: 4,
    },
    wheel: {
      size: 220,
      centerSize: 73,
      menuTopInset: "10.25%",
      sideInset: "10.25%",
      bottomInset: "11.25%",
      labelFontSize: 11.1,
      labelTracking: "0.17em",
      sideIconSize: 18,
      playPauseIconSize: 14,
    },
  },
  {
    id: "classic-2009",
    label: "Classic 2009 · Late 160GB",
    shortLabel: "2009",
    yearLabel: "2009",
    notes: "Late thin revision with tighter wheel and calmer screen chrome.",
    defaultShellColor: "#F7F7F7",
    defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
    shell: {
      radius: 34,
      innerRadius: 33,
      paddingX: 40,
      paddingTop: 40,
      paddingBottom: 60,
      controlMarginTop: 44,
    },
    screen: {
      frameWidth: 320,
      frameHeight: 240,
      outerRadius: 8,
      innerRadius: 6,
      statusBarHeight: 16,
      statusBarPaddingX: 6,
      contentHeight: 148,
      contentPaddingX: 12,
      contentPaddingTop: 18,
      contentGapX: 12,
      artworkSize: 120,
      artworkColumnWidth: 144,
      progressHeight: 31,
      progressBottom: 12,
      progressPaddingX: 14,
      progressPaddingTop: 4,
      titleFontSize: 13,
      artistFontSize: 11,
      albumFontSize: 11,
      metaFontSize: 11,
      titleMarginBottom: 2,
      artistMarginBottom: 1,
      albumMarginBottom: 5,
      metaMarginBottom: 4,
    },
    wheel: {
      size: 220,
      centerSize: 73,
      menuTopInset: "10%",
      sideInset: "10%",
      bottomInset: "11%",
      labelFontSize: 10.9,
      labelTracking: "0.16em",
      sideIconSize: 18,
      playPauseIconSize: 14,
    },
  },
] as const;

const PRESET_LOOKUP = new Map(IPOD_CLASSIC_PRESETS.map((preset) => [preset.id, preset]));

export function getIpodClassicPreset(
  presetId: IpodHardwarePresetId,
): IpodClassicPresetDefinition {
  return PRESET_LOOKUP.get(presetId) ?? PRESET_LOOKUP.get(DEFAULT_HARDWARE_PRESET_ID)!;
}
