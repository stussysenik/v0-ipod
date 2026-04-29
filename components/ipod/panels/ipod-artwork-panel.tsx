"use client";

import { ImageUpload } from "@/components/ipod/editors/image-upload";
import placeholderLogo from "@/public/placeholder-logo.png";
import type { SongMetadata } from "@/types/ipod";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { RenderNowPlayingElement } from "@/components/ipod/scenes/ipod-scene-types";

interface IpodArtworkPanelProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  state: SongMetadata;
  renderElement: RenderNowPlayingElement;
  isInlineEditingEnabled: boolean;
  exportSafe: boolean;
  artworkShadow: string;
  playClick: () => void;
  onArtworkChange: (artwork: string) => void;
}

export function IpodArtworkPanel({
  screenTokens,
  state,
  renderElement,
  isInlineEditingEnabled,
  exportSafe,
  artworkShadow,
  playClick,
  onArtworkChange,
}: IpodArtworkPanelProps) {
  return (
    <div className="flex h-full items-start justify-start">
      {renderElement(
        "artwork",
        <div
          className="relative cursor-pointer border border-[#B8B8B8] bg-[#F0F0EE] transition-transform active:scale-[0.985]"
          style={{
            width: screenTokens.artworkSize,
            height: screenTokens.artworkSize,
            boxShadow: artworkShadow,
          }}
          data-export-layer="artwork"
        >
          {exportSafe ? (
            <img
              src={state.artwork || placeholderLogo.src}
              data-export-src={state.artwork || placeholderLogo.src}
              alt="Album artwork"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageUpload
              currentImage={state.artwork}
              onImageChange={(artwork) => {
                if (!isInlineEditingEnabled) {
                  return;
                }

                onArtworkChange(artwork);
                playClick();
              }}
              disabled={!isInlineEditingEnabled}
              className="h-full w-full object-cover"
            />
          )}
        </div>,
        { testId: "os-layout-artwork" },
      )}
    </div>
  );
}
