"use client";

import { useEffect, useRef, useCallback } from "react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import placeholderLogo from "@/public/placeholder-logo.png";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import {
  getSurfaceToken,
  getTextTokenCss,
  deriveScreenSurround,
} from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import {
  DEFAULT_OS_NOW_PLAYING_LAYOUT,
  type IpodInteractionModel,
  type IpodNowPlayingLayoutElementId,
  type IpodNowPlayingLayoutPosition,
  type IpodNowPlayingLayoutState,
  type IpodOsScreen,
} from "@/types/ipod-state";

/**
 * Screen-level state mutations exposed by the parent workbench.
 *
 * The display assembly renders and edits these values, but the source of truth
 * remains in the parent orchestrator so persistence, export, and interaction
 * modes all operate on one shared song snapshot.
 */
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

/**
 * Display assembly props.
 *
 * Naming note for future refactors:
 * this file currently mixes display chrome and screen scenes. Long-term, the
 * physical "display" should be separate from scene-specific content such as
 * "menu" and "now playing".
 */
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
  osOriginalMenuSplit?: number;
  onOsOriginalMenuSplitChange?: (nextSplit: number) => void;
  osNowPlayingLayout?: IpodNowPlayingLayoutState;
  onOsNowPlayingLayoutChange?: (nextLayout: IpodNowPlayingLayoutState) => void;
  isEditable?: boolean;
  exportSafe?: boolean;
  animateText?: boolean;
  titlePreview?: boolean;
  titleCaptureReady?: boolean;
  onTitleOverflowChange?: (overflow: boolean) => void;
}

const SCREEN_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const EMPTY_OS_MENU_ITEMS: readonly { id: string; label: string }[] = [];
const DEFAULT_LAYOUT_POSITION: IpodNowPlayingLayoutPosition = { x: 0, y: 0 };

type NowPlayingDragState = {
  elementId: IpodNowPlayingLayoutElementId;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPosition: IpodNowPlayingLayoutPosition;
};

function clampDragOffset(value: number, maxDistance: number): number {
  return Math.round(Math.min(Math.max(value, -maxDistance), maxDistance));
}

function getLayoutPosition(
  layout: IpodNowPlayingLayoutState,
  elementId: IpodNowPlayingLayoutElementId,
): IpodNowPlayingLayoutPosition {
  return layout[elementId] ?? DEFAULT_LAYOUT_POSITION;
}

function hasSameLayoutPosition(
  left: IpodNowPlayingLayoutPosition,
  right: IpodNowPlayingLayoutPosition,
): boolean {
  return left.x === right.x && left.y === right.y;
}

/**
 * Battery glyph used inside the screen status bar.
 *
 * This is a display-chrome primitive, not device battery state. The fill is
 * intentionally static because the app is presenting a composed artwork scene
 * rather than simulating an operating system with live power telemetry.
 */
function ScreenBattery() {
  return (
    <div className="flex items-center gap-px" aria-hidden="true">
      <div className="relative h-[7px] w-[15px] rounded-[1px] border border-[#7B7B7B] bg-[#F7F7F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <div
          className="absolute inset-y-[1px] left-[1px] rounded-[0.5px]"
          style={{
            width: "72%",
            backgroundImage:
              "linear-gradient(180deg, rgba(170,224,109,1) 0%, rgba(119,183,64,1) 100%)",
          }}
        />
      </div>
      <div className="h-[3px] w-[2px] rounded-r-[1px] bg-[#7B7B7B]" />
    </div>
  );
}

/**
 * Render the active display scene inside the iPod front face.
 *
 * Current responsibilities:
 * - display surround, glass, and status bar chrome
 * - scene switching between menu and now playing
 * - direct editing for metadata fields
 * - drag layout mode for authentic OS composition experiments
 *
 * This scope is larger than ideal, so the component is documented explicitly
 * until it is split into display, scene, and panel subassemblies.
 */
