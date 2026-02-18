"use client";

import { useRef, useCallback } from "react";
import { Battery } from "lucide-react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import type { SongMetadata } from "@/types/ipod";

interface IpodScreenProps {
  state: SongMetadata;
  dispatch: React.Dispatch<{ type: string; payload: string | number }>;
  playClick: () => void;
  isEditable?: boolean;
  exportSafe?: boolean;
}

export function IpodScreen({
  state,
  dispatch,
  playClick,
  isEditable = true,
  exportSafe = false,
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenShadow = exportSafe
    ? "0 2px 0 rgba(0,0,0,0.82), 0 1px 3px rgba(0,0,0,0.22)"
    : "0 3px 0 rgba(0,0,0,0.84), 0 1px 5px rgba(0,0,0,0.32)";
  const artworkShadow = exportSafe
    ? "0 3px 8px -6px rgba(0,0,0,0.35)"
    : "0 6px 12px -8px rgba(0,0,0,0.42)";

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
      className="w-[322px] h-[240px] bg-black rounded-[10px] p-[2px] mx-auto z-10 shrink-0 relative"
      style={{ boxShadow: screenShadow }}
    >
      <div className="w-full h-full bg-white rounded-[4px] overflow-hidden relative border-2 border-[#525252]">
        {/* STATUS BAR */}
        <div className="h-[20px] bg-gradient-to-b from-[#F1F1F1] to-[#CDCDCD] border-b border-[#9B9B9B] flex items-center justify-between px-2">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-tight text-black/80">
            <span className="text-blue-600">▶</span> Now Playing
          </div>
          <Battery className="w-4 h-3 text-black opacity-60" />
        </div>

        {/* CONTENT GRID */}
        <div className="flex h-[180px]">
          {/* LEFT: ARTWORK */}
          <div className="w-[140px] h-full p-3 flex flex-col justify-start items-center">
            <div
              className="w-[114px] h-[114px] bg-[#EEE] border border-[#9F9F9F] relative cursor-pointer transition-transform active:scale-[0.98]"
              style={{ boxShadow: artworkShadow }}
            >
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
            </div>
          </div>

          {/* RIGHT: INFO (Editable) */}
          <div className="flex-1 pt-6 pr-2 overflow-hidden flex flex-col items-start text-left z-20">
            {/* Title */}
            <div className="w-full mb-1 relative z-20">
              <div className="text-[14px] font-bold text-black tracking-[0.01em] leading-tight">
                <EditableText
                  value={state.title}
                  onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                  disabled={!isEditable}
                  className="font-bold min-w-[50px] -ml-1 pl-1"
                />
              </div>
            </div>

            {/* Artist */}
            <div className="w-full mb-1 relative z-20">
              <div className="text-[12px] font-semibold text-[#595959] leading-tight">
                <EditableText
                  value={state.artist}
                  onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                  disabled={!isEditable}
                  className="font-semibold text-[#555] -ml-1 pl-1"
                />
              </div>
            </div>

            {/* Album */}
            <div className="w-full mb-3 relative z-20">
              <div className="text-[12px] font-medium text-[#757575] leading-tight">
                <EditableText
                  value={state.album}
                  onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                  disabled={!isEditable}
                  className="font-medium text-[#777] -ml-1 pl-1"
                />
              </div>
            </div>

            {/* Meta */}
            <div className="text-[10px] text-[#868686] mb-1">
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

        {/* BOTTOM: PROGRESS */}
        <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-white px-3 py-2">
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
          <div className="flex justify-between items-center mt-0.5 text-[11px] font-semibold tracking-tight text-black font-mono">
            <div data-testid="elapsed-time">
              <EditableTime
                value={state.currentTime}
                onChange={(time) => {
                  if (!isEditable) return;
                  setCurrentTime(time, true);
                }}
                disabled={!isEditable}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
