"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useActorRef, useSelector } from "@xstate/react";

import { StudioButton, StudioControlScope, SURFACE_RADIUS } from "@/components/ui/studio-controls";

import type { CameraPreviewState, ExportFraming, ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { setCaptureElapsedMs } from "@/lib/capture-clock";
import { clipMarqueeElapsedMs, clipSongSecond } from "@/lib/export-clock";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics/events";
import { playClickAudio } from "@/lib/ipod-state/effects";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { createDebouncer } from "@/lib/debounce";
import { ClipCodecUnavailableError } from "@/lib/export/clip-codec-ladder";
import { recordIpodClip, isClipRecordingSupported } from "@/lib/three-clip-recorder";
import { deliverExportedBlob } from "@/lib/export-utils";
import { consumePortableStateFromUrl, copyShareLink } from "@/lib/ipod-state/share";
import { loadWorkbenchModel, saveWorkbenchModel } from "@/lib/ipod-state/storage";
import { getExportHistory, saveExportToHistory, type ExportRecord } from "@/lib/pocketbase";
import { type LoopStyle, type StudioPose } from "@/lib/studio-camera";
import type { PoseFraming } from "@/lib/studio-camera-poses";
import {
	EMPTY_CAMERA_STORE,
	readCameraStore,
	writeCameraStore,
	type CameraStore,
} from "@/lib/studio-camera-store";
import { findStudioClip, isTheatreClip, STUDIO_CLIPS } from "@/lib/studio-clip-presets";
import { STEEL_ROUGHNESS_FLOOR } from "@/lib/studio-owned-finish";
import { exportJobOf, exportMachine, exportProgressOf } from "@/lib/xstate/export-machine";
import { exportFingerprint, proofFingerprint } from "@/lib/export/export-fingerprint";
import { selectExportSnapshot } from "@/lib/export/proof-inputs";
import { snapshotToModel } from "@/lib/export/proof-restore";
import { useProofCache } from "@/lib/export/use-proof-cache";

import { PanelSystem } from "../panels/panel-system";
import { useSafeInsets, useViewportSize } from "../panels/use-panel-layout";
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
	type ExportQuality,
	type Ipod3DExportState,
	type StillExportOptions,
} from "./ipod-3d-export-dock";
import { Ipod3DExportProofPanel } from "./ipod-3d-export-proof-panel";
import { Ipod3DNowPlayingCockpit } from "./ipod-3d-nowplaying-cockpit";
import { Ipod3DCoachHint } from "./ipod-3d-coach-hint";
import { Ipod3DCameraBar, type PoseRequest } from "./ipod-3d-camera-bar";
import { TheatreStudioDev } from "./theatre-studio-dev";

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

/**
 * Clip encode settings per quality tier (mirrors the 2D MP4_QUALITY_CONFIG intent).
 * `cinema` is the buttery 60fps tier with temporal motion blur — smoother and
 * higher-fidelity, at the cost of rendering `motionBlurSamples`× the frames.
 */
const CLIP_QUALITY: Record<
	ClipExportOptions["quality"],
	{ fps: number; bitsPerSecond: number; supersample: number; motionBlurSamples: number }