export function IpodScreen({
  preset,
  skinColor,
  state,
  dispatch,
  playClick,
  interactionModel = "direct",
  osScreen = "now-playing",
  osMenuItems = EMPTY_OS_MENU_ITEMS,
  osMenuIndex = 0,
  osNowPlayingLayout = DEFAULT_OS_NOW_PLAYING_LAYOUT,
  onOsNowPlayingLayoutChange,
  isEditable = true,
  exportSafe = false,
  animateText = false,
  titlePreview = false,
  titleCaptureReady = false,
  onTitleOverflowChange,
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenFrameRef = useRef<HTMLDivElement | null>(null);
  const osNowPlayingLayoutRef = useRef(osNowPlayingLayout);
  const nowPlayingDragRef = useRef<NowPlayingDragState | null>(null);
  const screenTokens = preset.screen;
  const isStandardOsInteraction =
    interactionModel === "ipod-os" || interactionModel === "ipod-os-original";
  const showOsMenu = isStandardOsInteraction && osScreen === "menu";
  const isNowPlayingLayoutMode =
    isStandardOsInteraction && !showOsMenu && isEditable && !exportSafe;
  const shouldApplyNowPlayingLayout = isStandardOsInteraction && !showOsMenu;
  const isInlineEditingEnabled = isEditable && !isNowPlayingLayoutMode;
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

  useEffect(() => {
    osNowPlayingLayoutRef.current = osNowPlayingLayout;
  }, [osNowPlayingLayout]);

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

  const updateOsNowPlayingLayout = useCallback(
    (
      elementId: IpodNowPlayingLayoutElementId,
      nextPosition: IpodNowPlayingLayoutPosition,
      phase: "move" | "drop",
    ) => {
      const currentPosition = getLayoutPosition(osNowPlayingLayoutRef.current, elementId);
      if (hasSameLayoutPosition(currentPosition, nextPosition)) {
        return;
      }

      const nextLayout = { ...osNowPlayingLayoutRef.current };
      if (nextPosition.x === 0 && nextPosition.y === 0) {
        delete nextLayout[elementId];
      } else {
        nextLayout[elementId] = nextPosition;
      }

      osNowPlayingLayoutRef.current = nextLayout;
      onOsNowPlayingLayoutChange?.(nextLayout);
      console.info("[ipod-os-layout]", {
        phase,
        elementId,
        x: nextPosition.x,
        y: nextPosition.y,
      });
    },
    [onOsNowPlayingLayoutChange],
  );

  useEffect(() => {
    if (!isNowPlayingLayoutMode) {
      nowPlayingDragRef.current = null;
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = nowPlayingDragRef.current;
      const frame = screenFrameRef.current;
      if (!dragState || !frame || event.pointerId !== dragState.pointerId) {
        return;
      }

      const rect = frame.getBoundingClientRect();
      const maxX = Math.max(24, Math.round(rect.width / 2));
      const maxY = Math.max(
        24,
        Math.round((rect.height - screenTokens.statusBarHeight) / 2),
      );
      updateOsNowPlayingLayout(
        dragState.elementId,
        {
          x: clampDragOffset(
            dragState.startPosition.x + event.clientX - dragState.startClientX,
            maxX,
          ),
          y: clampDragOffset(
            dragState.startPosition.y + event.clientY - dragState.startClientY,
            maxY,
          ),
        },
        "move",
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = nowPlayingDragRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const finalPosition = getLayoutPosition(
        osNowPlayingLayoutRef.current,
        dragState.elementId,
      );
      console.info("[ipod-os-layout]", {
        phase: "drop",
        elementId: dragState.elementId,
        x: finalPosition.x,
        y: finalPosition.y,
      });
      nowPlayingDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isNowPlayingLayoutMode, screenTokens.statusBarHeight, updateOsNowPlayingLayout]);

  const startNowPlayingDrag = useCallback(
    (elementId: IpodNowPlayingLayoutElementId) =>
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isNowPlayingLayoutMode || event.button !== 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        playClick();
        nowPlayingDragRef.current = {
          elementId,
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startPosition: getLayoutPosition(osNowPlayingLayoutRef.current, elementId),
        };
      },
    [isNowPlayingLayoutMode, playClick],
  );

  const renderNowPlayingElement = useCallback(
    (
      elementId: IpodNowPlayingLayoutElementId,
      children: React.ReactNode,
      options?: {
        className?: string;
        style?: React.CSSProperties;
        testId?: string;
      },
    ) => {
      const position = shouldApplyNowPlayingLayout
        ? getLayoutPosition(osNowPlayingLayout, elementId)
        : DEFAULT_LAYOUT_POSITION;
      return (
        <div
          className={[
            options?.className,
            isNowPlayingLayoutMode
              ? "cursor-move touch-none rounded-[2px] outline outline-1 outline-dashed outline-[#5AA0DF]/65"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ...options?.style,
            transform:
              position.x === 0 && position.y === 0
                ? undefined
                : `translate(${position.x}px, ${position.y}px)`,
          }}
          data-testid={options?.testId}
          data-layout-element={elementId}
          data-layout-x={position.x}
          data-layout-y={position.y}
          onPointerDown={
            isNowPlayingLayoutMode ? startNowPlayingDrag(elementId) : undefined
          }
        >
          {children}
        </div>
      );
    },
    [
      isNowPlayingLayoutMode,
      osNowPlayingLayout,
      shouldApplyNowPlayingLayout,
      startNowPlayingDrag,
    ],
  );

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
        ref={screenFrameRef}
        className="relative h-full w-full overflow-hidden border"
        style={{
          backgroundColor: getSurfaceToken("screen.content.bg"),
          borderColor: getSurfaceToken("screen.border"),
          borderRadius: screenTokens.innerRadius,
          fontFamily: SCREEN_FONT_FAMILY,
        }}
      >
        {/* Status bar is display chrome shared across all screen scenes. */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            height: screenTokens.statusBarHeight,
            paddingInline: screenTokens.statusBarPaddingX,
            backgroundImage: `linear-gradient(180deg, ${getSurfaceToken("screen.statusbar.bg.from")}, ${getSurfaceToken("screen.statusbar.bg.to")})`,
            borderColor: "#9B9B9B",
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
            {!showOsMenu && <span className="text-[7px] text-[#3B79C4]">▶</span>}
            <span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
          </div>
          <ScreenBattery />
        </div>

        {showOsMenu ? (
          <>
            {/* Menu scene: left navigation list plus right-side preview pane. */}
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
          </>
        ) : (
          <>
            {/* Now Playing scene: artwork and track metadata occupy the main viewport. */}
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
                {renderNowPlayingElement(
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
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageUpload
                        currentImage={state.artwork}
                        onImageChange={(artwork) => {
                          if (!isInlineEditingEnabled) return;
                          dispatch({ type: "UPDATE_ARTWORK", payload: artwork });
                          playClick();
                        }}
                        disabled={!isInlineEditingEnabled}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>,
                  { testId: "os-layout-artwork" },
                )}
              </div>

              <div
                className="z-20 flex min-w-0 flex-col items-start pr-[2px] text-left"
                data-testid="track-meta"
              >
                {renderNowPlayingElement(
                  "title",
                  <div
                    className="min-w-0 font-semibold leading-[1.05] tracking-[-0.02em]"
                    style={{ color: titleColor, fontSize: screenTokens.titleFontSize }}
                  >
                    <EditableText
                      value={state.title}
                      onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                      disabled={!isInlineEditingEnabled}
                      className="max-w-full min-w-0"
                      editLabel="Edit title"
                      dataTestId="track-title-text"
                      animate={titlePreview || animateText}
                      preview={titlePreview || animateText}
                      captureReady={titleCaptureReady}
                      onOverflowChange={onTitleOverflowChange}
                      singleLine={!titlePreview && !animateText}
                    />
                  </div>,
                  {
                    className: "relative z-20 w-full min-w-0",
                    style: { marginBottom: screenTokens.titleMarginBottom },
                    testId: "track-title",
                  },
                )}

                {renderNowPlayingElement(
                  "artist",
                  <div
                    className="min-w-0 font-medium leading-[1.1] tracking-[-0.01em]"
                    style={{ color: artistColor, fontSize: screenTokens.artistFontSize }}
                  >
                    <EditableText
                      value={state.artist}
                      onChange={(val) =>
                        dispatch({ type: "UPDATE_ARTIST", payload: val })
                      }
                      disabled={!isInlineEditingEnabled}
                      className="max-w-full min-w-0"
                      editLabel="Edit artist"
                      dataTestId="track-artist-text"
                      singleLine
                    />
                  </div>,
                  {
                    className: "relative z-20 w-full min-w-0",
                    style: { marginBottom: screenTokens.artistMarginBottom },
                    testId: "track-artist",
                  },
                )}

                {renderNowPlayingElement(
                  "album",
                  <div
                    className="min-w-0 font-medium leading-[1.08] tracking-[-0.01em]"
                    style={{ color: albumColor, fontSize: screenTokens.albumFontSize }}
                  >
                    <EditableText
                      value={state.album}
                      onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                      disabled={!isInlineEditingEnabled}
                      className="max-w-full min-w-0"
                      editLabel="Edit album"
                      dataTestId="track-album-text"
                      singleLine
                    />
                  </div>,
                  {
                    className: "relative z-20 w-full min-w-0",
                    style: { marginBottom: screenTokens.albumMarginBottom },
                    testId: "track-album",
                  },
                )}

                {renderNowPlayingElement(
                  "rating",
                  <StarRating
                    rating={state.rating}
                    onChange={(rating) => {
                      if (!isInlineEditingEnabled) return;
                      dispatch({ type: "UPDATE_RATING", payload: rating });
                      playClick();
                    }}
                    disabled={!isInlineEditingEnabled}
                    fontSize={Math.max(7.6, screenTokens.metaFontSize - 0.2)}
                  />,
                  {
                    className: "relative z-20",
                    style: { marginBottom: screenTokens.metaMarginBottom },
                    testId: "os-layout-rating",
                  },
                )}

                {renderNowPlayingElement(
                  "track-info",
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
                      disabled={!isInlineEditingEnabled}
                    />
                  </div>,
                  { testId: "os-layout-track-info" },
                )}
              </div>
            </div>

            {/* Playback footer stays anchored as a separate scene region. */}
            {renderNowPlayingElement(
              "progress",
              <>
                <ProgressBar
                  currentTime={state.currentTime}
                  duration={state.duration}
                  onSeek={(currentTime) => {
                    if (!isInlineEditingEnabled) return;
                    remainingAnchorRef.current = null;
                    setCurrentTime(currentTime, false);
                    playClick();
                  }}
                  disabled={!isInlineEditingEnabled}
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
                  {renderNowPlayingElement(
                    "elapsed-time",
                    <EditableTime
                      value={state.currentTime}
                      onChange={(time) => {
                        if (!isInlineEditingEnabled) return;
                        setCurrentTime(time, true);
                      }}
                      disabled={!isInlineEditingEnabled}
                      editLabel="Edit elapsed time"
                    />,
                    {
                      testId: "elapsed-time",
                      style: { zIndex: 1 },
                    },
                  )}
                  {renderNowPlayingElement(
                    "remaining-time",
                    <div className="flex items-center gap-[1px] text-black">
                      <EditableTime
                        value={Math.max(state.duration - state.currentTime, 0)}
                        isRemaining
                        onChange={(remaining) => {
                          if (!isInlineEditingEnabled) return;
                          setRemainingTime(remaining);
                        }}
                        disabled={!isInlineEditingEnabled}
                        editLabel="Edit remaining time"
                      />
                    </div>,
                    {
                      testId: "remaining-time",
                      style: { zIndex: 1 },
                    },
                  )}
                </div>
              </>,
              {
                className: "absolute left-0 right-0",
                style: {
                  bottom: screenTokens.progressBottom,
                  height: screenTokens.progressHeight,
                  paddingInline: screenTokens.progressPaddingX,
                  paddingTop: screenTokens.progressPaddingTop,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,248,246,0.96) 100%)",
                },
                testId: "screen-progress",
              },
            )}
          </>
        )}

        {/* Glass overlays are purely optical and should not carry UI semantics. */}
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
