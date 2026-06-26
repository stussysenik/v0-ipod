"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { IpodClickWheel } from "@/components/ipod/controls/ipod-click-wheel";
import { PortfolioFeedScreen } from "@/components/ipod/portfolio/portfolio-feed-screen";
import { usePortfolioFeed } from "@/components/ipod/portfolio/use-portfolio-feed";
import type { IpodFeed } from "@/lib/feed/schema";
import {
	DEFAULT_HARDWARE_PRESET_ID,
	getIpodClassicPreset,
} from "@/lib/ipod-classic-presets";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";

const ThreeDIpod = dynamic(
	() => import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
	{
		ssr: false,
		loading: () => (
			<div className="absolute inset-0 grid place-items-center text-xs font-medium uppercase tracking-[0.2em] text-white/60">
				Assembling…
			</div>
		),
	},
);

/**
 * `/3d-portfolio` — the 3D real assembly.
 *
 * The canonical Noir device (black 2008 Classic, Designer Dark rig, the #0048FF stage
 * `/3d` boots) hosting the SAME feed-driven screen + wheel nodes as `/portfolio`. Only
 * the device shell differs: here the real screen + click wheel are layered onto the
 * rendered `ThreeDIpod` geometry. Data is the canonical feed via `usePortfolioFeed`
 * (one source of truth with `/portfolio` and `/whitelabel`) — not a bespoke OS.
 *
 * Mobile-first: on coarse-pointer devices the camera boots LOCKED so a thumb circling
 * the wheel can never knock the composed hero angle — orbit is an explicit opt-in.
 */
export function IpodPortfolioStage({ feed }: { feed: IpodFeed }) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const playClick = useCallback(() => playClickAudio(audioRef), []);

	const { model, state, onKeyDown, wheel } = usePortfolioFeed(feed);

	// The factory model IS the Noir look — one source of truth with `/3d`.
	const initialModel = useMemo(() => createInitialIpodWorkbenchModel(), []);
	const presentation = initialModel.presentation;
	const lighting = initialModel.studio.lighting;
	const preset = useMemo(
		() => getIpodClassicPreset(presentation.hardwarePreset ?? DEFAULT_HARDWARE_PRESET_ID),
		[presentation.hardwarePreset],
	);

	// Camera lock: SSR renders locked (deterministic), then fine pointers (mouse)
	// unlock on mount — desktop drag-to-orbit stays a feature, touch stays safe.
	const [orbitEnabled, setOrbitEnabled] = useState(false);
	useEffect(() => {
		if (window.matchMedia("(pointer: fine)").matches) setOrbitEnabled(true);
	}, []);

	const screenComponent = <PortfolioFeedScreen preset={preset} state={state} model={model} />;

	const wheelComponent = (
		<IpodClickWheel
			chromeless
			preset={preset}
			skinColor={presentation.skinColor}
			ringColor={presentation.ringColor || undefined}
			centerColor={presentation.centerColor || undefined}
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
		// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the stage IS the control surface
		<div
			tabIndex={0}
			role="application"
			aria-label={`${feed.meta.title} — 3D iPod portfolio`}
			onKeyDown={onKeyDown}
			className="relative h-dvh w-full touch-none select-none overflow-hidden overscroll-none outline-none"
			style={{ backgroundColor: feed.theme.background ?? presentation.bgColor }}
		>
			{/* Identity Signature Background — large, clean watermark behind the device */}
			<div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
				<div className="text-[18vw] font-black uppercase tracking-[-0.05em] text-white/[0.04] leading-none select-none">
					{feed.meta.title}
				</div>
			</div>

			<div className="relative z-10 h-full w-full">
				<ThreeDIpod
					preset={preset}
					capacityLabel={preset.capacityLabel}
					skinColor={presentation.skinColor}
					ringColor={presentation.ringColor || undefined}
					centerColor={presentation.centerColor || undefined}
					backColor={presentation.backColor}
					edgeColor={presentation.edgeColor}
					bezelColor={presentation.bezelColor}
					captureBackground={feed.theme.background ?? presentation.bgColor}
					lighting={lighting}
					cameraLocked={!orbitEnabled}
					screen={screenComponent}
					wheel={wheelComponent}
					stageClassName="bg-transparent"
				/>
			</div>

			{/* Identity — top-left, inked for the stage */}
			<div className="pointer-events-none absolute left-6 top-6 z-20 pt-[env(safe-area-inset-top)]">
				<div className="text-[12px] font-bold uppercase tracking-[0.3em] text-white">
					{feed.meta.title}
				</div>
				{feed.meta.author ? (
					<div className="text-[13px] font-medium text-white/75">{feed.meta.author}</div>
				) : null}
			</div>

			{/* Orbit lock — locked = the wheel owns every gesture; unlocked = drag to orbit. */}
			<button
				type="button"
				onClick={() => setOrbitEnabled((v) => !v)}
				aria-pressed={orbitEnabled}
				className="absolute right-6 top-6 z-20 mt-[env(safe-area-inset-top)] rounded-full border border-white/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 transition-all hover:border-white/50 hover:bg-white/5 hover:text-white active:scale-95"
			>
				{orbitEnabled ? "Orbit · On" : "Hold · Locked"}
			</button>

			{/* Hint — bottom-left */}
			<div className="pointer-events-none absolute bottom-6 left-6 z-20 pb-[env(safe-area-inset-bottom)] text-[11px] font-semibold tracking-wide text-white/50 uppercase">
				Wheel to scroll · Center to select · Menu to go back
			</div>
		</div>
	);
}
