"use client";

import placeholderLogo from "@/public/placeholder-logo.png";
import type { SongMetadata } from "@/types/ipod";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const SCREEN_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface IpodMenuSceneProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  state: SongMetadata;
  osMenuItems: readonly { id: string; label: string }[];
  osMenuIndex: number;
  artworkShadow: string;
}

export function IpodMenuScene({
  screenTokens,
  state,
  osMenuItems,
  osMenuIndex,
  artworkShadow,
}: IpodMenuSceneProps) {
  const menuArtworkSize = Math.max(74, screenTokens.artworkSize - 8);

  return (
    <div
      className="grid animate-in slide-in-from-left-2 duration-200"
      style={{
        height: screenTokens.frameHeight - screenTokens.statusBarHeight - 2,
        gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 0.92fr)",
      }}
      data-testid="ipod-os-menu"
    >
      <div className="border-r border-[#AEB4BC] bg-[#FBFBF9] py-[6px]">
        {osMenuItems.map((item, index) => {
          const isActive = index === osMenuIndex;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 px-[8px] py-[3.5px] text-[10px] font-semibold leading-[1.15]"
              data-testid={isActive ? "ipod-os-selected-menu-item" : undefined}
              style={{
                color: isActive ? "#FFFFFF" : "#111111",
                background: isActive
                  ? "linear-gradient(180deg, rgba(104,181,242,1) 0%, rgba(49,137,211,1) 100%)"
                  : "transparent",
              }}
            >
              <span>{item.label}</span>
              {isActive ? <span aria-hidden="true">›</span> : <span aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center bg-[#F4F4F0] p-[8px]">
        {osMenuItems[osMenuIndex]?.id === "about" ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ fontFamily: SCREEN_FONT_FAMILY }}
            data-testid="about-panel"
          >
            <div className="text-[9px] font-bold tracking-[0.04em] text-[#333]">
              RE:MIX
            </div>
            <div className="mt-[3px] text-[7px] font-medium text-[#666]">
              STUSSY SENIK
            </div>
            <div className="mt-[1px] text-[6.5px] font-normal text-[#999]">
              &copy; 2026
            </div>
          </div>
        ) : osMenuItems[osMenuIndex]?.id === "now-playing" ? (
          <div
            className="flex w-full flex-col items-center gap-[4px]"
            style={{ fontFamily: SCREEN_FONT_FAMILY }}
            data-testid="now-playing-preview"
          >
            <div
              className="overflow-hidden border border-[#C8C9CA] bg-white"
              style={{
                width: menuArtworkSize - 16,
                height: menuArtworkSize - 16,
                boxShadow: artworkShadow,
              }}
            >
              <img
                src={state.artwork || placeholderLogo.src}
                alt="Album artwork"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="w-full text-center">
              <div className="truncate text-[8px] font-bold leading-[1.2] text-[#111]">
                {state.title}
              </div>
              <div className="truncate text-[7px] font-medium leading-[1.2] text-[#555]">
                {state.artist}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="overflow-hidden border border-[#C8C9CA] bg-white"
            style={{
              width: menuArtworkSize,
              height: menuArtworkSize,
              boxShadow: artworkShadow,
            }}
            data-export-layer="artwork"
          >
            <img
              src={state.artwork || placeholderLogo.src}
              data-export-src={state.artwork || placeholderLogo.src}
              alt="Album artwork"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
