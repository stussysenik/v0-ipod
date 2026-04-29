"use client";

import { IpodProgressBar } from "@/components/ipod/controls/ipod-progress-bar";
import { EditableTime } from "@/components/ipod/editors/editable-time";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import type { RenderNowPlayingElement } from "@/components/ipod/scenes/ipod-scene-types";

interface IpodPlaybackFooterProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  state: SongMetadata;
  renderElement: RenderNowPlayingElement;
  isInlineEditingEnabled: boolean;
  onSeek: (currentTime: number) => void;
  onElapsedTimeChange: (currentTime: number) => void;
  onRemainingTimeChange: (remainingTime: number) => void;
  playClick: () => void;
}

export function IpodPlaybackFooter({
  screenTokens,
  state,
  renderElement,
  isInlineEditingEnabled,
  onSeek,
  onElapsedTimeChange,
  onRemainingTimeChange,
  playClick,
}: IpodPlaybackFooterProps) {
  return renderElement(
    "progress",
    <>
      <IpodProgressBar
        currentTime={state.currentTime}
        duration={state.duration}
        onSeek={(currentTime) => {
          if (!isInlineEditingEnabled) {
            return;
          }

          onSeek(currentTime);
          playClick();
        }}
        disabled={!isInlineEditingEnabled}
        trackHeight={screenTokens.progressHeight >= 33 ? 6 : 5}
      />
      <div
        className="mt-[3px] flex items-center justify-between font-semibold leading-none tracking-[-0.02em] text-black"
        style={{
          fontVariantNumeric: "tabular-nums",
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: Math.max(8, screenTokens.metaFontSize + 1),
        }}
      >
        {renderElement(
          "elapsed-time",
          <EditableTime
            value={state.currentTime}
            onChange={onElapsedTimeChange}
            disabled={!isInlineEditingEnabled}
            editLabel="Edit elapsed time"
          />,
          {
            testId: "elapsed-time",
            style: { zIndex: 1 },
          },
        )}
        {renderElement(
          "remaining-time",
          <div className="flex items-center gap-[1px] text-black">
            <EditableTime
              value={Math.max(state.duration - state.currentTime, 0)}
              isRemaining
              onChange={onRemainingTimeChange}
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
  );
}
