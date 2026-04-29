"use client";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import { IpodArtworkPanel } from "@/components/ipod/panels/ipod-artwork-panel";
import { IpodTrackMetaPanel } from "@/components/ipod/panels/ipod-track-meta-panel";
import { IpodPlaybackFooter } from "@/components/ipod/panels/ipod-playback-footer";
import type { IpodDisplayDispatch, RenderNowPlayingElement } from "./ipod-scene-types";

interface IpodNowPlayingSceneProps {
  screenTokens: IpodClassicPresetDefinition["screen"];
  state: SongMetadata;
  dispatch: IpodDisplayDispatch;
  renderElement: RenderNowPlayingElement;
  isInlineEditingEnabled: boolean;
  exportSafe: boolean;
  artworkShadow: string;
  playClick: () => void;
  titlePreview: boolean;
  animateText: boolean;
  titleCaptureReady: boolean;
  onTitleOverflowChange?: (overflow: boolean) => void;
  setCurrentTime: (currentTime: number, preserveRemaining?: boolean) => void;
  setRemainingTime: (remainingSeconds: number) => void;
  clearRemainingAnchor: () => void;
}

export function IpodNowPlayingScene({
  screenTokens,
  state,
  dispatch,
  renderElement,
  isInlineEditingEnabled,
  exportSafe,
  artworkShadow,
  playClick,
  titlePreview,
  animateText,
  titleCaptureReady,
  onTitleOverflowChange,
  setCurrentTime,
  setRemainingTime,
  clearRemainingAnchor,
}: IpodNowPlayingSceneProps) {
  return (
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
        <IpodArtworkPanel
          screenTokens={screenTokens}
          state={state}
          renderElement={renderElement}
          isInlineEditingEnabled={isInlineEditingEnabled}
          exportSafe={exportSafe}
          artworkShadow={artworkShadow}
          playClick={playClick}
          onArtworkChange={(artwork) =>
            dispatch({ type: "UPDATE_ARTWORK", payload: artwork })
          }
        />
        <IpodTrackMetaPanel
          screenTokens={screenTokens}
          state={state}
          renderElement={renderElement}
          isInlineEditingEnabled={isInlineEditingEnabled}
          titlePreview={titlePreview}
          animateText={animateText}
          titleCaptureReady={titleCaptureReady}
          onTitleOverflowChange={onTitleOverflowChange}
          onTitleChange={(value) => dispatch({ type: "UPDATE_TITLE", payload: value })}
          onArtistChange={(value) => dispatch({ type: "UPDATE_ARTIST", payload: value })}
          onAlbumChange={(value) => dispatch({ type: "UPDATE_ALBUM", payload: value })}
          onRatingChange={(rating) =>
            dispatch({ type: "UPDATE_RATING", payload: rating })
          }
          onTrackNumberChange={(value) =>
            dispatch({ type: "UPDATE_TRACK_NUMBER", payload: value })
          }
          onTotalTracksChange={(value) =>
            dispatch({ type: "UPDATE_TOTAL_TRACKS", payload: value })
          }
          playClick={playClick}
        />
      </div>
      <IpodPlaybackFooter
        screenTokens={screenTokens}
        state={state}
        renderElement={renderElement}
        isInlineEditingEnabled={isInlineEditingEnabled}
        onSeek={(currentTime) => {
          clearRemainingAnchor();
          setCurrentTime(currentTime, false);
        }}
        onElapsedTimeChange={(currentTime) => setCurrentTime(currentTime, true)}
        onRemainingTimeChange={setRemainingTime}
        playClick={playClick}
      />
    </>
  );
}
