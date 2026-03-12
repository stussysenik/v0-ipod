"use client";

import { useRef, useCallback } from "react";
import { Battery } from "lucide-react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import placeholderLogo from "@/public/placeholder-logo.png";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import type { SongMetadata } from "@/types/ipod";

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
  state: SongMetadata;
  dispatch: React.Dispatch<IpodScreenAction>;
  playClick: () => void;
  isEditable?: boolean;
  exportSafe?: boolean;
  animateText?: boolean;
}

export function IpodScreen({
  state,
  dispatch,
  playClick,
  isEditable = true,
  exportSafe = false,
  animateText = false,
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenShadow = exportSafe
    ? "none"
    : "0 8px 16px -14px rgba(0,0,0,0.9), 0 3px 8px rgba(0,0,0,0.22)";
  const artworkShadow = exportSafe ? "none" : "0 6px 12px -8px rgba(0,0,0,0.42)";
  const screenSurface = {
    background: "linear-gradient(180deg, #0b0b0b 0%, #171717 22%, #050505 100%)",
  };
  const glassOverlay = {
    background: exportSafe
      ? "linear-gradient(154deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 16%, rgba(255,255,255,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.05) 100%)"
      : "linear-gradient(154deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 16%, rgba(255,255,255,0) 42%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.06) 100%)",
  };

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

  return (
    <div
      className="relative z-10 mx-auto h-[240px] w-[322px] shrink-0 rounded-[10px] p-[2px]"
      style={{ ...screenSurface, boxShadow: screenShadow }}
      data-export-layer="screen"
      data-testid="ipod-screen"
    >
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[9px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 18%, rgba(0,0,0,0.12) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="w-full h-full bg-white rounded-[4px] overflow-hidden relative border-2 border-[#525252]">
        {/* STATUS BAR */}
        <div className="h-[20px] bg-gradient-to-b from-[#F1F1F1] to-[#CDCDCD] border-b border-[#9B9B9B] flex items-center justify-between px-2">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-tight text-black/80">
            <span className="text-blue-600">▶</span> Now Playing
          </div>
          <Battery className="w-4 h-3 text-black opacity-60" />
        </div>

        {/* CONTENT GRID */}
        <div className="flex h-[168px]" data-testid="screen-content">
          {/* LEFT: ARTWORK */}
          <div className="w-[140px] h-full px-[14px] pt-[5px] pb-0 flex flex-col justify-start items-center">
            <div
              className="w-[114px] h-[114px] bg-[#EEE] border border-[#9F9F9F] relative cursor-pointer transition-transform active:scale-[0.98]"
              style={{ boxShadow: artworkShadow }}
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

          {/* RIGHT: INFO (Editable) */}
          <div
            className="flex min-w-0 flex-1 flex-col items-start pt-[5px] pr-[14px] text-left z-20"
            data-testid="track-meta"
          >
            {/* Title */}
            <div className="relative z-20 mb-1 w-full min-w-0" data-testid="track-title">
              <div className="min-w-0 text-[14px] font-bold text-black tracking-[0.01em] leading-[1.15]">
                <EditableText
                  value={state.title}
                  onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                  disabled={!isEditable}
                  className="font-bold -ml-1 max-w-full min-w-0 pl-1"
                  editLabel="Edit title"
                  dataTestId="track-title-text"
                  animate={animateText}
                />
              </div>
            </div>

            {/* Artist */}
            <div className="relative z-20 mb-1 w-full min-w-0" data-testid="track-artist">
              <div className="min-w-0 text-[12px] font-semibold text-[#595959] leading-[1.2]">
                <EditableText
                  value={state.artist}
                  onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                  disabled={!isEditable}
                  className="font-semibold text-[#555] -ml-1 max-w-full min-w-0 pl-1"
                  editLabel="Edit artist"
                  dataTestId="track-artist-text"
                  animate={animateText}
                />
              </div>
            </div>

            {/* Album */}
            <div className="relative z-20 mb-[9px] w-full min-w-0" data-testid="track-album">
              <div className="min-w-0 text-[12px] font-medium text-[#757575] leading-[1.2]">
                <EditableText
                  value={state.album}
                  onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                  disabled={!isEditable}
                  className="font-medium text-[#777] -ml-1 max-w-full min-w-0 pl-1"
                  editLabel="Edit album"
                  dataTestId="track-album-text"
                  animate={animateText}
                />
              </div>
            </div>

            {/* Meta */}
            <div className="text-[10px] text-[#868686] mb-[6px]">
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

            <div className="scale-75 origin-left -ml-1 relative z-20">
              <StarRating
                rating={state.rating}
                onChange={(rating) => {
                  if (!isEditable) return;
                  dispatch({ type: "UPDATE_RATING", payload: rating });
                  playClick();
                }}
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-[4px]"
          style={glassOverlay}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[10px] top-[8px] h-[44%] w-[60%] rounded-[24px] opacity-65"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0) 60%)",
          }}
          aria-hidden="true"
        />

        {/* BOTTOM: PROGRESS */}
        <div
          className="absolute bottom-[6px] left-0 right-0 h-[42px] bg-white px-3 py-1.5"
          data-testid="screen-progress"
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
          />
          <div className="mt-0.5 flex items-center justify-between text-[11px] font-semibold tracking-tight text-black font-mono">
            <div data-testid="elapsed-time">
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
            {/* Remaining Time (Editable) */}
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
    </div>
  );
}