> = {
	standard: { fps: 24, bitsPerSecond: 12_000_000, supersample: 1, motionBlurSamples: 1 },
	pro: { fps: 30, bitsPerSecond: 22_000_000, supersample: 1.5, motionBlurSamples: 1 },
	cinema: { fps: 60, bitsPerSecond: 40_000_000, supersample: 1.5, motionBlurSamples: 3 },
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
	const router = useRouter();
	const [model, dispatch] = useReducer(
		ipodWorkbenchReducer,
		undefined,
		// Client-only surface (ssr:false), so the initializer may read the URL: a
		// valid `?s=` share link wins over local persistence for this load only —
		// the param is consumed — and panel geometry stays device-local.
		() => {
			const persisted = loadWorkbenchModel() ?? createInitialIpodWorkbenchModel();
			const shared = consumePortableStateFromUrl();
			return shared ? { ...shared, panelLayout: persisted.panelLayout } : persisted;
		},
	);

	// Persist the hard-earned user state — debounced (spec: stage-render-performance).
	// A slider drag dispatches per frame, and serializing the whole model to
	// localStorage synchronously each time was per-frame jank. The trailing debounce
	// writes once per pause; the debouncer holds the LATEST model, so the
	// pagehide/unmount flush below always lands the current state and no
	// acknowledged edit is ever lost. (Exports never read storage mid-session —
	// they read the in-memory model — so no flush is needed on that path.)
	const [persistModel] = useState(() => createDebouncer(saveWorkbenchModel, 300));
	useEffect(() => {
		persistModel.call(model);
	}, [persistModel, model]);
	useEffect(() => {
		const flush = () => persistModel.flush();
		window.addEventListener("pagehide", flush);
		return () => {
			window.removeEventListener("pagehide", flush);
			flush(); // unmounting inside the debounce window must not drop the edit
		};
	}, [persistModel]);

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const ipodApiRef = useRef<ThreeDIpodHandle | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const noticeTimer = useRef<number | null>(null);
	// Export lifecycle — a central XState machine (spec: 3d-export-reliability).
	// The machine forbids re-entrancy and ignores stale callbacks after a reset;
	// the veil + dock derive their display state from its snapshot instead of an
	// ad-hoc string union.
	const exportActorRef = useActorRef(exportMachine);
	const exportSnapshot = useSelector(exportActorRef, (snapshot) => snapshot);
	const sendExport = exportActorRef.send;
	const exporting = !exportSnapshot.matches("idle");
	const exportState: Ipod3DExportState =
		(exportJobOf(exportSnapshot) ?? "idle") as Ipod3DExportState;
	// Export progress (0–1) for the loading veil; null = indeterminate (stills).
	const exportProgress = exportProgressOf(exportSnapshot);
	// Playhead — the selected move + live transport. `previewT` is the position over
	// the full clip (0–1); the rig reports it back while playing so the scrubber
	// tracks. Clip length is lifted here so the preview cadence matches the export.
	const [durationSec, setDurationSec] = useState(5);
	const [previewMove, setPreviewMove] = useState<string>(STUDIO_CLIPS[0].id);
	const [previewPlaying, setPreviewPlaying] = useState(false);
	const [previewT, setPreviewT] = useState(0);
	// Motion shaping — cadence multiplier + time map (loop / boomerang / hold). Lifted
	// here so the live preview and the export read the SAME values (WYSIWYG parity).
	const [speed, setSpeed] = useState(1);
	const [loopStyle, setLoopStyle] = useState<LoopStyle>("loop");
	// Aspect + quality — lifted from the export dock so the proof fingerprint, the proof
	// panel, and the export all read one source of truth (WYSIWYG parity).
	const [aspect, setAspect] = useState<ExportAspect>("story");
	const [quality, setQuality] = useState<ExportQuality>("standard");
	// The rig flies the move only when the playhead is "engaged" — playing, or
	// scrubbed off the hero seam. At t=0 paused we hand the camera back so the user
	// can compose freely (phase 0 ≈ the composed hero anyway).
	const previewEngaged = previewPlaying || previewT > 0.0001;
	const preview: CameraPreviewState | null =
		previewEngaged && !exporting
			? { move: previewMove, playing: previewPlaying, t: previewT, durationSec, speed, loop: loopStyle }
			: null;
	// Canvas symbiosis (spec: floating-panel-system): inset the spatial canvas away from
	// open floating panels so the model is never permanently occluded. Suspended during
	// export so capture framing is untouched. Insets read the same store the panel host does.
	const symbiosisViewport = useViewportSize();
	const safeInsets = useSafeInsets(symbiosisViewport);
	const stageStyle = useMemo<React.CSSProperties | undefined>(() => {
		// Panel symbiosis is a DESKTOP affordance — panels only float at ≥lg. Below that the
		// controls live in the bottom drawer, so insetting the canvas by their frames shoved
		// the device clean off the bottom-right corner of a phone. The framing must be a
		// deterministic function of the VIEWPORT, never of chrome that isn't even floating.
		// Suspended during export for the same reason: capture framing is untouched.
		if (exporting || symbiosisViewport.width < 1024) return undefined;
		const { top, right, bottom, left } = safeInsets;
		if (!top && !right && !bottom && !left) return undefined;
		return { top, right, bottom, left, minHeight: 0 };
	}, [exporting, safeInsets, symbiosisViewport.width]);

	// Mobile control drawer. Desktop ignores this (the panels float at the corners);
	// on narrow viewports the controls collapse into a bottom sheet so they never
	// overlap the device.
	const [controlsOpen, setControlsOpen] = useState(false);

	// Short-landscape phones: the floating chrome must reflow to the screen edges so
	// the centered model stays visible. Below `lg` the cockpit sheet is hidden anyway;
	// this only re-docks the camera bar.
	const [landscape, setLandscape] = useState(false);
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(max-height: 540px) and (orientation: landscape)");
		const update = () => setLandscape(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	// ── The one camera state (spec: camera-control-truth) ──
	// `framing` is which face the shot is about — it feeds the rig as the camera target
	// and rest distance. It is no longer a user-facing "focus mode" with its own control:
	// each named pose in the bar *carries* its framing, so there is one "Front" on the
	// page. The bar and the cockpit (05) are two altitudes on this same state; there is
	// no third owner.
	const [framing, setFraming] = useState<PoseFraming>("product");
	// Applying a pose is two writes and THE ORDER MATTERS (design D1): the framing sets
	// the camera target, then the angles aim it. Both are dispatched in one commit, and
	// the rig's framing effect (a child) runs before this stage's pose effect (a parent),
	// so `setCameraGoal` lands last and wins instead of being clobbered by the framing
	// snap. The nonce makes re-requesting the SAME pose re-fire (tap Front, orbit away,
	// tap Front again).
	const [poseRequest, setPoseRequest] = useState<(PoseRequest & { nonce: number }) | null>(null);
	const poseNonce = useRef(0);
	const requestPose = useCallback((request: PoseRequest) => {
		setFraming(request.framing);
		setPoseRequest({ ...request, nonce: ++poseNonce.current });
	}, []);
	useEffect(() => {
		if (!poseRequest) return;
		ipodApiRef.current?.setCameraGoal({
			azimuth: poseRequest.azimuth,
			elevation: poseRequest.elevation,
			// A named view omits `reach` — it re-aims, it does not dolly, so the framing's
			// rest distance and the rig's responsive fit floor keep the device framed on a
			// phone. A recalled studio shot DOES carry its reach.
			...(poseRequest.reach === undefined ? {} : { reach: poseRequest.reach }),
		});
	}, [poseRequest]);

	// Lockable perspective (design D13): when locked, the orbit rig ignores drag/wheel
	// so the composed angle can't be knocked off, the pose persists across reloads, and
	// it's the angle every Hero/clip export flies. Owned here so it reaches both the
	// rig (via ThreeDIpod) and the cockpit toggle.
	const [cameraLocked, setCameraLocked] = useState(false);
	const lockedPoseRef = useRef<StudioPose | null>(null);
	// Compose-time origin gizmo (camera cockpit toggle) — never baked into exports.
	const [showOrigin, setShowOrigin] = useState(false);
	// Dev "Back finish" dial — polished-back roughness (mirror ↔ brushed). Defaults to the
	// crawl-safe floor that the owned-finish render ships; stage-local, not persisted.
	const [backRoughness, setBackRoughness] = useState(STEEL_ROUGHNESS_FLOOR);

	// Export history from PocketBase.
	const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

	// Hydrate history on mount.
	useEffect(() => {
		getExportHistory().then(setExportHistory).catch(() => {});
	}, []);

	// Everything the camera remembers — locked pose, studio shots, cockpit presets — in
	// one versioned store. The stage owns it and hands slices down, so the bar and the
	// cockpit edit the same state instead of each writing its own ad-hoc key (which is
	// what let the three camera surfaces drift apart). `null` = not hydrated yet, so the
	// first render's empty default can never stomp real storage.
	const [camera, setCamera] = useState<CameraStore | null>(null);
	useEffect(() => {
		const stored = readCameraStore(localStorage);
		setCamera(stored);
		if (stored.lockedPose) {
			lockedPoseRef.current = stored.lockedPose;
			setCameraLocked(true);
		}
	}, []);
	// Write-back doubles as the legacy-key migration: the first write folds the three old
	// keys into `ipod-3d-camera.v1` and retires them.
	useEffect(() => {
		if (camera) writeCameraStore(localStorage, camera);
	}, [camera]);
	const patchCamera = useCallback(
		(patch: Partial<CameraStore>) =>
			setCamera((prev) => ({ ...(prev ?? EMPTY_CAMERA_STORE), ...patch })),
		[],
	);

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
		const next = !cameraLocked;
		const pose = next ? (ipodApiRef.current?.getCameraPose() ?? null) : null;
		lockedPoseRef.current = pose;
		setCameraLocked(next);
		patchCamera({ lockedPose: pose });
	}, [cameraLocked, patchCamera]);

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
	// Mirror the Theatre-studio toggle into a ref so the export callback can force the
	// overlay hidden during a bake and restore it afterward without re-subscribing.
	const theatreStudioRef = useRef(model.studio.theatreStudio);
	useEffect(() => {
		theatreStudioRef.current = model.studio.theatreStudio;
	}, [model.studio.theatreStudio]);
	// When the Theatre dev toggle goes off, the `·` moment cards leave the picker — so
	// snap any selected moment card back to the first procedural move. Otherwise the
	// picker would show no active button while the preview still flew a hidden clip.
	useEffect(() => {
		if (model.studio.theatreStudio) return;
		setPreviewMove((current) => {
			const clip = findStudioClip(current);
			return clip && isTheatreClip(clip) ? STUDIO_CLIPS[0].id : current;
		});
	}, [model.studio.theatreStudio]);
	// Live playback clock: advance the now-playing time 1s per real second while the
	// transport plays AND we're not exporting. During a clip export the clock is
	// driven by CLIP-time instead (handleExportClip → onProgress), so the exported
	// video advances exactly one song-second per video-second. A realtime interval
	// must NOT also run then: it tracks export wall-clock, which differs from clip
	// time, so the two together fast-forwarded the song on slow renders.
	useEffect(() => {
		if (!model.interaction.isPlaying || exporting) return;
		const id = window.setInterval(() => {
			const { currentTime, duration } = playbackRef.current;
			dispatch({ type: "UPDATE_CURRENT_TIME", payload: (currentTime + 1) % (duration + 1) });
		}, 1000);
		return () => window.clearInterval(id);
	}, [model.interaction.isPlaying, exporting, dispatch]);

	const playClick = useCallback(() => {
		playClickAudio(audioRef);
	}, []);

	const showNotice = useCallback((message: string) => {
		if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
		setNotice(message);
		noticeTimer.current = window.setTimeout(() => setNotice(null), 1800);
	}, []);
	// Clear a pending notice timer on unmount so it can't fire setState after the
	// stage is gone (a stale-update side effect when navigating away mid-notice).
	useEffect(() => () => {
		if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
	}, []);

	const handleShareLink = useCallback(() => {
		void copyShareLink(model).then((copied) => {
			showNotice(copied ? "Share link copied" : "Couldn't copy link");
			if (copied) track(ANALYTICS_EVENTS.configShareLink, {});
		});
	}, [model, showNotice]);

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
	const handlePreviewMoveChange = useCallback((move: string) => setPreviewMove(move), []);
	// The rig reports the playing head position back so the scrubber tracks it.
	const handlePreviewTick = useCallback((t: number) => setPreviewT(t), []);

	// Yield two frames so React paints the loading veil BEFORE the heavy capture
	// work (snap-to-rest, screen bake, offline render) mutates the live scene —
	// otherwise the user sees those temporary frames flash through.
	const nextPaint = useCallback(
		() =>
			new Promise<void>((resolve) => {
				let settled = false;
				const finish = () => {
					if (settled) return;
					settled = true;
					resolve();
				};
				requestAnimationFrame(() => requestAnimationFrame(finish));
				// rAF is frozen while the tab is backgrounded. Without a fallback, awaiting
				// it during export would hang forever — wedging exportState non-idle and
				// leaving the loading veil stuck on screen ("the logic gets stuck"). The
				// timeout guarantees the export always proceeds even if the user tabs away.
				window.setTimeout(finish, 200);
			}),
		[],
	);

	const handleExportPng = useCallback(
		async (framing: ExportFraming, options: StillExportOptions) => {
			const api = ipodApiRef.current;
			// The machine also rejects EXPORT outside idle; this early return just
			// skips the veil paint for a click that can't start anything.
			if (!api || !exportActorRef.getSnapshot().matches("idle")) return;
			setPreviewPlaying(false); // hand the camera back to the still framing
			sendExport({ type: "EXPORT", job: `png:${framing}`, progress: null });
			await nextPaint(); // let the veil cover before the scene snaps for capture
			try {
				sendExport({ type: "PREPARED" });
				const [w, h] = ASPECT_DIMS[options.aspect].still;
				// Hero still anchors on the composed hero (held by the playhead) so a
				// parked scrubber can't tilt the shot; Front ignores it.
				const blob = await api.captureHighRes(w, h, framing, heroAnchorRef.current);
				if (!blob) throw new Error("capture returned no image");
				sendExport({ type: "ENCODED" });
				// Route delivery through the platform-correct channel: desktop downloads
				// directly; a phone gets the share/save/preview prompt (a synthetic
				// `<a download>` silently no-ops on iOS, which is why exports never landed).
				const filename = `ipod-3d-${framing}-${options.aspect}-${Date.now()}.png`;
				const delivery = await deliverExportedBlob(blob, { filename, mimeType: "image/png" });
				sendExport({ type: "SAVED" });
				if (!delivery.cancelled) {
					showNotice(framing === "hero" ? "Saved Hero PNG" : "Saved Front PNG");
				}
			} catch (error) {
				console.error("[3d-export] png failed", error);
				sendExport({ type: "FAIL", error: error instanceof Error ? error.message : String(error) });
				showNotice("Export failed");
			} finally {
				// No-op after SAVED (machine is already idle); from error it returns to
				// idle so the veil can never stay wedged on screen.
				sendExport({ type: "RESET" });
			}
		},
		[exportActorRef, sendExport, showNotice, nextPaint],
	);

	// Dev-only seam for `pnpm og:render`. The launch poster must be the device as the
	// renderer actually draws it, so it goes through the same offscreen captureHighRes
	// an export uses — a page screenshot could not help but frame the chrome around it.
	// `NODE_ENV` is inlined at build time, so this whole block is dead code in prod.
	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		const host = window as unknown as {
			__ipodCaptureOg?: (
				width: number,
				height: number,
				framing: ExportFraming,
			) => Promise<string | null>;
		};
		host.__ipodCaptureOg = async (width, height, framing) => {
			const blob = await ipodApiRef.current?.captureHighRes(
				width,
				height,
				framing,
				heroAnchorRef.current,
			);
			if (!blob) return null;
			return await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(String(reader.result));
				reader.onerror = () => reject(new Error("failed to encode capture"));
				reader.readAsDataURL(blob);
			});
		};
		return () => {
			delete host.__ipodCaptureOg;
		};
	}, []);

	const handleExportClip = useCallback(
		async (move: string, options: ClipExportOptions) => {
			const api = ipodApiRef.current;
			if (!api || !exportActorRef.getSnapshot().matches("idle")) return;
			if (!isClipRecordingSupported()) {
				showNotice("Clips need Chrome, Edge, or Safari 16.4+");
				return;
			}
			setPreviewPlaying(false); // freeze the playhead; the offline render owns the camera
			// Belt-and-suspenders: clips capture the R3F canvas, not the DOM, so the studio
			// overlay can't appear in a frame — but force it hidden anyway so it never steals
			// pointer/keyboard focus mid-bake. Restored in `finally` if it was on.
			if (theatreStudioRef.current) {
				void import("@/lib/theatre/theatre-runtime").then((m) =>
					m.setTheatreStudioVisible(false),
				);
			}
			sendExport({ type: "EXPORT", job: `clip:${move}`, progress: 0 });
			await nextPaint(); // veil covers before snap-to-rest / screen bake / offline frames
			// The playhead the user composed on — declared outside the try so `finally`
			// can restore it after the clip-time drive has advanced it during the export.
			const baseTime = playbackRef.current.currentTime;
			const songDuration = playbackRef.current.duration;
			// Pin the marquee to clip-time 0 before the first bake so frame 0 is
			// deterministic; the per-bake `onClipProgress` advances it from here.
			setCaptureElapsedMs(0);
			try {
				// Anchor the move on the composed hero held by the playhead (so a parked
				// scrubber can't shift it); fall back to the live pose when disengaged.
				const anchor = heroAnchorRef.current ?? api.getCameraPose() ?? undefined;
				const [width, height] = ASPECT_DIMS[options.aspect].clip;
				const q = CLIP_QUALITY[options.quality];
				// Drive EVERY looping element on the screen off one deterministic clip-clock
				// (`i / total`, sampled at bake time via `onClipProgress`), not wall-clock rAF
				// (marquee) or async encoder progress (song) — the two clocks that used to
				// freeze partway through a long export. `onProgress` now only feeds the veil %.
				// See lib/export-clock.ts for the (unit-tested) clock math.
				let lastSecond = -1;
				sendExport({ type: "PREPARED" });
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
					motionBlurSamples: q.motionBlurSamples,
					onProgress: (encoded, total) => sendExport({ type: "PROGRESS", encoded, total }),
					onClipProgress: (progress) => {
						// Marquee: imperative + synchronous, so the very next bake captures it.
						setCaptureElapsedMs(clipMarqueeElapsedMs(progress, options.durationSec));
						// Song time: React state, so `flushSync` it to the DOM before the bake
						// rasterizes the screen. Throttled to whole seconds (the display's
						// resolution) to avoid needless re-renders.
						const second = clipSongSecond(progress, {
							baseTime,
							durationSec: options.durationSec,
							songDuration,
						});
						if (second !== lastSecond) {
							lastSecond = second;
							flushSync(() => dispatch({ type: "UPDATE_CURRENT_TIME", payload: second }));
						}
					},
				});
				if (!blob) throw new Error("recorder returned no clip");
				sendExport({ type: "ENCODED" });
				// Name by the motion that actually played — "hold" for a motion-free angle,
				const motionTag =
					options.loop === "hold" ? "hold" : options.loop === "boomerang" ? `${move}-boomerang` : move;
				const filename = `ipod-3d-${motionTag}-${options.aspect}-${options.durationSec}s-${Date.now()}.mp4`;

				// Same platform-correct hand-off as the still: phones get the share/save
				// prompt instead of a silently-failing synthetic download.
				await deliverExportedBlob(blob, { filename, mimeType: "video/mp4" });

				// Provenance: stamp the export identity + retained snapshot so the entry is
				// identifiable and re-openable, and its proof thumbnail resolves from the cache.
				const snapshot = anchor
					? selectExportSnapshot(model, anchor, {
							aspect: options.aspect,
							quality: options.quality,
							move,
							loop: options.loop,
							speed: options.speed,
							durationSec: options.durationSec,
						})
					: undefined;
				const fingerprint = snapshot ? exportFingerprint(snapshot) : undefined;

				// Persist to PocketBase history.
				saveExportToHistory(blob, filename, {
					title: model.metadata.title,
					move: motionTag,
					aspect: options.aspect,
					duration: options.durationSec,
					fingerprint,
					snapshot,
				}).then((record) => {
					// Re-attach provenance locally in case PB drops unknown fields — re-open and
					// thumbnails must work this session regardless of the backend schema.
					if (record) {
						setExportHistory((prev) => [{ ...record, fingerprint, snapshot }, ...prev].slice(0, 10));
					}
				});

				sendExport({ type: "SAVED" });
				showNotice("Saved MP4");
			} catch (error) {
				console.error("[3d-export] clip failed", error);
				sendExport({ type: "FAIL", error: error instanceof Error ? error.message : String(error) });
				// Honest, specific messaging when the failure is "this device can't encode
				// H.264 at all" (ladder exhausted) rather than a generic hiccup.
				showNotice(
					error instanceof ClipCodecUnavailableError
						? "This device can't encode H.264 clips"
						: "Clip failed",
				);
			} finally {
				// Release the marquee back to its live wall-clock rAF animation, and restore
				// the composed playhead the clip-time drive advanced during export so the live
				// screen returns to exactly where the user was parked. RESET returns the
				// machine to idle from error (no-op after SAVED) — the veil cannot wedge.
				setCaptureElapsedMs(null);
				dispatch({ type: "UPDATE_CURRENT_TIME", payload: baseTime });
				sendExport({ type: "RESET" });
				// Restore the studio overlay if the designer had it open before exporting.
				if (theatreStudioRef.current) {
					void import("@/lib/theatre/theatre-runtime").then((m) =>
						m.setTheatreStudioVisible(true),
					);
				}
			}
		},
		[exportActorRef, sendExport, showNotice, nextPaint, model, dispatch],
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

	// ── Export proof cache ──
	// Ambient, content-addressed proof: while the studio is idle the current composition's
	// anchor frame is speculatively rendered through the SAME captureHighRes path an export
	// uses, then read instantly by the panel. The cache only OBSERVES the pipeline — it never
	// changes export output. Pre-compute yields to a real export bake and to live playback.
	const exportOptions = useMemo(
		() => ({ aspect, quality, move: previewMove, loop: loopStyle, speed, durationSec }),
		[aspect, quality, previewMove, loopStyle, speed, durationSec],
	);
	const renderProof = useCallback(
		async (snapshot: ReturnType<typeof selectExportSnapshot>): Promise<Blob | null> => {
			const api = ipodApiRef.current;
			if (!api) return null;
			const [w, h] = ASPECT_DIMS[snapshot.aspect as ExportAspect].still;
			// The proof IS the anchor frame (phase 0 = the composed hero), so we capture the
			// hero framing at the snapshot's pose — byte-identical to an export's frame 0.
			return api.captureHighRes(w, h, "hero", {
				azimuth: snapshot.pose.azimuth,
				elevation: snapshot.pose.elevation,
				reach: snapshot.pose.reach,
				target: [snapshot.pose.target[0], snapshot.pose.target[1], snapshot.pose.target[2]],
			});
		},
		[],
	);
	const proof = useProofCache({
		model,
		options: exportOptions,
		getPose: () => ipodApiRef.current?.getCameraPose() ?? null,
		render: renderProof,
		isExporting: exporting,
		// Only pre-compute when the camera is still (not flying the move) and no export is
		// running — capturing mid-move would render a transient pose, not the composed angle.
		enabled: !previewEngaged && !exporting,
	});

	// History thumbnail lookup: the cache is keyed by the PROOF key (motion-excluded), so a
	// record's thumbnail is found by re-deriving that key from its stored snapshot.
	const peekProofBlob = useCallback(
		(record: ExportRecord): Blob | undefined =>
			record.snapshot ? proof.peek(proofFingerprint(record.snapshot))?.blob : undefined,
		[proof],
	);

	// Re-open: restore the exact setup a past export was made with — model state via
	// RESTORE_MODEL, playhead/options via their lifted setters, pose via the camera goal.
	const handleReopen = useCallback(
		(record: ExportRecord) => {
			const snap = record.snapshot;
			if (!snap) return;
			dispatch({ type: "RESTORE_MODEL", payload: snapshotToModel(model, snap) });
			setAspect(snap.aspect as ExportAspect);
			setQuality(snap.quality as ExportQuality);
			setLoopStyle(snap.loop as LoopStyle);
			setSpeed(snap.speed);
			setDurationSec(snap.durationSec);
			setPreviewMove(snap.move);
			setPreviewPlaying(false);
			setPreviewT(0);
			heroAnchorRef.current = null;
			ipodApiRef.current?.setCameraGoal({
				azimuth: snap.pose.azimuth,
				elevation: snap.pose.elevation,
				reach: snap.pose.reach,
			});
			showNotice("Restored export setup");
		},
		[model, showNotice],
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
			// Inline text/artwork editing on the device screen is on by default in EVERY
			// interaction model — tap an element to edit it. There is NO persistent edit
			// chrome (no dashed outline, no drag handles): editing stays invisible until
			// you click, and the capture path renders the clean marquee regardless. The
			// interaction lock forces the clean state for screenshots/export.
			isEditable={!studio.interactionLocked}
			// Dev-only layout tool: the dashed bounding boxes + drag handles for
			// repositioning elements. Off by default, so the boxes never leak into the
			// live view, a preview, or an export. Decoupled from interaction model on
			// purpose — touch/pinch (orbit-pad overlay) is unaffected either way.
			layoutMode={studio.layoutMode}
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
			{/* Theatre.js studio timeline GUI for camera authoring — dev only, renders nothing.
			    Toggled from the cockpit; off by default so its overlay never clutters the view. */}
			<TheatreStudioDev enabled={studio.theatreStudio} />

			{/* Shell Header — a high-performance navigation bar that bounds the experience.
			    It holds the product identity and the primary menu toggle, ensuring the flow
			    is consistent across mobile and desktop. */}
			<header className="absolute inset-x-0 top-0 z-[60] flex h-16 items-center justify-end px-6 pointer-events-none">
				<nav className="shell-nav flex items-center gap-4 pointer-events-auto">
					{/* The return half of the 2D↔3D toggle (spec: surface-mode-switching) — the
					    mirror of the `/` rail's "3D Studio" button, in the same header slot. The
					    customization carries across on its own: both surfaces read and write the
					    same persisted model. */}
					<StudioControlScope
						stageBackground={presentation.bgColor}
						style={{
							background: "var(--studio-surface)",
							borderColor: "var(--studio-hairline)",
							borderRadius: SURFACE_RADIUS,
						}}
						className="flex items-center border p-1 shadow-sm backdrop-blur-md"
					>
						<StudioButton
							onPress={() => router.push("/")}
							aria-label="Back to the 2D workbench"
							className="shrink-0"
							data-testid="2d-button"
						>
							2D
						</StudioButton>
					</StudioControlScope>

					{/* Shell Nav Button — a high-performance anchor for the creation flow. */}
					<span>
						<button
							type="button"
							onClick={() => setControlsOpen((o) => !o)}
							// Same machined corner as the 2D control beside it — the header reads as
							// one instrument, not a stadium pill next to a rectangle.
							style={{ borderRadius: SURFACE_RADIUS }}
							className={`group relative flex h-10 items-center gap-3 border px-4 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) active:scale-[0.94] ${
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
				// Framing is controlled by the pose model now, so the rig's own in-canvas
				// focus buttons stay unmounted — the bar is the only quick camera control.
				focus={framing}
				cameraLocked={cameraLocked}
				preview={preview}
				onPreviewTick={handlePreviewTick}
				skinColor={presentation.skinColor}
				ringColor={presentation.ringColor || undefined}
				centerColor={presentation.centerColor || undefined}
				backColor={presentation.backColor}
				edgeColor={presentation.edgeColor}
				bezelColor={presentation.bezelColor}
				captureBackground={presentation.bgColor}
				showOrigin={showOrigin}
				backRoughness={backRoughness}
				lighting={studio.lighting}
				technicalFlat={studio.technicalFlat}
				showPorts={studio.showPorts}
				screen={screenComponent}
				wheel={wheelComponent}
				stageClassName="bg-transparent"
				stageStyle={stageStyle}
			/>

			{/* Responsive control surface — one DOM tree, two layouts. */}
			<div
				className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[75dvh] w-full max-w-md transform flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-[32px] border-t border-black/10 bg-white/90 p-5 pb-12 backdrop-blur-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:contents ${
					controlsOpen ? "translate-y-0 shadow-[0_-20px_80px_-10px_rgba(0,0,0,0.15)]" : "translate-y-full lg:translate-y-0"
				}`}
			>
				{/* Left group — the "subject": how you interact (01), what the device looks
				    like (02), what's on screen (03), its charge state (04), your angle (05).
				    Numbered 01→05 so the column reads top-to-bottom as a shoot pipeline. */}
				<div className="flex flex-col gap-4 lg:pointer-events-none lg:absolute lg:left-6 lg:top-24 lg:z-10 lg:max-h-[calc(100dvh-8rem)] lg:w-[280px] lg:overflow-y-auto lg:pb-8">
					<Ipod3DStudioCockpit index={1} interaction={interaction} studio={studio} dispatch={dispatch} />
					<Ipod3DColorCockpit
						index={2}
						presentation={presentation}
						dispatch={dispatch}
						lightingName={studio.lighting.name}
					/>
					<Ipod3DNowPlayingCockpit index={3} metadata={model.metadata} dispatch={dispatch} />
					{/* Battery lives with the screen state it drives (the status-bar cell),
					    not stranded between Light and Export as it was before. */}
					<Ipod3DBatteryCockpit
						index={4}
						batteryLevel={interaction.batteryLevel}
						batteryMode={interaction.batteryMode}
						dispatch={dispatch}
					/>
					<Ipod3DCameraCockpit
						index={5}
						apiRef={ipodApiRef}
						locked={cameraLocked}
						onToggleLock={toggleCameraLock}
						onResetCamera={() => ipodApiRef.current?.resetCamera()}
						showOrigin={showOrigin}
						onToggleOrigin={() => setShowOrigin((v) => !v)}
						presets={camera?.presets ?? []}
						onPresetsChange={(presets) => patchCamera({ presets })}
					/>
				</div>

				{/* Right group — the "scene & capture": light it (06), then export it (07). */}
				<div className="flex flex-col gap-4 lg:pointer-events-none lg:absolute lg:right-6 lg:top-24 lg:z-10 lg:max-h-[calc(100dvh-8rem)] lg:w-[280px] lg:overflow-y-auto lg:pb-8">
					<Ipod3DLightingCockpit
						index={6}
						studio={studio}
						dispatch={dispatch}
						apiRef={ipodApiRef}
						backRoughness={backRoughness}
						onBackRoughnessChange={setBackRoughness}
					/>
					<Ipod3DExportProofPanel
						index={7}
						fingerprint={proof.currentFingerprint}
						peek={proof.peek}
						version={proof.version}
						aspect={aspect}
						quality={quality}
						fps={CLIP_QUALITY[quality].fps}
						durationSec={durationSec}
						hold={loopStyle === "hold"}
						moveLabel={(findStudioClip(previewMove) ?? STUDIO_CLIPS[0]).label}
						onExport={() =>
							handleExportClip(previewMove, {
								durationSec,
								quality,
								aspect,
								speed,
								loop: loopStyle,
							})
						}
						exportBusy={exporting}
					/>
					<Ipod3DExportDock
						index={8}
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
						aspect={aspect}
						onAspectChange={setAspect}
						quality={quality}
						onQualityChange={setQuality}
						onPreviewMoveChange={handlePreviewMoveChange}
						onTogglePlay={handleTogglePlay}
						onScrub={handleScrub}
						onResetPlayhead={handleResetPlayhead}
						onExportPng={handleExportPng}
						onExportClip={handleExportClip}
						showTheatreClips={studio.theatreStudio}
						history={exportHistory}
						peekProofBlob={peekProofBlob}
						onReopen={handleReopen}
						onShareLink={handleShareLink}
					/>
				</div>
			</div>

			{/* The ONE bottom bar (spec: camera-control-truth) — six named views, each
			    carrying its own framing, plus the saved studio shots. It replaces both the
			    touch gizmo and the focus segment that used to stack on top of each other. */}
			<Ipod3DCameraBar
				apiRef={ipodApiRef}
				onPose={requestPose}
				framing={framing}
				shots={camera?.shots ?? []}
				onShotsChange={(shots) => patchCamera({ shots })}
				presentation={presentation}
				dispatch={dispatch}
				onNotice={showNotice}
				landscape={landscape}
			/>

			{/* One-time coach for the native two-finger camera gesture (touch only). */}
			<Ipod3DCoachHint />

			{/* Export veil — a cinematic shutter that covers the canvas for the render.
			    It uses 'shutter' optics: a high-speed blade snap followed by a white
			    optic flash, then settling into a technical encoding state. */}
			{exporting && (
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

			{/* Floating tool panels + ⌘K palette (spec: floating-panel-system,
			    command-palette). Panels reflow this canvas via the symbiosis insets above. */}
			<PanelSystem />
		</div>
	);
}
