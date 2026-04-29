import manifestData from "@/tokens/shared-ui.json";

interface IconButtonAppearance {
  border: string;
  background: string;
  foreground: string;
  shadow: string;
}

interface IconButtonVariantTokens extends IconButtonAppearance {
  hover?: IconButtonAppearance;
}

interface IconButtonTokens {
  size: number;
  radius: number;
  motion: {
    durationMs: number;
    hoverScale: number;
    activeScale: number;
    pressScale: number;
  };
  badge: {
    border: string;
    background: string;
    foreground: string;
    shadow: string;
  };
  tooltip: {
    border: string;
    background: string;
    foreground: string;
    shadow: string;
  };
  variants: {
    default: IconButtonVariantTokens;
    contrast: IconButtonVariantTokens;
    active: IconButtonVariantTokens;
  };
}

interface SharedUiManifest {
  iconButton: IconButtonTokens;
}

export const sharedUiTokens = manifestData as SharedUiManifest;
export const sharedIconButtonTokens = sharedUiTokens.iconButton;
