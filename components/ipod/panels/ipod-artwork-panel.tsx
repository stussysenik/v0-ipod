"use client";

import { ImageUpload } from "@/components/ipod/editors/image-upload";
import type { SongMetadata } from "@/types/ipod";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { RenderNowPlayingElement } from "@/components/ipod/scenes/ipod-scene-types";
import { PLACEHOLDER_LOGO_SRC } from "@/lib/ipod-assets";

interface IpodArtworkPanelProps {
	screenTokens: IpodClassicPresetDefinition["screen"];
	state: SongMetadata;
	renderElement: RenderNowPlayingElement;
	isInlineEditingEnabled: boolean;
	exportSafe: boolean;
	artworkShadow: string;
	playClick: () => void;
	onArtworkChange: (artwork: string) => void;
}

export function IpodArtworkPanel({
	screenTokens,
	state,
	renderElement,
	isInlineEditingEnabled,
	exportSafe,
	artworkShadow,
	playClick,
	onArtworkChange,
}: IpodArtworkPanelProps) {
	return (
		<div className="flex h-full items-center justify-start">
			{renderElement(
				"artwork",
				<div className="relative" style={{ perspective: 600 }}>
					<div
						className="relative cursor-pointer border border-[#B8B8B8] bg-[#F0F0EE] transition-transform active:scale-[0.985]"
						style={{
							width: screenTokens.artworkSize,
							height: screenTokens.artworkSize,
							boxShadow: artworkShadow,
							zIndex: 10,
							transform: "rotateY(20deg) scale(0.95)",
							transformOrigin: "left center",
						}}
						data-export-layer="artwork"
					>
						{exportSafe ? (
							<img
								src={
									state.artwork ||
									PLACEHOLDER_LOGO_SRC
								}
								data-export-src={
									state.artwork ||
									PLACEHOLDER_LOGO_SRC
								}
								alt="Album artwork"
								className="h-full w-full object-cover"
							/>
						) : (
							<ImageUpload
								currentImage={state.artwork}
								onImageChange={(artwork) => {
									if (
										!isInlineEditingEnabled
									) {
										return;
									}

									onArtworkChange(artwork);
									playClick();
								}}
								disabled={!isInlineEditingEnabled}
								className="h-full w-full object-cover"
							/>
						)}
					</div>
				</div>,
				{ testId: "os-layout-artwork" },
			)}
		</div>
	);
}
