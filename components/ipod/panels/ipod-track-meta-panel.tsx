"use client";

import { IpodStarRating } from "@/components/ipod/controls/ipod-star-rating";
import { EditableText } from "@/components/ipod/editors/editable-text";
import { EditableTrackNumber } from "@/components/ipod/editors/editable-track-number";
import { getTextTokenCss } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import type { RenderNowPlayingElement } from "@/components/ipod/scenes/ipod-scene-types";

interface IpodTrackMetaPanelProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  state: SongMetadata;
  renderElement: RenderNowPlayingElement;
  isInlineEditingEnabled: boolean;
  titlePreview: boolean;
  animateText: boolean;
  titleCaptureReady: boolean;
  onTitleOverflowChange?: (overflow: boolean) => void;
  onTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onAlbumChange: (value: string) => void;
  onRatingChange: (rating: number) => void;
  onTrackNumberChange: (value: number) => void;
  onTotalTracksChange: (value: number) => void;
  playClick: () => void;
}

export function IpodTrackMetaPanel({
  screenTokens,
  state,
  renderElement,
  isInlineEditingEnabled,
  titlePreview,
  animateText,
  titleCaptureReady,
  onTitleOverflowChange,
  onTitleChange,
  onArtistChange,
  onAlbumChange,
  onRatingChange,
  onTrackNumberChange,
  onTotalTracksChange,
  playClick,
}: IpodTrackMetaPanelProps) {
  const titleColor = getTextTokenCss("screen.title");
  const artistColor = getTextTokenCss("screen.artist");
  const albumColor = getTextTokenCss("screen.album");
  const trackInfoColor = getTextTokenCss("screen.trackInfo");

  return (
    <div
      className="z-20 flex min-w-0 flex-col items-start pr-[2px] text-left"
      data-testid="track-meta"
    >
      {renderElement(
        "title",
        <div
          className="min-w-0 font-semibold leading-[1.05] tracking-[-0.02em]"
          style={{ color: titleColor, fontSize: screenTokens.titleFontSize }}
        >
          <EditableText
            value={state.title}
            onChange={onTitleChange}
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

      {renderElement(
        "artist",
        <div
          className="min-w-0 font-medium leading-[1.1] tracking-[-0.01em]"
          style={{ color: artistColor, fontSize: screenTokens.artistFontSize }}
        >
          <EditableText
            value={state.artist}
            onChange={onArtistChange}
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

      {renderElement(
        "album",
        <div
          className="min-w-0 font-medium leading-[1.08] tracking-[-0.01em]"
          style={{ color: albumColor, fontSize: screenTokens.albumFontSize }}
        >
          <EditableText
            value={state.album}
            onChange={onAlbumChange}
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

      {renderElement(
        "rating",
        <IpodStarRating
          rating={state.rating}
          onChange={(rating) => {
            if (!isInlineEditingEnabled) {
              return;
            }

            onRatingChange(rating);
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

      {renderElement(
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
            onTrackNumberChange={onTrackNumberChange}
            onTotalTracksChange={onTotalTracksChange}
            disabled={!isInlineEditingEnabled}
          />
        </div>,
        { testId: "os-layout-track-info" },
      )}
    </div>
  );
}
