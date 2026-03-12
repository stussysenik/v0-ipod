"use client";

import { useRef, useCallback } from "react";
import { Battery } from "lucide-react";
import { StarRating } from "./star-rating";
import { ProgressBar } from "./progress-bar";
import { ImageUpload } from "./image-upload";
import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import { MarqueeText } from "@/components/ui/marquee-text";
import type { SongMetadata } from "@/types/ipod";

const SCREEN_SAFE_INSET_PX = 13;
const SCREEN_CONTENT_TOP_PX = 15;
const SCREEN_CONTENT_GAP_PX = 12;
const SCREEN_ARTWORK_SIZE_PX = 108;
const TRACK_META_TOP_PX = 1;
const TRACK_META_INSET_PX = 5;

interface IpodScreenProps {
  state: SongMetadata;
  dispatch: React.Dispatch<{ type: string; payload: string | number }>;
  playClick: () => void;
  isEditable?: boolean;
  exportSafe?: boolean;
  titlePreview?: boolean;
  titleCaptureReady?: boolean;
  onTitleOverflowChange?: (overflow: boolean) => void;
}

export function IpodScreen({
  state,
  dispatch,
  playClick,
  isEditable = true,
  exportSafe = false,
  titlePreview = false,
  titleCaptureReady = false,
  onTitleOverflowChange,
}: IpodScreenProps) {
  const remainingAnchorRef = useRef<number | null>(null);
  const screenShadow = "var(--ipod-screen-shadow)";
  const artworkShadow = "var(--ipod-artwork-shadow)";

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
      data-export-layer="screen"
      data-export-screen={exportSafe ? "true" : "false"}
      data-testid="ipod-screen"
    >
      <div className="w-full h-full bg-white rounded-[4px] overflow-hidden relative border-2 border-[#525252]">
        {/* STATUS BAR */}
        <div
          className="flex h-[20px] items-center justify-between border-b border-[#9B9B9B] bg-gradient-to-b from-[#F1F1F1] to-[#CDCDCD]"
          style={{
            paddingLeft: SCREEN_SAFE_INSET_PX,
            paddingRight: SCREEN_SAFE_INSET_PX,
          }}
        >
          <div
            className="flex items-center gap-1 text-[10px] font-bold tracking-tight text-black/80"
            style={{ lineHeight: "var(--ipod-screen-status-leading)" }}
          >
            <span className="text-blue-600">▶</span> Now Playing
          </div>
          <Battery
            className="h-3 w-4 text-black opacity-60"
            style={{ transform: "translateY(-0.5px)" }}
          />
        </div>

        {/* CONTENT GRID */}
        <div
          className="grid h-[168px] items-start"
          style={{
            gridTemplateColumns: `${SCREEN_ARTWORK_SIZE_PX}px minmax(0, 1fr)`,
            columnGap: SCREEN_CONTENT_GAP_PX,
            paddingLeft: SCREEN_SAFE_INSET_PX,
            paddingRight: SCREEN_SAFE_INSET_PX,
            paddingTop: SCREEN_CONTENT_TOP_PX,
          }}
          data-testid="screen-content"
          data-screen-safe-inset={SCREEN_SAFE_INSET_PX}
        >
          {/* LEFT: ARTWORK */}
          <div className="flex h-full items-start justify-start">
            <div
              className="bg-[#EEE] border border-[#9F9F9F] relative cursor-pointer transition-transform active:scale-[0.98]"
              style={{
                width: SCREEN_ARTWORK_SIZE_PX,
                height: SCREEN_ARTWORK_SIZE_PX,
                boxShadow: artworkShadow,
              }}
              data-export-layer="artwork"
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
          <div
            className="flex min-w-0 flex-1 flex-col items-start overflow-hidden text-left z-20"
            style={{
              paddingTop: TRACK_META_TOP_PX,
              paddingLeft: TRACK_META_INSET_PX,
              paddingRight: TRACK_META_INSET_PX,
            }}
            data-testid="track-meta"
          >
            {/* Title */}
            <div className="relative z-20 mb-1 w-full min-w-0" data-testid="track-title">
              <div
                className="min-w-0 text-[14px] font-bold text-black tracking-[0.01em]"
                style={{ lineHeight: "var(--ipod-screen-copy-leading)" }}
              >
                {titlePreview || titleCaptureReady ? (
                  <MarqueeText
                    text={state.title}
                    preview={titlePreview}
                    captureReady={titleCaptureReady}
                    className="font-bold max-w-full min-w-0"
                    dataTestId="track-title-text"
                    onOverflowChange={onTitleOverflowChange}
                  />
                ) : (
                  <EditableText
                    value={state.title}
                    onChange={(val) => dispatch({ type: "UPDATE_TITLE", payload: val })}
                    disabled={!isEditable}
                    className="font-bold max-w-full min-w-0 mx-0 px-0"
                    editLabel="Edit title"
                    dataTestId="track-title-text"
                  />
                )}
              </div>
            </div>

            {/* Artist */}
            <div className="relative z-20 mb-1 w-full min-w-0" data-testid="track-artist">
              <div
                className="min-w-0 text-[12px] font-semibold text-[#595959]"
                style={{ lineHeight: "var(--ipod-screen-copy-leading)" }}
              >
                <EditableText
                  value={state.artist}
                  onChange={(val) => dispatch({ type: "UPDATE_ARTIST", payload: val })}
                  disabled={!isEditable}
                  className="font-semibold text-[#555] max-w-full min-w-0 mx-0 px-0"
                  editLabel="Edit artist"
                  dataTestId="track-artist-text"
                />
              </div>
            </div>

            {/* Album */}
            <div
              className="relative z-20 mb-2.5 w-full min-w-0"
              data-testid="track-album"
            >
              <div
                className="min-w-0 text-[12px] font-medium text-[#757575]"
                style={{ lineHeight: "var(--ipod-screen-copy-leading)" }}
              >
                <EditableText
                  value={state.album}
                  onChange={(val) => dispatch({ type: "UPDATE_ALBUM", payload: val })}
                  disabled={!isEditable}
                  className="font-medium text-[#777] max-w-full min-w-0 mx-0 px-0"
                  editLabel="Edit album"
                  dataTestId="track-album-text"
                />
              </div>
            </div>

            {/* Meta */}
            <div
              className="mb-1 text-[10px] text-[#868686]"
              style={{ lineHeight: "var(--ipod-screen-status-leading)" }}
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

            <div className="relative z-20 mt-[1px]">
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
        <div
          className="absolute bottom-[6px] left-0 right-0 h-[42px] bg-white py-1.5"
          style={{
            paddingLeft: SCREEN_SAFE_INSET_PX,
            paddingRight: SCREEN_SAFE_INSET_PX,
          }}
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
          <div
            className="mt-1 flex items-center justify-between font-mono text-[11px] font-semibold tracking-tight text-black"
            style={{ lineHeight: "var(--ipod-screen-status-leading)" }}
          >
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
