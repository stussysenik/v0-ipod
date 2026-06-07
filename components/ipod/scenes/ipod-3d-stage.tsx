"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { ExportFraming, IpodCameraFocus, ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { recordIpodClip, isClipRecordingSupported } from "@/lib/three-clip-recorder";
import { downloadBlob } from "@/lib/three-export";
import type { CameraMove, StudioPose } from "@/lib/studio-camera";

import { IpodClickWheel } from "../controls/ipod-click-wheel";
import { IpodScreen } from "../display/ipod-screen";
import { useIpodClickWheelControls } from "../hooks/use-ipod-click-wheel-controls";
import { Ipod3DBatteryCockpit } from "./ipod-3d-battery-cockpit";
import { Ipod3DCameraCockpit } from "./ipod-3d-camera-cockpit";
import { Ipod3DColorCockpit } from "./ipod-3d-color-cockpit";
import { Ipod3DExportDock, type Ipod3DExportState } from "./ipod-3d-export-dock";
import { Ipod3DStudioShots } from "./ipod-3d-studio-shots";

/** localStorage key for the locked hero perspective (design D13). */
const LOCKED_POSE_KEY = "ipod-3d-locked-pose";

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
	const ipodApiRef = useRef<ThreeDIpodHandle | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const noticeTimer = useRef<number | null>(null);
	const [exportState, setExportState] = useState<Ipod3DExportState>("idle");
	// Mobile control drawer. Desktop ignores this (the panels float at the corners);
	// on narrow viewports the controls collapse into a bottom sheet so they never
	// overlap the device.
	const [controlsOpen, setControlsOpen] = useState(false);
	// Camera orientation (Product / Front / Back) — owned here so the bottom bar can
	// place the snaps alongside the saved studio shots.
	const [focus, setFocus] = useState<IpodCameraFocus>("product");
	// Lockable perspective (design D13): when locked, the orbit rig ignores drag/wheel
	// so the composed angle can't be knocked off, the pose persists across reloads, and
	// it's the angle every Hero/clip export flies. Owned here so it reaches both the
	// rig (via ThreeDIpod) and the cockpit toggle.
	const [cameraLocked, setCameraLocked] = useState(false);
	const lockedPoseRef = useRef<StudioPose | null>(null);

	// Hydrate the locked pose once; re-apply it to the rig as soon as the canvas mounts.
	useEffect(() => {
		try {
			const raw = localStorage.getItem(LOCKED_POSE_KEY);
			if (raw) {
				lockedPoseRef.current = JSON.parse(raw) as StudioPose;
				setCameraLocked(true);
			}
		} catch {
			// ignore malformed storage
		}
	}, []);

	// next/dynamic mounts the canvas async, so poll briefly until the api is live, then
	// ease the rig to the locked pose. Runs whenever the lock turns on with a stored pose.
	useEffect(() => {
		const target = cameraLocked ? lockedPoseRef.current : null;
		if (!target) return;
		let tries = 0;
		const id = window.setInterval(() => {
			const api = ipodApiRef.current;
			// Wait for the ORBIT RIG to register (getCameraPose non-null), not just the
			// handle — setCameraGoal no-ops until the rig owns the camera, so setting it
			// the instant the handle mounts silently misses and the default pose wins.
			if (api && api.getCameraPose()) {
				api.setCameraGoal({ azimuth: target.azimuth, elevation: target.elevation, reach: target.reach });
				window.clearInterval(id);
			} else if (++tries > 80) {
				window.clearInterval(id);
			}
		}, 100);
		return () => window.clearInterval(id);
	}, [cameraLocked]);

	const toggleCameraLock = useCallback(() => {
		setCameraLocked((prev) => {
			const next = !prev;
			if (next) {
				const pose = ipodApiRef.current?.getCameraPose() ?? null;
				lockedPoseRef.current = pose;
				try {
					if (pose) localStorage.setItem(LOCKED_POSE_KEY, JSON.stringify(pose));
				} catch {
					// ignore quota / private-mode failures
				}
			} else {
				lockedPoseRef.current = null;
				try {
					localStorage.removeItem(LOCKED_POSE_KEY);
				} catch {
					// ignore
				}
			}
			return next;
		});
	}, []);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const showNotice = useCallback((message: string) => {
		if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
		setNotice(message);
		noticeTimer.current = window.setTimeout(() => setNotice(null), 1800);
	}, []);

	const handleExportPng = useCallback(async (framing: ExportFraming) => {
		const api = ipodApiRef.current;
		if (!api || exportState !== "idle") return;
		setExportState(`png:${framing}`);
		try {
			const blob = await api.captureHighRes(2160, 3840, framing);
			if (!blob) throw new Error("capture returned no image");
			downloadBlob(blob, `ipod-3d-${framing}-${Date.now()}.png`);
			showNotice(framing === "hero" ? "Saved Hero PNG" : "Saved Front PNG");
		} catch (error) {
			console.error("[3d-export] png failed", error);
			showNotice("Export failed");
		} finally {
			setExportState("idle");
		}
	}, [exportState, showNotice]);

	const handleExportClip = useCallback(
		async (move: CameraMove) => {
			const api = ipodApiRef.current;
			if (!api || exportState !== "idle") return;
			if (!isClipRecordingSupported()) {
				showNotice("Clips need Chrome/Edge");
				return;
			}
			setExportState(`clip:${move}`);
			try {
				// Anchor the move on whatever pose is composed in the camera cockpit.
				const anchor = api.getCameraPose() ?? undefined;
				const blob = await recordIpodClip(api, {
					durationMs: 5000,
					move,
					anchor,
					onProgress: (encoded, total) => {
						showNotice(`Rendering ${Math.round((encoded / total) * 100)}%`);
					},
				});
				if (!blob) throw new Error("recorder returned no clip");
				downloadBlob(blob, `ipod-3d-${move}-${Date.now()}.mp4`);
				showNotice("Saved MP4");
			} catch (error) {
				console.error("[3d-export] clip failed", error);
				showNotice("Clip failed");
			} finally {
				setExportState("idle");
			}
		},
		[exportState, showNotice],
	);

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
			isEditable
		/>
	);

	const wheelComponent = (
		<IpodClickWheel
			chromeless
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
		<div
			className="relative h-dvh w-full overflow-hidden transition-colors duration-500"
			style={{ backgroundColor: presentation.bgColor }}
		>
			<ThreeDIpod
				apiRef={ipodApiRef}
				preset={activePreset}
				capacityLabel={activePreset.capacityLabel}
				focus={focus}
				onFocusChange={setFocus}
				cameraLocked={cameraLocked}
				skinColor={presentation.skinColor}
				ringColor={presentation.ringColor || undefined}
				centerColor={presentation.centerColor || undefined}
				backColor={presentation.backColor}
				bezelColor={presentation.bezelColor}
				captureBackground={presentation.bgColor}
				screen={screenComponent}
				wheel={wheelComponent}
				stageClassName="bg-transparent"
			/>

			{/* Title — always pinned top-left, non-interactive, compact */}
			<div className="pointer-events-none absolute left-4 top-4 z-30 text-left">
				<div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
					iPod · Now Playing
				</div>
				<div className="text-[11px] font-medium text-black/60">{activePreset.label} · {activePreset.capacityLabel}</div>
			</div>

			{/* Mobile-only drawer toggle. Hidden on lg where panels float at the corners. */}
			<button
				type="button"
				onClick={() => setControlsOpen((o) => !o)}
				className="pointer-events-auto fixed bottom-4 right-4 z-40 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70 shadow-sm backdrop-blur-md transition-colors hover:text-black lg:hidden"
				aria-expanded={controlsOpen}
			>
				{controlsOpen ? "Close" : "Controls"}
			</button>

			{/*
			 * Responsive control surface — one DOM tree, two layouts.
			 *   • < lg: a bottom sheet (this wrapper IS the drawer); children stack and scroll.
			 *   • ≥ lg: `lg:contents` dissolves the wrapper so the two groups position
			 *     themselves absolutely at the screen corners as a floating HUD.
			 */}
			<div
				className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[62dvh] w-full max-w-md transform flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-2xl border-t border-black/10 bg-white/85 p-4 pb-20 backdrop-blur-md transition-transform duration-300 lg:contents ${
					controlsOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
				}`}
			>
				{/* Left group — color + camera */}
				<div className="flex flex-col gap-3 lg:pointer-events-none lg:absolute lg:left-4 lg:top-16 lg:z-10 lg:max-h-[calc(100dvh-5rem)] lg:w-[230px] lg:overflow-y-auto">
					<Ipod3DColorCockpit presentation={presentation} dispatch={dispatch} />
					<Ipod3DCameraCockpit apiRef={ipodApiRef} locked={cameraLocked} onToggleLock={toggleCameraLock} />
				</div>

				{/* Right group — battery + export */}
				<div className="flex flex-col gap-3 lg:absolute lg:right-4 lg:top-16 lg:z-10 lg:w-[230px]">
					<Ipod3DBatteryCockpit
						batteryLevel={interaction.batteryLevel}
						batteryMode={interaction.batteryMode}
						dispatch={dispatch}
					/>
					<Ipod3DExportDock
						exportState={exportState}
						onExportPng={handleExportPng}
						onExportClip={handleExportClip}
					/>
				</div>
			</div>

			{/* Bottom bar — orientation snaps + saved studio shots (angle + finish) */}
			<Ipod3DStudioShots
				apiRef={ipodApiRef}
				focus={focus}
				onFocus={setFocus}
				presentation={presentation}
				dispatch={dispatch}
				onNotice={showNotice}
			/>

			{/* Transient notice */}
			{notice && (
				<div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
					{notice}
				</div>
			)}
		</div>
	);
}
