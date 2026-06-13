"use client";

import { useMemo } from "react";
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
	const artworkSrc = state.artwork || PLACEHOLDER_LOGO_SRC;

	const reflectionHeight = useMemo(
		() => Math.round(screenTokens.artworkSize * 0.30),
		[screenTokens.artworkSize],
	);

	const reflectionMask = useMemo(
		() =>
			`linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)`,
		[],
	);

	return (
		<div className="flex h-full items-center justify-start">
			{renderElement(
				"artwork",
				<div 
					className="relative"
					style={{
						perspective: "800px",
						perspectiveOrigin: "center center",
					}}
				>
					<div
						style={{
							transform: "rotateY(-14deg) rotateX(2deg) scale(0.92)",
							transformStyle: "preserve-3d",
						}}
					>
						{/* Authentic "Floor" Reflection - flat 2D image, perfectly aligned */}
						<div
							className="pointer-events-none absolute left-0 top-full"
							style={{
								width: screenTokens.artworkSize,
								height: reflectionHeight,
								overflow: "hidden",
								maskImage: reflectionMask,
								WebkitMaskImage: reflectionMask,
							}}
							aria-hidden="true"
						>
							<img
								src={artworkSrc}
								alt=""
								style={{
									position: "absolute",
									top: 0,
									width: "100%",
									height: screenTokens.artworkSize,
									transform: "scaleY(-1)",
									transformOrigin: "center center",
									objectFit: "cover",
								}}
							/>
						</div>

						{/* Primary artwork */}
						<div
							className="relative cursor-pointer bg-[#F0F0EE] transition-transform active:scale-[0.985]"
							style={{
								width: screenTokens.artworkSize,
								height: screenTokens.artworkSize,
								// Hairline keyline first (crisp 0.5px edge), then the lifted
								// drop shadow — order matters so the keyline reads as the tile's
								// own bevel, not a blurry halo.
								boxShadow: `inset 0 0 0 0.5px rgba(0,0,0,0.12), ${artworkShadow}`,
								zIndex: 10,
								// Promote the cover to its own GPU layer rasterized at device
								// resolution, so sampling it through the screen's 3D transform
								// stays as sharp as the source allows (no extra compositor blur).
								transform: "translateZ(0)",
								backfaceVisibility: "hidden",
								WebkitBackfaceVisibility: "hidden",
								// A whisper of saturation + contrast so the cover "pops" against
								// the white screen without looking processed. This is the sauce.
								filter: "saturate(1.06) contrast(1.03)",
							}}
							data-export-layer="artwork"
						>
							{exportSafe ? (
								<img
									src={artworkSrc}
									data-export-src={artworkSrc}
									alt="Album artwork"
									className="h-full w-full object-cover"
								/>
							) : (
								<ImageUpload
									currentImage={state.artwork}
									onImageChange={(artwork) => {
										if (!isInlineEditingEnabled) return;
										onArtworkChange(artwork);
										playClick();
									}}
									disabled={!isInlineEditingEnabled}
									className="h-full w-full object-cover"
								/>
							)}
						</div>
					</div>
				</div>,
				{ testId: "os-layout-artwork" },
			)}
		</div>
	);
}

