"use client";

import { useEffect, useRef, useState } from "react";

import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { REACH_RANGE, type StudioPose } from "@/lib/studio-camera";

/**
 * On-canvas touch camera controls for /3d on mobile.
 *
 * Mobile composing is one-handed and the canvas drag-to-orbit alone gives no
 * canonical-view snapping or zoom reach. This floating layer adds three things —
 * a 3D-modeling-style orientation gizmo (tap to snap to Front/Back/Left/Right/
 * Top/¾), a relative-drag orbit-pad for fine orbit, and two-finger pinch for
 * reach (dolly). It is a *pure driver* of the existing `OrbitRig`: it only reads
 * `getCameraPose()` and writes `setCameraGoal()` through the public
 * `ThreeDIpodHandle` — it never instantiates a second camera/controls system, so
 * the rig's own clamping (elevation/reach) stays the single source of truth.
 *
 * Because it is DOM that floats above the WebGL canvas (and exports render the
 * scene to an offscreen render target, never the DOM), it is inherently absent
 * from every export — same as the other cockpits.
 */

interface CanonicalView {
	id: string;
	label: string;
	azimuth: number;
	elevation: number;
}

// Canonical product views, mapped to studio-coordinate poses. Reach is left
// untouched on a snap so a snap re-aims without zooming.
const VIEWS: readonly CanonicalView[] = [
	{ id: "front", label: "Front", azimuth: 0, elevation: 0 },
	{ id: "right", label: "Right", azimuth: 90, elevation: 0 },
	{ id: "back", label: "Back", azimuth: 180, elevation: 0 },
	{ id: "left", label: "Left", azimuth: -90, elevation: 0 },
	{ id: "top", label: "Top", azimuth: 0, elevation: 70 },
	{ id: "hero", label: "¾", azimuth: 20, elevation: 12 },
] as const;

// Degrees of orbit per pixel of finger travel on the pad — tuned for a calm,
// non-twitchy one-thumb drag.
const ORBIT_DEG_PER_PX = 0.4;

/** Shortest signed angular distance a→b in degrees, in [-180, 180]. */
function angleDelta(a: number, b: number): number {
	let d = (((b - a) % 360) + 540) % 360;
	return d - 180;
}

interface Ipod3DTouchControlsProps {
	apiRef: React.MutableRefObject<ThreeDIpodHandle | null>;
	/** Short-landscape phones: dock the cluster to the bottom-right as a row so the
	 *  centered model and the bottom-left studio-shots bar stay clear. */
	landscape?: boolean;
}

