import manifestData from "@/scripts/design-system.json";

export interface BatteryChromeTokens {
  width: number;
  height: number;
  capWidth: number;
  capHeight: number;
  gap: number;
  borderRadius: number;
  fillInset: number;
  fillWidthRatio: number;
  border: string;
  background: string;
  fillFrom: string;
  fillTo: string;
  highlight: string;
}

export interface ScreenChromeStatusBarTokens {
  divider: string;
  playIndicator: string;
  battery: BatteryChromeTokens;
}

export interface ScreenChromeFrameTokens {
  liveShadow: string;
  exportShadow: string;
  glassOverlayLive: string;
  glassOverlayExport: string;
}

export interface ScreenChromeProgressTokens {
  footerBackground: string;
  trackBorder: string;
  trackBackground: string;
  trackInsetShadow: string;
  fillBackground: string;
  fillHighlight: string;
}

export interface DesignSystemManifest {
  screenChrome: {
    frame: ScreenChromeFrameTokens;
    statusBar: ScreenChromeStatusBarTokens;
    progress: ScreenChromeProgressTokens;
  };
}

export const designSystem = manifestData as DesignSystemManifest;
export const screenChromeTokens = designSystem.screenChrome;
