"use client";

import { useEffect, useRef, useCallback } from "react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import placeholderLogo from "@/public/placeholder-logo.png";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import { getSurfaceToken, getTextTokenCss, deriveScreenSurround } from "@/lib/color-manifest";
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
  skinColor?: string;
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
  nowPlayingFidelity?: "experimental" | "classic";
}

const SCREEN_FONT_FAMILY = '"ChicagoFLF", "Helvetica Neue", Helvetica, Arial, sans-serif';

function ScreenBattery() {
  return (
    <div className="flex items-center gap-px" aria-hidden="true">
      <div className="relative h-[8px] w-[17px] rounded-[1px] border border-[#7B7B7B] bg-[#F7F7F5] p-[1px]">
        {/* 4 segmented "liquid" bars */}
        <div className="flex h-full w-full gap-[0.5px]">
          {[1, 2, 3, 4].map((seg, i) => (
            <div
              key={seg}
              className="h-full flex-1 rounded-[0.5px]"
              style={{
                backgroundColor: i < 3 ? "#00CC00" : "transparent",
                backgroundImage: i < 3 
                  ? "linear-gradient(to bottom, #00EE00 0%, #00AA00 100%)" 
                  : "none",
              }}
            />
          ))}
        </div>
      </div>
      <div className="h-[4px] w-[1.5px] rounded-r-[0.5px] bg-[#7B7B7B]" />
    </div>
  );
}

