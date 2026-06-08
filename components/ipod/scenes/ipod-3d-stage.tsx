"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { CameraPreviewState, ExportFraming, IpodCameraFocus, ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { recordIpodClip, isClipRecordingSupported } from "@/lib/three-clip-recorder";
import { downloadBlob } from "@/lib/three-export";
import { CAMERA_MOVES, type CameraMove, type StudioPose } from "@/lib/studio-camera";

import { IpodClickWheel } from "../controls/ipod-click-wheel";
import { IpodScreen } from "../display/ipod-screen";
import { useIpodClickWheelControls } from "../hooks/use-ipod-click-wheel-controls";
import { Ipod3DBatteryCockpit } from "./ipod-3d-battery-cockpit";
import { Ipod3DCameraCockpit } from "./ipod-3d-camera-cockpit";
import { Ipod3DColorCockpit } from "./ipod-3d-color-cockpit";
import {
	Ipod3DExportDock,
	type ClipExportOptions,
	type ExportAspect,
	type Ipod3DExportState,
	type StillExportOptions,
} from "./ipod-3d-export-dock";
import { Ipod3DNowPlayingCockpit } from "./ipod-3d-nowplaying-cockpit";
import { Ipod3DStudioShots } from "./ipod-3d-studio-shots";

/** localStorage key for the locked hero perspective (design D13). */
const LOCKED_POSE_KEY = "ipod-3d-locked-pose";

/**
 * Export dimensions per aspect — stills are 2160-wide PNGs, clips are 1080-wide MP4s.
 * The capture/clip framing recomputes camera distance from `width/height`, so any
 * aspect fills the frame without cropping (see frameForCapture/frameForHero).
 */
const ASPECT_DIMS: Record<ExportAspect, { still: [number, number]; clip: [number, number] }> = {
	story: { still: [2160, 3840], clip: [1080, 1920] }, // 9:16
	portrait: { still: [2160, 2700], clip: [1080, 1350] }, // 4:5
	square: { still: [2160, 2160], clip: [1080, 1080] }, // 1:1
};

/** Clip encode settings per quality tier (mirrors the 2D MP4_QUALITY_CONFIG intent). */
const CLIP_QUALITY: Record<
	ClipExportOptions["quality"],
	{ fps: number; bitsPerSecond: number; supersample: number }