export function Ipod3DTouchControls({ apiRef, landscape = false }: Ipod3DTouchControlsProps) {
	const padRef = useRef<HTMLDivElement>(null);
	const [livePose, setLivePose] = useState<StudioPose | null>(null);

	// Reflect the live (eased) pose so the gizmo can highlight the matching view.
	// Polled, not per-rAF — the widget only needs a coarse "which view are we near".
	useEffect(() => {
		const id = window.setInterval(() => {
			setLivePose(apiRef.current?.getCameraPose() ?? null);
		}, 150);
		return () => window.clearInterval(id);
	}, [apiRef]);

	// Active gesture state. Refs (not state) so a fast gesture never re-renders.
	const pointers = useRef(new Map<number, { x: number; y: number }>());
	// Orbit accumulates from the goal captured at gesture START (never re-reads the
	// eased mid-flight pose), so fine orbit cannot drift while the rig is still easing.
	const orbitStart = useRef<{ azimuth: number; elevation: number; x: number; y: number } | null>(null);
	const pinchStart = useRef<{ dist: number; reach: number } | null>(null);

	const beginOrbit = () => {
		const pose = apiRef.current?.getCameraPose();
		const pts = [...pointers.current.values()];
		if (!pose || pts.length !== 1) {
			orbitStart.current = null;
			return;
		}
		orbitStart.current = { azimuth: pose.azimuth, elevation: pose.elevation, x: pts[0].x, y: pts[0].y };
	};

	const beginPinch = () => {
		const pts = [...pointers.current.values()];
		if (pts.length < 2) return;
		const pose = apiRef.current?.getCameraPose();
		const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
		pinchStart.current = { dist, reach: pose?.reach ?? REACH_RANGE[0] };
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		padRef.current?.setPointerCapture(e.pointerId);
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
		// Disambiguate purely by active-pointer count: 1 = orbit, ≥2 = pinch.
		if (pointers.current.size >= 2) {
			orbitStart.current = null;
			beginPinch();
		} else {
			pinchStart.current = null;
			beginOrbit();
		}
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!pointers.current.has(e.pointerId)) return;
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
		const api = apiRef.current;
		if (!api) return;

		if (pointers.current.size >= 2 && pinchStart.current) {
			const pts = [...pointers.current.values()];
			const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
			// Fingers apart (dist↑) → reach↓ → zoom in. The rig clamps to REACH_RANGE.
			api.setCameraGoal({ reach: pinchStart.current.reach * (pinchStart.current.dist / dist) });
			return;
		}

		const start = orbitStart.current;
		if (start) {
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			api.setCameraGoal({
				azimuth: start.azimuth + dx * ORBIT_DEG_PER_PX,
				// Drag up → raise elevation. The rig clamps to ELEVATION_RANGE.
				elevation: start.elevation - dy * ORBIT_DEG_PER_PX,
			});
		}
	};

	const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
		pointers.current.delete(e.pointerId);
		padRef.current?.releasePointerCapture?.(e.pointerId);
		pinchStart.current = null;
		// Dropping from pinch back to one finger resumes orbit from the new anchor.
		if (pointers.current.size === 1) beginOrbit();
		else orbitStart.current = null;
	};

	const snapTo = (view: CanonicalView) => {
		apiRef.current?.setCameraGoal({ azimuth: view.azimuth, elevation: view.elevation });
	};

	const activeViewId =
		livePose &&
		VIEWS.find(
			(v) =>
				Math.abs(angleDelta(v.azimuth, livePose.azimuth)) < 8 &&
				Math.abs(v.elevation - livePose.elevation) < 8,
		)?.id;

	return (
		<div
			className={`pointer-events-none fixed z-20 flex max-w-full gap-2 lg:hidden ${
				landscape
					? "bottom-3 right-3 flex-row items-end"
					: "inset-x-0 bottom-[84px] flex-col items-center px-4"
			}`}
			style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
		>
			{/* Orientation gizmo — tap a face to snap to that canonical view. */}
			<div className="pointer-events-auto grid grid-cols-6 gap-1 rounded-full border border-black/10 bg-white/85 p-1 backdrop-blur-md">
				{VIEWS.map((view) => (
					<button
						key={view.id}
						type="button"
						onClick={() => snapTo(view)}
						aria-pressed={activeViewId === view.id}
						aria-label={`Snap camera to ${view.label} view`}
						className={`h-8 min-w-8 rounded-full px-2 text-[11px] font-medium tabular-nums transition-colors ${
							activeViewId === view.id
								? "bg-black text-white"
								: "text-black/55 hover:text-black"
						}`}
					>
						{view.label}
					</button>
				))}
			</div>

			{/* Orbit-pad — relative drag to orbit, two-finger pinch to zoom (reach). */}
			<div
				ref={padRef}
				role="application"
				aria-label="Camera orbit pad — drag to orbit, pinch to zoom"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerEnd}
				onPointerCancel={handlePointerEnd}
				className="pointer-events-auto relative h-24 w-40 touch-none rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md"
			>
				{/* A faint crosshair + center dot so the pad reads as a control surface. */}
				<span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 bg-black/10" />
				<span className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-black/10" />
				<span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30" />
				<span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium uppercase tracking-[0.16em] text-black/25">
					orbit · pinch
				</span>
			</div>
		</div>
	);
}
