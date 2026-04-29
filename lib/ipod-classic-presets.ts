import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR } from "@/lib/color-manifest";
import type { IpodHardwarePresetId } from "@/types/ipod-state";

interface ShellPresetTokens {
  width: number;
  height: number;
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
      width: 350,
      height: 580,
      radius: 36,
      innerRadius: 35,
      paddingX: 18,
      paddingTop: 18,
      paddingBottom: 28,
      controlMarginTop: 46,
    },
    screen: {
      frameWidth: 320,
      frameHeight: 240,
      outerRadius: 8,
      innerRadius: 6,
      statusBarHeight: 18,
      statusBarPaddingX: 8,
      contentHeight: 138,
      contentPaddingX: 9,
      contentPaddingTop: 8,
      contentGapX: 9,
      artworkSize: 130,
      artworkColumnWidth: 142,
      progressHeight: 33,
      progressBottom: 2,
      progressPaddingX: 8,
      progressPaddingTop: 3,
      titleFontSize: 14.5,
      artistFontSize: 11.5,
      albumFontSize: 11.5,
      metaFontSize: 10.5,
      titleMarginBottom: 4,
      artistMarginBottom: 4,
      albumMarginBottom: 9,
      metaMarginBottom: 5,
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
    notes: "True physical scale. Slightly tighter UI chrome.",
    defaultShellColor: "#E4E4E6",
    defaultBackdropColor: DEFAULT_BACKDROP_COLOR,
    shell: {
      width: 370,
      height: 620,
      radius: 35,
      innerRadius: 34,
      paddingX: 32,
      paddingTop: 37,
      paddingBottom: 52,
      controlMarginTop: 70,
    },
    screen: {
      frameWidth: 296,
      frameHeight: 222,
      outerRadius: 8,
      innerRadius: 6,
      statusBarHeight: 17,
      statusBarPaddingX: 8,
      contentHeight: 134,
      contentPaddingX: 10,
      contentPaddingTop: 8,
      contentGapX: 11,
      artworkSize: 128,
      artworkColumnWidth: 139,
      progressHeight: 31,
      progressBottom: 3,
      progressPaddingX: 10,
      progressPaddingTop: 3,
      titleFontSize: 13.9,
      artistFontSize: 10.8,
      albumFontSize: 10.8,
      metaFontSize: 10.0,
      titleMarginBottom: 4,
      artistMarginBottom: 4,
      albumMarginBottom: 9,
      metaMarginBottom: 5,
    },
    wheel: {
      size: 222,
      centerSize: 79,
      menuTopInset: "11%",
      sideInset: "11%",
      bottomInset: "12%",
      labelFontSize: 11,
      labelTracking: "0.15em",
      sideIconSize: 16,
      playPauseIconSize: 12,
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
      width: 370,
      height: 620,
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
      statusBarHeight: 17,
      statusBarPaddingX: 8,
      contentHeight: 134,
      contentPaddingX: 9,
      contentPaddingTop: 8,
      contentGapX: 8,
      artworkSize: 126,
      artworkColumnWidth: 136,
      progressHeight: 31,
      progressBottom: 2,
      progressPaddingX: 8,
      progressPaddingTop: 3,
      titleFontSize: 14.0,
      artistFontSize: 11.0,
      albumFontSize: 11.0,
      metaFontSize: 10.0,
      titleMarginBottom: 4,
      artistMarginBottom: 4,
      albumMarginBottom: 9,
      metaMarginBottom: 5,
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
