/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import { ScreenBattery } from "./screen-battery";
import placeholderLogo from "@/public/placeholder-logo.png";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import { getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import { screenChromeTokens } from "@/lib/design-system";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import type { IpodInteractionModel, IpodOsScreen } from "@/types/ipod-state";

type IpodScreenAction =
  | { type: "UPDATE_TITLE"; payload: string }
  | { type: "UPDATE_ARTIST"; payload: string }
  | { type: "UPDATE_ALBUM"; payload: string }
  | { type: "UPDATE_ARTWORK"; payload: string }
  | { type: "UPDATE_CURRENT_TIME"; payload: number }
  | { type: "UPDATE_DURATION"; payload: number }
  | { type: "UPDATE_RATING"; payload: number }
  | { type: "UPDATE_TRACK_NUMBER"; payload: number }
  | { type: "UPDATE_TOTAL_TRACKS"; payload: number };

interface IpodScreenProps {
  preset: IpodClassicPresetDefinition;
  state: SongMetadata;
  dispatch: React.Dispatch<IpodScreenAction>;
  playClick: () => void;
  interactionModel?: IpodInteractionModel;
  osScreen?: IpodOsScreen;
  osMenuItems?: readonly { id: string; label: string }[];
  osMenuIndex?: number;
  isEditable?: boolean;
  exportSafe?: boolean;
  animateText?: boolean;
  titlePreview?: boolean;
  titleCaptureReady?: boolean;
  onTitleOverflowChange?: (overflow: boolean) => void;
}

const SCREEN_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export function IpodScreen({
  preset,
  state,
  dispatch,
  playClick,
  interactionModel = "direct",
  osScreen = "now-playing",
  osMenuItems = [],
  osMenuIndex = 0,
  isEditable = true,
  exportSafe = false,
  animateText = false,
  titlePreview = false,
  titleCaptureReady = false,
  onTitleOverflowChange,
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenTokens = preset.screen;
  const showOsMenu = interactionModel === "ipod-os" && osScreen === "menu";
  const screenShadow = exportSafe
    ? screenChromeTokens.frame.exportShadow
    : screenChromeTokens.frame.liveShadow;
  const artworkShadow = exportSafe ? "none" : "0 1px 2px rgba(0,0,0,0.14)";
  const screenSurface = {
    background: `linear-gradient(180deg, ${getSurfaceToken("screen.surround.top")} 0%, ${getSurfaceToken("screen.surround.mid")} 16%, ${getSurfaceToken("screen.surround.bottom")} 100%)`,
  };
  const glassOverlay = {
    background: exportSafe
      ? screenChromeTokens.frame.glassOverlayExport
      : screenChromeTokens.frame.glassOverlayLive,
  };
  const titleColor = getTextTokenCss("screen.title");
  const artistColor = getTextTokenCss("screen.artist");
  const albumColor = getTextTokenCss("screen.album");
  const trackInfoColor = getTextTokenCss("screen.trackInfo");
  const statusBarTextColor = getTextTokenCss("screen.statusbar.text");

  useEffect(() => {
    if (showOsMenu) {
      onTitleOverflowChange?.(false);
    }
  }, [showOsMenu, onTitleOverflowChange]);

  const setCurrentTime = useCallback(
    (currentTime: number, preserveRemaining = false) => {
      const safeCurrent = Math.max(0, Math.floor(currentTime));
      dispatch({ type: "UPDATE_CURRENT_TIME", payload: safeCurrent });

      if (preserveRemaining && remainingAnchorRef.current !== null) {
        dispatch({
          type: "UPDATE_DURATION",
          payload: safeCurrent + remainingAnchorRef.current,
        });
      }
    },
    [dispatch],
  );

  const setRemainingTime = useCallback(
    (remainingSeconds: number) => {
      const safeRemaining = Math.max(0, Math.floor(remainingSeconds));
      remainingAnchorRef.current = safeRemaining;
      dispatch({
        type: "UPDATE_DURATION",
        payload: state.currentTime + safeRemaining,
      });
    },
    [dispatch, state.currentTime],
  );

  const menuArtworkSize = Math.max(74, screenTokens.artworkSize - 8);

  return (
    <div
      className="relative z-10 mx-auto shrink-0 p-[1px]"
      style={{
        ...screenSurface,
        boxShadow: screenShadow,
        width: screenTokens.frameWidth,
        height: screenTokens.frameHeight,
        borderRadius: screenTokens.outerRadius,
      }}
      data-export-layer="screen"
      data-testid="ipod-screen"
    >
      <div
        className="pointer-events-none absolute inset-[1px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 18%, rgba(0,0,0,0.06) 100%)",
          borderRadius: Math.max(1, screenTokens.outerRadius - 1),
        }}
        aria-hidden="true"
      />
      <div
        className="relative h-full w-full overflow-hidden border"
        style={{
          backgroundColor: getSurfaceToken("screen.content.bg"),
          borderColor: getSurfaceToken("screen.border"),
          borderRadius: screenTokens.innerRadius,
          fontFamily: SCREEN_FONT_FAMILY,
        }}
      >
        <div
          className="flex items-center justify-between border-b"
          style={{
            height: screenTokens.statusBarHeight,
            paddingInline: screenTokens.statusBarPaddingX,
            backgroundImage: `linear-gradient(180deg, ${getSurfaceToken("screen.statusbar.bg.from")}, ${getSurfaceToken("screen.statusbar.bg.to")})`,
            borderColor: screenChromeTokens.statusBar.divider,
          }}
        >
          <div
            className="flex items-center gap-[4px] font-semibold leading-none tracking-[-0.01em]"
            style={{
              color: statusBarTextColor,
              fontSize: Math.max(7.5, screenTokens.statusBarHeight - 8),
            }}
            data-testid="screen-status-label"
          >
            {!showOsMenu && (
              <span
                className="text-[7px]"
                style={{ color: screenChromeTokens.statusBar.playIndicator }}
              >
                ▶
              </span>
            )}
            <span>{showOsMenu ? "iPod" : "Now Playing"}</span>
          </div>
          <ScreenBattery />
        </div>

        {showOsMenu ? (
          <div
            className="grid"
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
                    className="flex items-center justify-between gap-2 px-[8px] py-[2px] text-[10px] font-semibold leading-[1.15]"
                    data-testid={isActive ? "ipod-os-selected-menu-item" : undefined}
                    style={{
                      color: isActive ? "#FFFFFF" : "#111111",
                      background: isActive
                        ? "linear-gradient(180deg, rgba(104,181,242,1) 0%, rgba(49,137,211,1) 100%)"
                        : "transparent",
                    }}
                  >
                    <span>{item.label}</span>
                    {isActive ? (
                      <span aria-hidden="true">›</span>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center bg-[#F4F4F0] p-[8px]">
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
            </div>
          </div>
        ) : (
          <>
            <div
              className="grid"
              style={{
                height: screenTokens.contentHeight,
                gridTemplateColumns: `${screenTokens.artworkColumnWidth}px minmax(0, 1fr)`,
                columnGap: screenTokens.contentGapX,
                paddingInline: screenTokens.contentPaddingX,
                paddingTop: screenTokens.contentPaddingTop,
              }}
              data-testid="screen-content"
            >
              <div className="flex h-full items-start justify-start">
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageUpload
                      currentImage={state.artwork}
                      onImageChange={(artwork) => {
                        if (!isEditable) return;
                        dispatch({ type: "UPDATE_ARTWORK", payload: artwork });
                        playClick();
                      }}
                      disabled={!isEditable}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div
                className="z-20 flex min-w-0 flex-col items-start pr-[2px] text-left"
                data-testid="track-meta"
              >
                <div
                  className="relative z-20 w-full min-w-0"
                  data-testid="track-title"
                  style={{ marginBottom: screenTokens.titleMarginBottom }}
                >
                  <div
                    className="min-w-0 font-semibold leading-[1.05] tracking-[-0.02em]"
                    style={{ color: titleColor, fontSize: screenTokens.titleFontSize }}
                  >
                    <EditableText
                      value={state.title}
                      onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                      disabled={!isEditable}
                      className="max-w-full min-w-0"
                      editLabel="Edit title"
                      dataTestId="track-title-text"
                      animate={titlePreview || animateText}
                      preview={titlePreview || animateText}
                      captureReady={titleCaptureReady}
                      onOverflowChange={onTitleOverflowChange}
                      singleLine={!titlePreview && !animateText}
                    />
                  </div>
                </div>

                <div
                  className="relative z-20 w-full min-w-0"
                  data-testid="track-artist"
                  style={{ marginBottom: screenTokens.artistMarginBottom }}
                >
                  <div
                    className="min-w-0 font-medium leading-[1.1] tracking-[-0.01em]"
                    style={{ color: artistColor, fontSize: screenTokens.artistFontSize }}
                  >
                    <EditableText
                      value={state.artist}
                      onChange={(val) =>
                        dispatch({ type: "UPDATE_ARTIST", payload: val })
                      }
                      disabled={!isEditable}
                      className="max-w-full min-w-0"
                      editLabel="Edit artist"
                      dataTestId="track-artist-text"
                      singleLine
                    />
                  </div>
                </div>

                <div
                  className="relative z-20 w-full min-w-0"
                  data-testid="track-album"
                  style={{ marginBottom: screenTokens.albumMarginBottom }}
                >
                  <div
                    className="min-w-0 font-medium leading-[1.08] tracking-[-0.01em]"
                    style={{ color: albumColor, fontSize: screenTokens.albumFontSize }}
                  >
                    <EditableText
                      value={state.album}
                      onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                      disabled={!isEditable}
                      className="max-w-full min-w-0"
                      editLabel="Edit album"
                      dataTestId="track-album-text"
                      singleLine
                    />
                  </div>
                </div>

                <div
                  className="font-medium leading-none tracking-[0.01em]"
                  style={{
                    color: trackInfoColor,
                    fontSize: screenTokens.metaFontSize,
                    marginBottom: screenTokens.metaMarginBottom,
                  }}
                >
                  <EditableTrackNumber
                    trackNumber={state.trackNumber}
                    totalTracks={state.totalTracks}
                    onTrackNumberChange={(num) =>
                      dispatch({ type: "UPDATE_TRACK_NUMBER", payload: num })
                    }
                    onTotalTracksChange={(num) =>
                      dispatch({ type: "UPDATE_TOTAL_TRACKS", payload: num })
                    }
                    disabled={!isEditable}
                  />
                </div>

                <div className="relative z-20">
                  <StarRating
                    rating={state.rating}
                    onChange={(rating) => {
                      if (!isEditable) return;
                      dispatch({ type: "UPDATE_RATING", payload: rating });
                      playClick();
                    }}
                    disabled={!isEditable}
                    fontSize={Math.max(7.6, screenTokens.metaFontSize - 0.2)}
                  />
                </div>
              </div>
            </div>

            <div
              className="absolute left-0 right-0"
              style={{
                bottom: screenTokens.progressBottom,
                height: screenTokens.progressHeight,
                paddingInline: screenTokens.progressPaddingX,
                paddingTop: screenTokens.progressPaddingTop,
                background: screenChromeTokens.progress.footerBackground,
              }}
              data-testid="screen-progress"
              data-export-duration={state.duration}
            >
              <ProgressBar
                currentTime={state.currentTime}
                duration={state.duration}
                onSeek={(currentTime) => {
                  if (!isEditable) return;
                  remainingAnchorRef.current = null;
                  setCurrentTime(currentTime, false);
                  playClick();
                }}
                disabled={!isEditable}
                trackHeight={screenTokens.progressHeight >= 33 ? 6 : 5}
              />
              <div
                className="mt-[3px] flex items-center justify-between font-semibold leading-none tracking-[-0.02em] text-black"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: SCREEN_FONT_FAMILY,
                  fontSize: Math.max(8, screenTokens.metaFontSize + 1),
                }}
              >
                <div
                  data-testid="elapsed-time"
                  data-export-time-value={state.currentTime}
                >
                  <EditableTime
                    value={state.currentTime}
                    onChange={(time) => {
                      if (!isEditable) return;
                      setCurrentTime(time, true);
                    }}
                    disabled={!isEditable}
                    editLabel="Edit elapsed time"
                  />
                </div>
                <div
                  className="text-black flex items-center gap-[1px]"
                  data-testid="remaining-time"
                >
                  <EditableTime
                    value={Math.max(state.duration - state.currentTime, 0)}
                    isRemaining
                    onChange={(remaining) => {
                      if (!isEditable) return;
                      setRemainingTime(remaining);
                    }}
                    disabled={!isEditable}
                    editLabel="Edit remaining time"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={glassOverlay}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[11px] top-[9px] h-[32%] w-[48%] rounded-[18px] opacity-25"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.024) 18%, rgba(255,255,255,0) 58%)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
