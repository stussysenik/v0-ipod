"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";

import { IpodClickWheel } from "@/components/ipod/controls/ipod-click-wheel";
import { PortfolioScreen } from "@/components/ipod/portfolio/portfolio-screen";
import {
	DEFAULT_HARDWARE_PRESET_ID,
	getIpodClassicPreset,
} from "@/lib/ipod-classic-presets";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { profile } from "@/lib/portfolio/data";
import { usePortfolioOs } from "@/lib/portfolio/os";

const ThreeDIpod = dynamic(
	() => import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
	{
		ssr: false,
		loading: () => (
			<div className="absolute inset-0 grid place-items-center bg-white text-xs font-medium uppercase tracking-[0.2em] text-black/40">
				Assembling…
			</div>
		),
	},
);

/**
 * Portfolio stage — the experimental `/portfolio` experience.
 *
 * It reuses the CNC-accurate 3D iPod (white studio sweep) but swaps the music
 * OS for the portfolio OS: the click wheel drives `usePortfolioOs`, and the
 * live display renders `PortfolioScreen`. The workbench and `/3d` are untouched
 * — this is a parallel composition over the same hardware.
 */
export function IpodPortfolioStage() {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const openUrl = useCallback((url: string) => {
		window.open(url, "_blank", "noopener,noreferrer");
	}, []);

	const os = usePortfolioOs(openUrl);

	// Visual defaults shared with /3d for a consistent black-on-white render.
	const presentation = useMemo(
		() => createInitialIpodWorkbenchModel().presentation,
		[],
	);
	const preset = useMemo(
		() => getIpodClassicPreset(presentation.hardwarePreset ?? DEFAULT_HARDWARE_PRESET_ID),
		[presentation.hardwarePreset],
	);

	const screenComponent = (
		<PortfolioScreen preset={preset} frame={os.frame} rows={os.rows} />
	);

	const wheelComponent = (
		<IpodClickWheel
			chromeless
			preset={preset}
			skinColor={presentation.skinColor}
			ringColor={presentation.ringColor || undefined}
			centerColor={presentation.centerColor || undefined}
			playClick={playClick}
			onSeek={(direction) => {
				os.seek(direction);
			}}
			onCenterClick={os.select}
			onMenuPress={os.back}
			onPreviousPress={() => os.step(-1)}
			onNextPress={() => os.step(1)}
			onPlayPausePress={os.select}
		/>
	);

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-white">
			<ThreeDIpod
				preset={preset}
				skinColor={presentation.skinColor}
				ringColor={presentation.ringColor || undefined}
				centerColor={presentation.centerColor || undefined}
				screen={screenComponent}
				wheel={wheelComponent}
				stageClassName="bg-white"
			/>

			{/* Identity — top-right, dark for the white stage */}
			<div className="pointer-events-none absolute right-4 top-4 z-10 text-right">
				<div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
					{profile.handle}
				</div>
				<div className="text-[11px] font-medium text-black/60">{profile.role}</div>
			</div>

			{/* Hint — bottom-left */}
			<div className="pointer-events-none absolute bottom-4 left-4 z-10 text-[10px] font-medium text-black/35">
				Wheel to scroll · Center to select · Menu to go back
			</div>
		</div>
	);
}
