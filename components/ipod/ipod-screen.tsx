"use client";

import { useCallback, useEffect, useRef } from "react";

import { deriveScreenSurround, getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import placeholderLogo from "@/public/placeholder-logo.png";

import { EditableText } from "./editable-text";
import { EditableTime } from "./editable-time";
import { EditableTrackNumber } from "./editable-track-number";
import { ImageUpload } from "./image-upload";
import { ProgressBar } from "./progress-bar";
import { StarRating } from "./star-rating";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import type { IpodInteractionModel, IpodOsScreen } from "@/types/ipod-state";

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
	preset: IpodClassicPresetDefinition;
	skinColor?: string;
	state: SongMetadata;
	dispatch: React.Dispatch<IpodScreenAction>;
	playClick: () => void;
	interactionModel?: IpodInteractionModel;
	osScreen?: IpodOsScreen;
	osMenuItems?: readonly { id: string; label: string }[];
	osMenuIndex?: number;
	isEditable?: boolean;
	exportSafe?: boolean;
	animateText?: boolean;
	titlePreview?: boolean;
	titleCaptureReady?: boolean;
	onTitleOverflowChange?: (overflow: boolean) => void;
}

const SCREEN_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function ScreenBattery() {
	return (
		<div aria-hidden="true" className="flex items-center gap-px">
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

export function IpodScreen({
	preset,
	skinColor,
	state,
	dispatch,
	playClick,
	interactionModel = "direct",
	osScreen = "now-playing",
	osMenuItems = [],
	osMenuIndex = 0,
	isEditable = true,
	exportSafe = false,
	animateText = false,
	titlePreview = false,
	titleCaptureReady = false,
	onTitleOverflowChange,
}: IpodScreenProps) {
	const remainingAnchorRef = useRef<number | null>(null);
	const screenTokens = preset.screen;
	const showOsMenu = interactionModel === "ipod-os" && osScreen === "menu";
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

	return (
		<div
			className="relative z-10 mx-auto shrink-0 p-[1px]"
			data-export-layer="screen"
			data-testid="ipod-screen"
			style={{
				...screenSurface,
				boxShadow: screenShadow,
				width: screenTokens.frameWidth,
				height: screenTokens.frameHeight,
				borderRadius: screenTokens.outerRadius,
			}}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-[1px]"
				style={{
					background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 18%, rgba(0,0,0,0.06) 100%)",
					borderRadius: Math.max(1, screenTokens.outerRadius - 1),
				}}
			/>
			<div
				className="relative h-full w-full overflow-hidden border"
				style={{
					backgroundColor: getSurfaceToken("screen.content.bg"),
					borderColor: getSurfaceToken("screen.border"),
					borderRadius: screenTokens.innerRadius,
					fontFamily: SCREEN_FONT_FAMILY,
				}}
			>
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
						data-testid="screen-status-label"
						style={{
							color: statusBarTextColor,
							fontSize: Math.max(
								7.5,
								screenTokens.statusBarHeight - 8,
							),
						}}
					>
						{!showOsMenu && (
							<span className="text-[7px] text-[#3B79C4]">
								▶
							</span>
						)}
						<span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
					</div>
					<ScreenBattery />
				</div>

				{showOsMenu ? (
					<div
						className="grid overflow-hidden"
						data-testid="ipod-os-menu"
						style={{
							height:
								screenTokens.frameHeight -
								screenTokens.statusBarHeight -
								2,
							gridTemplateColumns:
								"minmax(0, 1.08fr) minmax(0, 0.92fr)",
						}}
					>
						<div className="border-r border-[#AEB4BC] bg-[#FBFBF9] py-[6px]">
							{osMenuItems.map((item, index) => {
								const isActive =
									index === osMenuIndex;
								return (
									<div
										key={item.id}
										className="flex items-center justify-between gap-2 px-[8px] py-[3.5px] text-[10px] font-semibold leading-[1.15]"
										data-testid={
											isActive
												? "ipod-os-selected-menu-item"
												: undefined
										}
										style={{
											color: isActive
												? "#FFFFFF"
												: "#111111",
											background: isActive
												? "linear-gradient(180deg, rgba(104,181,242,1) 0%, rgba(49,137,211,1) 100%)"
												: "transparent",
										}}
									>
										<span>
											{item.label}
										</span>
										{isActive ? (
											<span aria-hidden="true">
												›
											</span>
										) : (
											<span aria-hidden="true" />
										)}
									</div>
								);
							})}
						</div>
						<div className="flex items-center justify-center bg-[#F4F4F0] p-[8px]">
							{osMenuItems[osMenuIndex]?.id ===
							"about" ? (
								<div
									className="flex flex-col items-center justify-center text-center"
									data-testid="about-panel"
									style={{
										fontFamily: SCREEN_FONT_FAMILY,
									}}
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
							) : osMenuItems[osMenuIndex]?.id ===
							  "now-playing" ? (
								<div
									className="flex w-full flex-col items-center gap-[4px]"
									data-testid="now-playing-preview"
									style={{
										fontFamily: SCREEN_FONT_FAMILY,
									}}
								>
									<div
										className="overflow-hidden border border-[#C8C9CA] bg-white"
										style={{
											width:
												menuArtworkSize -
												16,
											height:
												menuArtworkSize -
												16,
											boxShadow: artworkShadow,
										}}
									>
										<img
											alt="Album artwork"
											className="h-full w-full object-cover"
											src={
												state.artwork ||
												placeholderLogo.src
											}
										/>
									</div>
									<div className="w-full text-center">
										<div className="truncate text-[8px] font-bold leading-[1.2] text-[#111]">
											{
												state.title
											}
										</div>
										<div className="truncate text-[7px] font-medium leading-[1.2] text-[#555]">
											{
												state.artist
											}
										</div>
									</div>
								</div>
							) : (
								<div
									className="overflow-hidden border border-[#C8C9CA] bg-white"
									data-export-layer="artwork"
									style={{
										width: menuArtworkSize,
										height: menuArtworkSize,
										boxShadow: artworkShadow,
									}}
								>
									<img
										alt="Album artwork"
										className="h-full w-full object-cover"
										data-export-src={
											state.artwork ||
											placeholderLogo.src
										}
										src={
											state.artwork ||
											placeholderLogo.src
										}
									/>
								</div>
							)}
						</div>
					</div>
				) : (
					<>
						<div
							className="grid overflow-hidden"
							data-testid="screen-content"
							style={{
								height: `calc(100% - ${screenTokens.statusBarHeight + screenTokens.progressHeight + screenTokens.progressBottom + 2}px)`,
								gridTemplateColumns: `${screenTokens.artworkColumnWidth}px minmax(0, 1fr)`,
								columnGap: screenTokens.contentGapX,
								paddingInline:
									screenTokens.contentPaddingX,
								paddingTop: screenTokens.contentPaddingTop,
							}}
						>
							<div className="flex h-full items-start justify-start">
								<div
									className="relative cursor-pointer border border-[#B8B8B8] bg-[#F0F0EE] transition-transform active:scale-[0.985]"
									data-export-layer="artwork"
									style={{
										width: screenTokens.artworkSize,
										height: screenTokens.artworkSize,
										boxShadow: artworkShadow,
									}}
								>
									{exportSafe ? (
										<img
											alt="Album artwork"
											className="w-full h-full object-cover"
											data-export-src={
												state.artwork ||
												placeholderLogo.src
											}
											src={
												state.artwork ||
												placeholderLogo.src
											}
										/>
									) : (
										<ImageUpload
											className="w-full h-full object-cover"
											currentImage={
												state.artwork
											}
											disabled={
												!isEditable
											}
											onImageChange={(
												artwork,
											) => {
												if (
													!isEditable
												)
													return;
												dispatch(
													{
														type: "UPDATE_ARTWORK",
														payload: artwork,
													},
												);
												playClick();
											}}
										/>
									)}
								</div>
							</div>

							<div
								className="z-20 flex min-w-0 flex-col items-start pr-[2px] text-left"
								data-testid="track-meta"
							>
								<div
									className="relative z-20 w-full min-w-0"
									data-testid="track-title"
									style={{
										marginBottom:
											screenTokens.titleMarginBottom,
									}}
								>
									<div
										className="min-w-0 font-semibold leading-[1.05] tracking-[-0.02em]"
										style={{
											color: titleColor,
											fontSize: screenTokens.titleFontSize,
										}}
									>
										<EditableText
											animate={
												titlePreview ||
												animateText
											}
											captureReady={
												titleCaptureReady
											}
											className="max-w-full min-w-0"
											dataTestId="track-title-text"
											disabled={
												!isEditable
											}
											editLabel="Edit title"
											preview={
												titlePreview ||
												animateText
											}
											singleLine={
												!titlePreview &&
												!animateText
											}
											value={
												state.title
											}
											onChange={(
												val,
											) =>
												dispatch(
													{
														type: "UPDATE_TITLE",
														payload: val,
													},
												)
											}
											onOverflowChange={
												onTitleOverflowChange
											}
										/>
									</div>
								</div>

								<div
									className="relative z-20 w-full min-w-0"
									data-testid="track-artist"
									style={{
										marginBottom:
											screenTokens.artistMarginBottom,
									}}
								>
									<div
										className="min-w-0 font-medium leading-[1.1] tracking-[-0.01em]"
										style={{
											color: artistColor,
											fontSize: screenTokens.artistFontSize,
										}}
									>
										<EditableText
											singleLine
											className="max-w-full min-w-0"
											dataTestId="track-artist-text"
											disabled={
												!isEditable
											}
											editLabel="Edit artist"
											value={
												state.artist
											}
											onChange={(
												val,
											) =>
												dispatch(
													{
														type: "UPDATE_ARTIST",
														payload: val,
													},
												)
											}
										/>
									</div>
								</div>

								<div
									className="relative z-20 w-full min-w-0"
									data-testid="track-album"
									style={{
										marginBottom:
											screenTokens.albumMarginBottom,
									}}
								>
									<div
										className="min-w-0 font-medium leading-[1.08] tracking-[-0.01em]"
										style={{
											color: albumColor,
											fontSize: screenTokens.albumFontSize,
										}}
									>
										<EditableText
											singleLine
											className="max-w-full min-w-0"
											dataTestId="track-album-text"
											disabled={
												!isEditable
											}
											editLabel="Edit album"
											value={
												state.album
											}
											onChange={(
												val,
											) =>
												dispatch(
													{
														type: "UPDATE_ALBUM",
														payload: val,
													},
												)
											}
										/>
									</div>
								</div>

								<div
									className="relative z-20"
									style={{
										marginBottom:
											screenTokens.metaMarginBottom,
									}}
								>
									<StarRating
										disabled={
											!isEditable
										}
										fontSize={Math.max(
											7.6,
											screenTokens.metaFontSize -
												0.2,
										)}
										rating={
											state.rating
										}
										onChange={(
											rating,
										) => {
											if (
												!isEditable
											)
												return;
											dispatch({
												type: "UPDATE_RATING",
												payload: rating,
											});
											playClick();
										}}
									/>
								</div>

								<div
									className="font-medium leading-none tracking-[0.01em]"
									style={{
										color: trackInfoColor,
										fontSize: screenTokens.metaFontSize,
									}}
								>
									<EditableTrackNumber
										disabled={
											!isEditable
										}
										totalTracks={
											state.totalTracks
										}
										trackNumber={
											state.trackNumber
										}
										onTotalTracksChange={(
											num,
										) =>
											dispatch({
												type: "UPDATE_TOTAL_TRACKS",
												payload: num,
											})
										}
										onTrackNumberChange={(
											num,
										) =>
											dispatch({
												type: "UPDATE_TRACK_NUMBER",
												payload: num,
											})
										}
									/>
								</div>
							</div>
						</div>

						<div
							className="absolute left-0 right-0"
							data-export-duration={state.duration}
							data-testid="screen-progress"
							style={{
								bottom: screenTokens.progressBottom,
								height: screenTokens.progressHeight,
								paddingInline:
									screenTokens.progressPaddingX,
								paddingTop: screenTokens.progressPaddingTop,
								background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,248,246,0.96) 100%)",
							}}
						>
							<ProgressBar
								currentTime={state.currentTime}
								disabled={!isEditable}
								duration={state.duration}
								trackHeight={
									screenTokens.progressHeight >=
									33
										? 6
										: 5
								}
								onSeek={(currentTime) => {
									if (!isEditable) return;
									remainingAnchorRef.current =
										null;
									setCurrentTime(
										currentTime,
										false,
									);
									playClick();
								}}
							/>
							<div
								className="mt-[3px] flex items-center justify-between font-semibold leading-none tracking-[-0.02em] text-black"
								style={{
									fontVariantNumeric:
										"tabular-nums",
									fontFamily: SCREEN_FONT_FAMILY,
									fontSize: Math.max(
										8,
										screenTokens.metaFontSize +
											1,
									),
								}}
							>
								<div
									data-export-time-value={
										state.currentTime
									}
									data-testid="elapsed-time"
								>
									<EditableTime
										disabled={
											!isEditable
										}
										editLabel="Edit elapsed time"
										value={
											state.currentTime
										}
										onChange={(
											time,
										) => {
											if (
												!isEditable
											)
												return;
											setCurrentTime(
												time,
												true,
											);
										}}
									/>
								</div>
								<div
									className="text-black flex items-center gap-[1px]"
									data-testid="remaining-time"
								>
									<EditableTime
										isRemaining
										disabled={
											!isEditable
										}
										editLabel="Edit remaining time"
										value={Math.max(
											state.duration -
												state.currentTime,
											0,
										)}
										onChange={(
											remaining,
										) => {
											if (
												!isEditable
											)
												return;
											setRemainingTime(
												remaining,
											);
										}}
									/>
								</div>
							</div>
						</div>
					</>
				)}

				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={glassOverlay}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute left-[11px] top-[9px] h-[32%] w-[48%] rounded-[18px] opacity-25"
					style={{
						background: "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.024) 18%, rgba(255,255,255,0) 58%)",
					}}
				/>
			</div>
		</div>
	);
}
