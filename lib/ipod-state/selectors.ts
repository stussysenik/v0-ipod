import type { IpodInteractionModel, IpodViewMode } from "./model";

export function isAuthenticInteractionModel(
  interactionModel: IpodInteractionModel,
): boolean {
  return interactionModel !== "direct";
}

export function isStandardOsInteractionModel(
  interactionModel: IpodInteractionModel,
): boolean {
  return interactionModel === "ipod-os" || interactionModel === "ipod-os-original";
}

export function isPngExportViewMode(viewMode: IpodViewMode): boolean {
  return viewMode === "flat" || viewMode === "focus";
}

export function isPreviewViewMode(viewMode: IpodViewMode): boolean {
  return viewMode === "preview";
}

export function isAsciiViewMode(viewMode: IpodViewMode): boolean {
  return viewMode === "ascii";
}

export function getExportScreenContext(
  interactionModel: IpodInteractionModel,
  osScreen: "menu" | "now-playing",
): "menu" | "now-playing" {
  return interactionModel === "direct" ? "now-playing" : osScreen;
}