> = {
	standard: { fps: 24, bitsPerSecond: 12_000_000, supersample: 1 },
	pro: { fps: 30, bitsPerSecond: 22_000_000, supersample: 1.5 },
};

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
	// Export progress (0–1) for the loading veil; null = indeterminate (stills).
	const [exportProgress, setExportProgress] = useState<number | null>(null);
	// Playhead — the selected move + live transport. `previewT` is the position over
	// the full clip (0–1); the rig reports it back while playing so the scrubber
	// tracks. Clip length is lifted here so the preview cadence matches the export.
	const [durationSec, setDurationSec] = useState(5);
	const [previewMove, setPreviewMove] = useState<CameraMove>(CAMERA_MOVES[0].id);
	const [previewPlaying, setPreviewPlaying] = useState(false);
	const [previewT, setPreviewT] = useState(0);
	// The rig flies the move only when the playhead is "engaged" — playing, or
	// scrubbed off the hero seam. At t=0 paused we hand the camera back so the user
	// can compose freely (phase 0 ≈ the composed hero anyway).
	const previewEngaged = previewPlaying || previewT > 0.0001;
	const preview: CameraPreviewState | null =
		previewEngaged && exportState === "idle"
			? { move: previewMove, playing: previewPlaying, t: previewT, durationSec }
			: null;
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

	// Progress the now-playing clock while the iPod is playing — the on-screen
	// elapsed time + progress bar advance one second per second (wrapping at the
	// track end). So hitting play on the wheel/screen makes the device read as
	// genuinely playing, and that live position is what a still or clip bakes on
	// at capture.
	//
	// The interval reads the latest time from a ref rather than depending on
	// `currentTime`, so it's created ONCE per play session and fires at a true
	// 1s cadence — depending on `currentTime` would tear down and rebuild the
	// timer every tick (and stack under StrictMode), running the clock fast.
	const playbackRef = useRef({
		currentTime: model.metadata.currentTime,
		duration: model.metadata.duration,
	});
	useEffect(() => {
		playbackRef.current.currentTime = model.metadata.currentTime;
		playbackRef.current.duration = model.metadata.duration;
	}, [model.metadata.currentTime, model.metadata.duration]);
	useEffect(() => {
		if (!model.interaction.isPlaying) return;
		const id = window.setInterval(() => {
			const { currentTime, duration } = playbackRef.current;
			dispatch({ type: "UPDATE_CURRENT_TIME", payload: (currentTime + 1) % (duration + 1) });
		}, 1000);
		return () => window.clearInterval(id);
	}, [model.interaction.isPlaying, dispatch]);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const showNotice = useCallback((message: string) => {
		if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
		setNotice(message);
		noticeTimer.current = window.setTimeout(() => setNotice(null), 1800);
	}, []);

	// ── Playhead transport ──
	// The hero the move orbits = the pose composed the instant the playhead first
	// engages this session. Captured synchronously from the live camera (still at
	// the composed angle before the rig starts flying), held for the whole session,
	// and fed to BOTH the preview and the export — so a clip/Hero still always
	// anchors on the angle you composed, even if you export with the scrubber parked
	// mid-move. Cleared when the playhead disengages so the next session re-captures.
	const heroAnchorRef = useRef<StudioPose | null>(null);
	const captureHeroIfNeeded = useCallback(() => {
		if (heroAnchorRef.current === null) {
			heroAnchorRef.current = ipodApiRef.current?.getCameraPose() ?? null;
		}
	}, []);
	const handleTogglePlay = useCallback(() => {
		setPreviewPlaying((p) => {
			if (!p) captureHeroIfNeeded(); // engaging
			return !p;
		});
	}, [captureHeroIfNeeded]);
	const handleScrub = useCallback(
		(t: number) => {
			captureHeroIfNeeded();
			setPreviewPlaying(false); // grabbing the scrubber pauses playback
			setPreviewT(t);
		},
		[captureHeroIfNeeded],
	);
	const handleResetPlayhead = useCallback(() => {
		setPreviewPlaying(false);
		setPreviewT(0); // disengages preview → camera eases back to the composed hero
	}, []);
	// Drop the captured hero whenever the playhead fully disengages, so recomposing
	// freely (drag) then re-engaging anchors on the NEW angle, not a stale one.
	useEffect(() => {
		if (!previewEngaged) heroAnchorRef.current = null;
	}, [previewEngaged]);
	const handlePreviewMoveChange = useCallback((move: CameraMove) => setPreviewMove(move), []);
	// The rig reports the playing head position back so the scrubber tracks it.
	const handlePreviewTick = useCallback((t: number) => setPreviewT(t), []);

	// Yield two frames so React paints the loading veil BEFORE the heavy capture
	// work (snap-to-rest, screen bake, offline render) mutates the live scene —
	// otherwise the user sees those temporary frames flash through.
	const nextPaint = useCallback(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			),
		[],
	);

	const handleExportPng = useCallback(
		async (framing: ExportFraming, options: StillExportOptions) => {
			const api = ipodApiRef.current;
			if (!api || exportState !== "idle") return;
			setPreviewPlaying(false); // hand the camera back to the still framing
			setExportState(`png:${framing}`);
			setExportProgress(null); // stills are quick — indeterminate veil
			await nextPaint(); // let the veil cover before the scene snaps for capture
			try {
				const [w, h] = ASPECT_DIMS[options.aspect].still;
				// Hero still anchors on the composed hero (held by the playhead) so a
				// parked scrubber can't tilt the shot; Front ignores it.
				const blob = await api.captureHighRes(w, h, framing, heroAnchorRef.current);
				if (!blob) throw new Error("capture returned no image");
				downloadBlob(blob, `ipod-3d-${framing}-${options.aspect}-${Date.now()}.png`);
				showNotice(framing === "hero" ? "Saved Hero PNG" : "Saved Front PNG");
			} catch (error) {
				console.error("[3d-export] png failed", error);
				showNotice("Export failed");
			} finally {
				setExportState("idle");
				setExportProgress(null);
			}
		},
		[exportState, showNotice, nextPaint],
	);

	const handleExportClip = useCallback(
		async (move: CameraMove, options: ClipExportOptions) => {
			const api = ipodApiRef.current;
			if (!api || exportState !== "idle") return;
			if (!isClipRecordingSupported()) {
				showNotice("Clips need Chrome/Edge");
				return;
			}
			setPreviewPlaying(false); // freeze the playhead; the offline render owns the camera
			setExportState(`clip:${move}`);
			setExportProgress(0);
			await nextPaint(); // veil covers before snap-to-rest / screen bake / offline frames
			try {
				// Anchor the move on the composed hero held by the playhead (so a parked
				// scrubber can't shift it); fall back to the live pose when disengaged.
				const anchor = heroAnchorRef.current ?? api.getCameraPose() ?? undefined;
				const [width, height] = ASPECT_DIMS[options.aspect].clip;
				const q = CLIP_QUALITY[options.quality];
				const blob = await recordIpodClip(api, {
					durationMs: Math.round(options.durationSec * 1000),
					fps: q.fps,
					bitsPerSecond: q.bitsPerSecond,
					supersample: q.supersample,
					width,
					height,
					move,
					anchor,
					onProgress: (encoded, total) => {
						setExportProgress(encoded / total);
					},
				});
				if (!blob) throw new Error("recorder returned no clip");
				downloadBlob(blob, `ipod-3d-${move}-${options.aspect}-${options.durationSec}s-${Date.now()}.mp4`);
				showNotice("Saved MP4");
			} catch (error) {
				console.error("[3d-export] clip failed", error);
				showNotice("Clip failed");
			} finally {
				setExportState("idle");
				setExportProgress(null);
			}
		},
		[exportState, showNotice, nextPaint],
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
				preview={preview}
				onPreviewTick={handlePreviewTick}
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
				<div className="flex flex-col gap-3 lg:pointer-events-none lg:absolute lg:left-4 lg:top-16 lg:z-10 lg:max-h-[calc(100dvh-5rem)] lg:w-[262px] lg:overflow-y-auto">
					<Ipod3DNowPlayingCockpit metadata={model.metadata} dispatch={dispatch} />
					<Ipod3DColorCockpit presentation={presentation} dispatch={dispatch} />
					<Ipod3DCameraCockpit apiRef={ipodApiRef} locked={cameraLocked} onToggleLock={toggleCameraLock} />
				</div>

				{/* Right group — battery + export */}
				<div className="flex flex-col gap-3 lg:pointer-events-none lg:absolute lg:right-4 lg:top-16 lg:z-10 lg:max-h-[calc(100dvh-5rem)] lg:w-[262px] lg:overflow-y-auto lg:pb-4">
					<Ipod3DBatteryCockpit
						batteryLevel={interaction.batteryLevel}
						batteryMode={interaction.batteryMode}
						dispatch={dispatch}
					/>
					<Ipod3DExportDock
						exportState={exportState}
						durationSec={durationSec}
						onDurationChange={setDurationSec}
						previewMove={previewMove}
						previewPlaying={previewPlaying}
						previewT={previewT}
						onPreviewMoveChange={handlePreviewMoveChange}
						onTogglePlay={handleTogglePlay}
						onScrub={handleScrub}
						onResetPlayhead={handleResetPlayhead}
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

			{/* Export veil — covers the canvas the instant a render starts, so the
			    snap-to-rest, screen bake, and offline frames are never seen. A frosted
			    sweep over the live Stage colour with a calm progress bar; lifts the
			    moment the file is ready. */}
			{exportState !== "idle" && (
				<div
					className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 backdrop-blur-xl transition-opacity duration-200"
					style={{ backgroundColor: `${presentation.bgColor}D9` }}
				>
					<div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/55">
						{exportState.startsWith("clip:") ? "Rendering clip" : "Capturing still"}
					</div>
					<div className="h-1 w-48 overflow-hidden rounded-full bg-black/10">
						{exportProgress === null ? (
							<div className="h-full w-1/3 animate-[veilSlide_1.1s_ease-in-out_infinite] rounded-full bg-black/55" />
						) : (
							<div
								className="h-full rounded-full bg-black/70 transition-[width] duration-150 ease-out"
								style={{ width: `${Math.round(exportProgress * 100)}%` }}
							/>
						)}
					</div>
					<div className="font-mono text-[11px] tabular-nums text-black/45">
						{exportProgress === null ? "Compositing…" : `${Math.round(exportProgress * 100)}%`}
					</div>
					<style>{`@keyframes veilSlide{0%{transform:translateX(-120%)}100%{transform:translateX(420%)}}`}</style>
				</div>
			)}

			{/* Transient notice */}
			{notice && (
				<div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
					{notice}
				</div>
			)}
		</div>
	);
}
