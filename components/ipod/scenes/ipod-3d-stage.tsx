"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";

import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import {
	getIpodClassicPreset,
	IPOD_CLASSIC_PRESETS,
} from "@/lib/ipod-classic-presets";

import { IpodClickWheel } from "../controls/ipod-click-wheel";
import { IpodScreen } from "../display/ipod-screen";
import { useIpodClickWheelControls } from "../hooks/use-ipod-click-wheel-controls";

const ThreeDIpod = dynamic(
	() => import("@/components/three/three-d-ipod").then((m) => ({ default: m.ThreeDIpod })),
	{
		ssr: false,
		loading: () => (
			<div className="absolute inset-0 grid place-items-center bg-black text-xs font-medium uppercase tracking-[0.2em] text-white/40">
				Assembling…
			</div>
		),
	},
);

// A small swatch set to feel out the product in different finishes.
const SHELL_SWATCHES = ["#1b1818", "#E8E8E8", "#b22234", "#1d4e89", "#d4af37"];

/**
 * Focused 3D stage — an isolated surface for dialing in the product render.
 *
 * It owns a minimal iPod reducer and drives the click wheel through the shared
 * controller, so the live screen and wheel behave exactly as they do in the
 * authoring workbench, just without the export/authoring chrome.
 */
export function Ipod3DStage() {
	const [model, dispatch] = useReducer(
		ipodWorkbenchReducer,
		undefined,
		createInitialIpodWorkbenchModel,
	);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const noticeTimer = useRef<number | null>(null);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const showNotice = useCallback((message: string) => {
		if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
		setNotice(message);
		noticeTimer.current = window.setTimeout(() => setNotice(null), 1800);
	}, []);

	const controls = useIpodClickWheelControls({
		model,
		dispatch,
		playClick,
		onOpenSettings: () => showNotice("Settings live in the workbench"),
		onNotice: showNotice,
	});

	const { presentation, interaction } = model;
	const activePreset = useMemo(
		() => getIpodClassicPreset(presentation.hardwarePreset),
		[presentation.hardwarePreset],
	);

	const screenComponent = (
		<IpodScreen
			preset={activePreset}
			skinColor={presentation.skinColor}
			state={model.metadata}
			dispatch={dispatch}
			playClick={playClick}
			interactionModel={interaction.interactionModel}
			osScreen={interaction.osScreen}
			osMenuItems={controls.menuItems}
			osMenuIndex={interaction.menuIndex}
			batteryLevel={interaction.batteryLevel}
			isEditable={false}
		/>
	);

	const wheelComponent = (
		<IpodClickWheel
			preset={activePreset}
			skinColor={presentation.skinColor}
			ringColor={presentation.ringColor || undefined}
			centerColor={presentation.centerColor || undefined}
			playClick={playClick}
			onSeek={controls.handleWheelSeek}
			onCenterClick={
				interaction.osScreen === "menu"
					? controls.handleOsMenuSelect
					: controls.handlePlayPauseButtonPress
			}
			onMenuPress={controls.handleMenuButtonPress}
			onPreviousPress={controls.handlePreviousButtonPress}
			onNextPress={controls.handleNextButtonPress}
			onPlayPausePress={controls.handlePlayPauseButtonPress}
		/>
	);

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-black">
			<ThreeDIpod
				preset={activePreset}
				skinColor={presentation.skinColor}
				ringColor={presentation.ringColor || undefined}
				centerColor={presentation.centerColor || undefined}
				screen={screenComponent}
				wheel={wheelComponent}
			/>

			{/* Hardware / finish controls — top-left, deliberately minimal */}
			<div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-3">
				<div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
					<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
						Hardware
					</span>
					<div className="flex gap-1">
						{IPOD_CLASSIC_PRESETS.map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => dispatch({ type: "SET_HARDWARE_PRESET", payload: p.id })}
								className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
									presentation.hardwarePreset === p.id
										? "bg-white/16 text-white"
										: "text-white/50 hover:text-white/85"
								}`}
							>
								{p.shortLabel}
							</button>
						))}
					</div>
					<span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
						Finish
					</span>
					<div className="flex gap-1.5">
						{SHELL_SWATCHES.map((c) => (
							<button
								key={c}
								type="button"
								aria-label={`Set shell color ${c}`}
								onClick={() => dispatch({ type: "SET_SKIN_COLOR", payload: c })}
								className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
									presentation.skinColor.toLowerCase() === c.toLowerCase()
										? "border-white/80"
										: "border-white/15"
								}`}
								style={{ backgroundColor: c }}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Title */}
			<div className="pointer-events-none absolute right-4 top-4 z-10 text-right">
				<div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
					iPod · 3D Focus
				</div>
				<div className="text-[11px] font-medium text-white/55">
					{activePreset.label}
				</div>
			</div>

			{/* Transient notice */}
			{notice && (
				<div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
					{notice}
				</div>
			)}
		</div>
	);
}