export function IpodScreen({
  preset,
  skinColor,
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
  nowPlayingFidelity = "classic",
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenTokens = preset.screen;
  const showOsMenu = interactionModel === "ipod-os" && osScreen === "menu";
  const screenShadow = exportSafe
    ? "0 0 0 1px rgba(60,60,60,0.08)"
    : "0 1px 1px rgba(0,0,0,0.22), 0 7px 10px -9px rgba(0,0,0,0.48)";
  const artworkShadow = exportSafe ? "none" : "0 1px 2px rgba(0,0,0,0.14)";
  const surround = skinColor ? deriveScreenSurround(skinColor) : null;
  const screenSurface = {
    background: `linear-gradient(180deg, ${surround?.top ?? getSurfaceToken("screen.surround.top")} 0%, ${surround?.mid ?? getSurfaceToken("screen.surround.mid")} 16%, ${surround?.bottom ?? getSurfaceToken("screen.surround.bottom")} 100%)`,
  };
  const glassOverlay = {
    background: exportSafe
      ? "linear-gradient(152deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.018) 18%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.006) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.025) 100%)"
      : "linear-gradient(152deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.022) 18%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.03) 100%)",
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
            pointerEvents: "none",
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
          className="flex items-center border-b"
          style={{
            height: screenTokens.statusBarHeight,
            paddingInline: screenTokens.statusBarPaddingX,
            backgroundImage: "linear-gradient(to bottom, #f0f0f0 0%, #d9d9d9 100%)",
            borderColor: "#b0b0b0",
          }}
        >
          <div
            className="flex flex-1 items-center gap-[4px] font-bold leading-none tracking-[-0.01em]"
            style={{
              color: statusBarTextColor,
              fontSize: "11px",
            }}
            data-testid="screen-status-label"
          >
            {!showOsMenu && (
              <div 
                className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#0099DD]" 
                aria-hidden="true" 
              />
            )}
            <span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
          </div>

          {!showOsMenu && nowPlayingFidelity === "classic" && (
            <div
              className="flex-1 flex justify-center font-bold leading-none tracking-tight"
              style={{
                color: statusBarTextColor,
                fontSize: "11px",
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
          )}

          <div className="flex-1 flex justify-end">
            <ScreenBattery />
          </div>
        </div>

        {showOsMenu ? (
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
        ) : nowPlayingFidelity === "classic" ? (
          <div
            className="flex flex-col h-full animate-in slide-in-from-right-2 duration-200"
            style={{
              paddingTop: 0,
              height: `calc(100% - ${screenTokens.statusBarHeight}px)`,
              background: "linear-gradient(180deg, #F7F7F7 0%, #E2E2E2 100%)",
            }}
          >
            {/* Standard iPod Classic 6th Gen Now Playing Layout */}
            <div
              className="flex-1 grid"
              style={{
                gridTemplateColumns: `${screenTokens.artworkSize + 28}px 1fr`,
                paddingInline: 12,
                paddingTop: 18,
              }}
            >
              {/* Album Art Column */}
              <div className="flex flex-col items-start relative">
                <div
                  className="relative cursor-pointer bg-white"
                  style={{
                    width: screenTokens.artworkSize,
                    height: screenTokens.artworkSize,
                    boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 0 0 1px rgba(0,0,0,0.1)",
                    overflow: "hidden",
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
                {/* Authentic Reflection Effect */}
                <div 
                  className="relative overflow-hidden"
                  style={{
                    width: screenTokens.artworkSize,
                    height: screenTokens.artworkSize * 0.25,
                    marginTop: "-2px",
                    transform: "scaleY(-1)",
                    opacity: 0.3,
                  }}
                >
                  <img
                    src={state.artwork || placeholderLogo.src}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                    }}
                  />
                </div>
              </div>

              {/* Metadata Column */}
              <div className="flex flex-col justify-start pt-[2px] pr-2 overflow-hidden">
                <div className="truncate mb-[2px]">
                  <EditableText
                    value={state.title}
                    onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                    disabled={!isEditable}
                    className="font-bold tracking-tight text-black"
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.1,
                      color: "#000000",
                    }}
                    editLabel="Edit title"
                    dataTestId="track-title-text"
                    animate={titlePreview || animateText}
                    preview={titlePreview || animateText}
                    captureReady={titleCaptureReady}
                    onOverflowChange={onTitleOverflowChange}
                    singleLine={!titlePreview && !animateText}
                  />
                </div>
                <div className="truncate mb-[1px]">
                  <EditableText
                    value={state.artist}
                    onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                    disabled={!isEditable}
                    className="font-normal"
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.2,
                      color: "#333333",
                    }}
                    editLabel="Edit artist"
                    dataTestId="track-artist-text"
                    singleLine
                  />
                </div>
                <div className="truncate">
                  <EditableText
                    value={state.album}
                    onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                    disabled={!isEditable}
                    className="font-normal"
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.2,
                      color: "#666666",
                    }}
                    editLabel="Edit album"
                    dataTestId="track-album-text"
                    singleLine
                  />
                </div>

                <div className="mt-4">
                  <StarRating
                    rating={state.rating}
                    onChange={(rating) => {
                      if (!isEditable) return;
                      dispatch({ type: "UPDATE_RATING", payload: rating });
                      playClick();
                    }}
                    disabled={!isEditable}
                    fontSize={10}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Progress Area */}
            <div
              className="px-[14px] pb-[12px]"
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
                trackHeight={8}
                variant="classic"
              />
              <div
                className="mt-[4px] flex items-center justify-between font-bold tracking-tight text-black"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: SCREEN_FONT_FAMILY,
                  fontSize: "11px",
                }}
              >
                <div data-testid="elapsed-time" data-export-time-value={state.currentTime}>
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
          </div>
        ) : (
          <>
            <div
              className="grid animate-in slide-in-from-right-2 duration-200"
              style={{
                height: `calc(100% - ${screenTokens.statusBarHeight + screenTokens.progressHeight + screenTokens.progressBottom + 2}px)`,
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
                      onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
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

                <div className="relative z-20" style={{ marginBottom: screenTokens.metaMarginBottom }}>
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

                <div
                  className="font-medium leading-none tracking-[0.01em]"
                  style={{
                    color: trackInfoColor,
                    fontSize: screenTokens.metaFontSize,
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
              </div>
            </div>

            <div
              className="absolute left-0 right-0"
              style={{
                bottom: screenTokens.progressBottom,
                height: screenTokens.progressHeight,
                paddingInline: screenTokens.progressPaddingX,
                paddingTop: screenTokens.progressPaddingTop,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,248,246,0.96) 100%)",
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
                variant="experimental"
              />
              <div
                className="mt-[3px] flex items-center justify-between font-semibold leading-none tracking-[-0.02em] text-black"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: SCREEN_FONT_FAMILY,
                  fontSize: Math.max(8, screenTokens.metaFontSize + 1),
                }}
              >
                <div data-testid="elapsed-time" data-export-time-value={state.currentTime}>
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
          style={{ ...glassOverlay, pointerEvents: "none" }} 
          aria-hidden="true" 
        />
        <div
          className="pointer-events-none absolute left-[11px] top-[9px] h-[32%] w-[48%] rounded-[18px] opacity-25"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.024) 18%, rgba(255,255,255,0) 58%)",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
