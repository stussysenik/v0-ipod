"use client";

import { useCallback, useMemo, useRef } from "react";

import { IpodClickWheel } from "@/components/ipod/controls/ipod-click-wheel";
import { IpodDevice } from "@/components/ipod/device/ipod-device";
import { PortfolioFeedScreen } from "@/components/ipod/portfolio/portfolio-feed-screen";
import { usePortfolioFeed } from "@/components/ipod/portfolio/use-portfolio-feed";
import type { IpodFeed } from "@/lib/feed/schema";
import {
	DEFAULT_HARDWARE_PRESET_ID,
	getIpodClassicPreset,
} from "@/lib/ipod-classic-presets";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";

/**
 * `/portfolio` — the flat 2D real assembly.
 *
 * The same physical atoms `/` and `/3d` ship (`IpodDevice` + `IpodClickWheel`,
 * the factory Noir model), fed portfolio content. Only the device shell differs
 * from `/3d-portfolio`: this composes the real flat device; the 3D route hosts the
 * SAME screen + wheel nodes through `ThreeDIpod`. The case study renders and scrolls
 * on the device screen (faithful iPod) — wheel is the vertical axis, drill-in/back
 * the depth axis — so nothing ever overlays the device cell.
 */
/** Ties the device's `aria-describedby` to the hidden interaction hint below it. */
const HINT_ID = "portfolio-wheel-hint";

export function PortfolioFeedStage({ feed }: { feed: IpodFeed }) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const playClick = useCallback(() => playClickAudio(audioRef), []);

	const { model, state, onKeyDown, wheel } = usePortfolioFeed(feed);

	// The factory model IS the Noir look — one source of truth with `/3d`.
	const presentation = useMemo(() => createInitialIpodWorkbenchModel().presentation, []);
	const preset = useMemo(
		() => getIpodClassicPreset(presentation.hardwarePreset ?? DEFAULT_HARDWARE_PRESET_ID),
		[presentation.hardwarePreset],
	);

	const screen = <PortfolioFeedScreen preset={preset} state={state} model={model} />;
	const wheelNode = (
		<IpodClickWheel
			preset={preset}
			skinColor={presentation.skinColor}
			ringColor={presentation.ringColor || undefined}
			centerColor={presentation.centerColor || undefined}
			stageColor={feed.theme.background ?? presentation.bgColor}
			playClick={playClick}
			onSeek={wheel.onSeek}
			onCenterClick={wheel.onCenterClick}
			onMenuPress={wheel.onMenuPress}
			onPreviousPress={wheel.onPreviousPress}
			onNextPress={wheel.onNextPress}
			onPlayPausePress={wheel.onPlayPausePress}
		/>
	);

	return (
		<div className="flex flex-col items-center">
			{/*
			 * No title card and no instruction strip. The device already titles itself —
			 * `feed.meta.title` is the first thing its own screen renders — so a heading
			 * above it was the same words twice, and a "wheel to scroll" caption is
			 * scaffolding wrapped around a product that has to explain itself. What a
			 * sighted visitor discovers by touching the wheel, an assistive-tech user is
			 * told outright, below.
			 */}
			{/* The device IS the control: it owns the keyboard, the wheel owns the pointer. */}
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the device IS the control */}
			<div
				tabIndex={0}
				role="application"
				aria-label={`${feed.meta.title} — iPod portfolio`}
				aria-describedby={HINT_ID}
				onKeyDown={onKeyDown}
				className="rounded-[2.2rem] outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			>
				<IpodDevice
					preset={preset}
					skinColor={presentation.skinColor}
					screen={screen}
					wheel={wheelNode}
					viewMode="flat"
				/>
			</div>

			<p id={HINT_ID} className="sr-only">
				Spin the click wheel or use the arrow keys to move through the list. Press Enter
				or the center button to open the selected item. Press Escape or the Menu button
				to go back.
			</p>
		</div>
	);
}
