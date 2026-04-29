"use client";

import { IpodProgressBar } from "@/components/ipod/controls/ipod-progress-bar";
import { EditableTime } from "@/components/ipod/editors/editable-time";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { screenChromeTokens } from "@/lib/design-system";
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
  const timeFontSize = Math.max(8, screenTokens.metaFontSize + 1);
  const timeWidth = Math.max(26, Math.round(timeFontSize * 2.8));

  return renderElement(
    "progress",
    <div
      className="flex w-full items-center justify-between font-bold leading-none text-black"
      style={{
        fontVariantNumeric: "tabular-nums",
        fontFamily: "Arial, sans-serif",
        fontSize: timeFontSize,
      }}
    >
      <div style={{ flexShrink: 0, width: timeWidth, textAlign: "right" }}>
        {renderElement(
          "elapsed-time",
          <EditableTime
            value={state.currentTime}
            onChange={onElapsedTimeChange}
            disabled={!isInlineEditingEnabled}
            editLabel="Edit elapsed time"
            className="block w-full text-right"
          />,
          {
            testId: "elapsed-time",
            style: { zIndex: 1 },
          },
        )}
      </div>
      <div className="min-w-0 flex-1 px-1.5">
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
          trackHeight={Math.min(
            14,
            Math.max(8, Math.round(screenTokens.progressHeight * 0.45)),
          )}
        />
      </div>
      <div style={{ flexShrink: 0, width: timeWidth, textAlign: "left" }}>
        {renderElement(
          "remaining-time",
          <div className="flex items-center text-black">
            <EditableTime
              value={Math.max(state.duration - state.currentTime, 0)}
              isRemaining
              onChange={onRemainingTimeChange}
              disabled={!isInlineEditingEnabled}
              editLabel="Edit remaining time"
              className="block w-full text-left"
            />
          </div>,
          {
            testId: "remaining-time",
            style: { zIndex: 1 },
          },
        )}
      </div>
    </div>,
    {
      className: "absolute left-0 right-0",
      style: {
        bottom: screenTokens.progressBottom,
        height: screenTokens.progressHeight,
        paddingInline: screenTokens.progressPaddingX,
        paddingTop: screenTokens.progressPaddingTop,
        background: screenChromeTokens.progress.footerBackground,
        display: "flex",
        alignItems: "center",
      },
      testId: "screen-progress",
    },
  );
}
