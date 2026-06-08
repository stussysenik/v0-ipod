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
import { loadWorkbenchModel, saveWorkbenchModel } from "@/lib/ipod-state/storage";
import { getExportHistory, saveExportToHistory, type ExportRecord } from "@/lib/pocketbase";
import { CAMERA_MOVES, type CameraMove, type LoopStyle, type StudioPose } from "@/lib/studio-camera";

import { IpodClickWheel } from "../controls/ipod-click-wheel";
import { IpodScreen } from "../display/ipod-screen";
import { useIpodClickWheelControls } from "../hooks/use-ipod-click-wheel-controls";
import { Ipod3DBatteryCockpit } from "./ipod-3d-battery-cockpit";
import { Ipod3DCameraCockpit } from "./ipod-3d-camera-cockpit";
import { Ipod3DColorCockpit } from "./ipod-3d-color-cockpit";
import { Ipod3DLightingCockpit } from "./ipod-3d-lighting-cockpit";
import { Ipod3DStudioCockpit } from "./ipod-3d-studio-cockpit";
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
		() => loadWorkbenchModel() ?? createInitialIpodWorkbenchModel(),
	);

	// Persist the hard-earned user state on every change.
	useEffect(() => {
		saveWorkbenchModel(model);
	}, [model]);

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
	// Motion shaping — cadence multiplier + time map (loop / boomerang / hold). Lifted
	// here so the live preview and the export read the SAME values (WYSIWYG parity).
	const [speed, setSpeed] = useState(1);
	const [loopStyle, setLoopStyle] = useState<LoopStyle>("loop");
	// The rig flies the move only when the playhead is "engaged" — playing, or
	// scrubbed off the hero seam. At t=0 paused we hand the camera back so the user
	// can compose freely (phase 0 ≈ the composed hero anyway).
	const previewEngaged = previewPlaying || previewT > 0.0001;
	const preview: CameraPreviewState | null =
		previewEngaged && exportState === "idle"
			? { move: previewMove, playing: previewPlaying, t: previewT, durationSec, speed, loop: loopStyle }
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

	// Export history from PocketBase.
	const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

	// Hydrate history on mount.
	useEffect(() => {
		getExportHistory().then(setExportHistory).catch(() => {});
	}, []);

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
					speed: options.speed,
					loop: options.loop,
					anchor,
					onProgress: (encoded, total) => {
						setExportProgress(encoded / total);
					},
				});
				if (!blob) throw new Error("recorder returned no clip");
				// Name by the motion that actually played — "hold" for a motion-free angle,
				const motionTag =
					options.loop === "hold" ? "hold" : options.loop === "boomerang" ? `${move}-boomerang` : move;
				const filename = `ipod-3d-${motionTag}-${options.aspect}-${options.durationSec}s-${Date.now()}.mp4`;

				downloadBlob(blob, filename);

				// Persist to PocketBase history.
				saveExportToHistory(blob, filename, {
					title: model.metadata.title,
					move: motionTag,
					aspect: options.aspect,
					duration: options.durationSec,
				}).then((record) => {
					if (record) setExportHistory((prev) => [record, ...prev].slice(0, 10));
				});

				showNotice("Saved MP4");
			} catch (error) {
				console.error("[3d-export] clip failed", error);
				showNotice("Clip failed");
			} finally {
				setExportState("idle");
				setExportProgress(null);
			}
		},
		[exportState, showNotice, nextPaint, model.metadata.title],
	);

	const controls = useIpodClickWheelControls({
		model,
		dispatch,
		playClick,
		onOpenSettings: () => showNotice("Settings live in the workbench"),
		onNotice: showNotice,
	});

	const { presentation, interaction, studio } = model;
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
			// Marquee revival: drive the scrolling-text engine live in the 3D view. Passing
			// `animateText` makes EditableText set both `animate` + `preview`, so an overflowing
			// title/artist/album scrolls on the device exactly as it does on a real iPod — this
			// is what "wasn't brought over" into /3d. Off → text stays static (and truncates).
			animateText={studio.marquee}
			// Presentation lock: freeze inline editing into a clean, screenshot-ready state.
			isEditable={!studio.interactionLocked}
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
			{/* Shell Header — a high-performance navigation bar that bounds the experience.
			    It holds the product identity and the primary menu toggle, ensuring the flow
			    is consistent across mobile and desktop. */}
			<header className="absolute inset-x-0 top-0 z-[60] flex h-16 items-center justify-between px-6 pointer-events-none">
				<div className="flex flex-col">
					<div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 leading-none">
						iPod · Now Playing
					</div>
					<div className="mt-1 text-[11px] font-medium text-black/55 tabular-nums">
						{activePreset.label} · {activePreset.capacityLabel}
					</div>
				</div>

				<nav className="shell-nav flex items-center gap-4 pointer-events-auto">
					{/* Shell Nav Button — a high-performance anchor for the creation flow. */}
					<span>
						<button
							type="button"
							onClick={() => setControlsOpen((o) => !o)}
							className={`group relative flex h-10 items-center gap-3 rounded-full border px-4 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) active:scale-[0.94] ${
								controlsOpen 
									? "border-black/20 bg-black text-white shadow-2xl" 
									: "border-black/10 bg-white/70 text-black/80 backdrop-blur-xl hover:border-black/30 hover:bg-white/90"
							}`}
							aria-expanded={controlsOpen}
						>
							<span className="text-[10px] font-black uppercase tracking-[0.2em]">
								{controlsOpen ? "Close" : "Menu"}
							</span>
							<div className="relative flex h-3 w-4 flex-col justify-between overflow-hidden">
								<span className={`h-[1.5px] w-full rounded-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${controlsOpen ? "bg-white rotate-45 translate-y-[5.25px]" : "bg-current"}`} />
								<span className={`h-[1.5px] w-full rounded-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${controlsOpen ? "translate-x-6 opacity-0" : "bg-current"}`} />
								<span className={`h-[1.5px] w-full rounded-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${controlsOpen ? "bg-white -rotate-45 -translate-y-[5.25px]" : "bg-current"}`} />
							</div>
						</button>
					</span>
				</nav>
			</header>

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
				lighting={studio.lighting}
				technicalFlat={studio.technicalFlat}
				screen={screenComponent}
				wheel={wheelComponent}
				stageClassName="bg-transparent"
			/>

			{/* Responsive control surface — one DOM tree, two layouts. */}
			<div
				className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[75dvh] w-full max-w-md transform flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-[32px] border-t border-black/10 bg-white/90 p-5 pb-12 backdrop-blur-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:contents ${
					controlsOpen ? "translate-y-0 shadow-[0_-20px_80px_-10px_rgba(0,0,0,0.15)]" : "translate-y-full lg:translate-y-0"
				}`}
			>
				{/* Left group — interaction + now-playing + colour + camera */}
				<div className="flex flex-col gap-4 lg:pointer-events-none lg:absolute lg:left-6 lg:top-24 lg:z-10 lg:max-h-[calc(100dvh-8rem)] lg:w-[280px] lg:overflow-y-auto lg:pb-8">
					<Ipod3DStudioCockpit interaction={interaction} studio={studio} dispatch={dispatch} />
					<Ipod3DNowPlayingCockpit metadata={model.metadata} dispatch={dispatch} />
					<Ipod3DColorCockpit presentation={presentation} dispatch={dispatch} />
					<Ipod3DCameraCockpit apiRef={ipodApiRef} locked={cameraLocked} onToggleLock={toggleCameraLock} />
				</div>

				{/* Right group — light + battery + export */}
				<div className="flex flex-col gap-4 lg:pointer-events-none lg:absolute lg:right-6 lg:top-24 lg:z-10 lg:max-h-[calc(100dvh-8rem)] lg:w-[280px] lg:overflow-y-auto lg:pb-8">
					<Ipod3DLightingCockpit studio={studio} dispatch={dispatch} />
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
						speed={speed}
						onSpeedChange={setSpeed}
						loopStyle={loopStyle}
						onLoopStyleChange={setLoopStyle}
						onPreviewMoveChange={handlePreviewMoveChange}
						onTogglePlay={handleTogglePlay}
						onScrub={handleScrub}
						onResetPlayhead={handleResetPlayhead}
						onExportPng={handleExportPng}
						onExportClip={handleExportClip}
						history={exportHistory}
					/>
				</div>
			</div>

			{/* Bottom bar — orientation snaps + saved studio shots */}
			<Ipod3DStudioShots
				apiRef={ipodApiRef}
				focus={focus}
				onFocus={setFocus}
				presentation={presentation}
				dispatch={dispatch}
				onNotice={showNotice}
			/>

			{/* Export veil — a cinematic shutter that covers the canvas for the render.
			    It uses 'shutter' optics: a high-speed blade snap followed by a white
			    optic flash, then settling into a technical encoding state. */}
			{exportState !== "idle" && (
				<div
					className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-8 backdrop-blur-3xl transition-all duration-300 animate-in fade-in"
					style={{ backgroundColor: `${presentation.bgColor}F8` }}
				>
					{/* Optic Flash — eye-physics 'pop' at the instant of capture. */}
					<div className="absolute inset-0 bg-white z-[110] animate-[shutterFlash_0.6s_ease-out_forwards] pointer-events-none" />

					{/* Shutter Blades — ultra-high-speed mechanical snap. */}
					<div className="absolute inset-0 overflow-hidden pointer-events-none z-[105]">
						<div className="absolute top-0 left-0 w-full h-[50%] bg-black animate-[shutterBladeDown_0.6s_cubic-bezier(0.19,1,0.22,1)_forwards]" />
						<div className="absolute bottom-0 left-0 w-full h-[50%] bg-black animate-[shutterBladeUp_0.6s_cubic-bezier(0.19,1,0.22,1)_forwards]" />
					</div>

					<div className="relative z-[120] flex flex-col items-center gap-8 animate-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
						<div className="flex flex-col items-center gap-2">
							<div className="text-[10px] font-black uppercase tracking-[0.45em] text-black/80">
								{exportState.startsWith("clip:") ? "Cinematic Render" : "Optic Capture"}
							</div>
							<div className="h-[2px] w-12 bg-black/30" />
						</div>
						
						<div className="flex flex-col items-center gap-4">
							<div className="relative h-[2px] w-80 overflow-hidden rounded-full bg-black/5">
								{exportProgress === null ? (
									<div className="h-full w-1/3 animate-[shutterScan_0.5s_infinite_linear] rounded-full bg-black/60" />
								) : (
									<div
										className="h-full bg-black/95 transition-all duration-100 ease-out"
										style={{ width: `${Math.max(1, Math.round(exportProgress * 100))}%` }}
									/>
								)}
							</div>
							<div className="flex w-full items-center justify-between px-1 font-mono text-[10px] font-black tabular-nums tracking-tighter text-black/50">
								<span className="animate-pulse">{exportProgress === null ? "CALIBRATING" : "ENCODING"}</span>
								<span>{exportProgress === null ? "READY" : `${Math.round(exportProgress * 100)}%`}</span>
							</div>
						</div>
					</div>

					<style>{`
						@keyframes shutterFlash { 0% { opacity: 0; } 2% { opacity: 1; } 100% { opacity: 0; } }
						@keyframes shutterBladeDown { 0% { transform: translateY(-100%); } 15% { transform: translateY(0); } 85% { transform: translateY(0); } 100% { transform: translateY(-82%); } }
						@keyframes shutterBladeUp { 0% { transform: translateY(100%); } 15% { transform: translateY(0); } 85% { transform: translateY(0); } 100% { transform: translateY(82%); } }
						@keyframes shutterScan { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
					`}</style>
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
