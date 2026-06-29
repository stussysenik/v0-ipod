"use client";

import { useEffect, useRef, useState } from "react";

import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { haptic } from "@/lib/haptics";
import type { StudioPose } from "@/lib/studio-camera";

/**
 * On-canvas camera snapping for /3d on mobile — a 3D-modeling-style orientation
 * gizmo. Tap a face to fly the camera to that canonical product view.
 *
 * Free orbit + pinch-zoom are handled natively on the canvas itself (two fingers =
 * camera, see OrbitRig). This gizmo only adds what a raw drag can't: *snapping* to
 * the six canonical views. It is a pure driver of the existing `OrbitRig` — it reads
 * `getCameraPose()` and writes `setCameraGoal()` through the public `ThreeDIpodHandle`,
 * never instantiating a second camera system, so the rig's clamping stays the single
 * source of truth.
 *
 * Because it is DOM floating above the WebGL canvas (and exports render the scene to
 * an offscreen target, never the DOM), it is inherently absent from every export.
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

/** Shortest signed angular distance a→b in degrees, in [-180, 180]. */
function angleDelta(a: number, b: number): number {
	const d = (((b - a) % 360) + 540) % 360;
	return d - 180;
}

interface Ipod3DTouchControlsProps {
	apiRef: React.MutableRefObject<ThreeDIpodHandle | null>;
	/** Short-landscape phones: dock the gizmo to the bottom-right so the centered model
	 *  and the bottom-left studio-shots bar stay clear. */
	landscape?: boolean;
}

export function Ipod3DTouchControls({ apiRef, landscape = false }: Ipod3DTouchControlsProps) {
	const [livePose, setLivePose] = useState<StudioPose | null>(null);

	// Reflect the live (eased) pose so the gizmo can highlight the matching view.
	// Polled, not per-rAF — the widget only needs a coarse "which view are we near".
	useEffect(() => {
		const id = window.setInterval(() => {
			setLivePose(apiRef.current?.getCameraPose() ?? null);
		}, 150);
		return () => window.clearInterval(id);
	}, [apiRef]);

	// A snap fires its own "thunk"; suppress the orbit detent briefly after so a tap
	// doesn't double-buzz when the eased pose then crosses into that view's window.
	const lastSnapAt = useRef(0);

	const snapTo = (view: CanonicalView) => {
		lastSnapAt.current = Date.now();
		haptic("snap");
		apiRef.current?.setCameraGoal({ azimuth: view.azimuth, elevation: view.elevation });
	};

	const activeViewId =
		livePose &&
		VIEWS.find(
			(v) =>
				Math.abs(angleDelta(v.azimuth, livePose.azimuth)) < 8 &&
				Math.abs(v.elevation - livePose.elevation) < 8,
		)?.id;

	// Detent: a light tick the moment a free orbit settles onto a canonical view.
	const prevView = useRef<string | null | undefined>(undefined);
	useEffect(() => {
		const entered = activeViewId && activeViewId !== prevView.current;
		if (entered && Date.now() - lastSnapAt.current > 450) haptic("tick");
		prevView.current = activeViewId;
	}, [activeViewId]);

	return (
		<div
			className={`pointer-events-none fixed z-20 flex max-w-full lg:hidden ${
				landscape ? "bottom-3 right-3" : "inset-x-0 bottom-[84px] justify-center px-4"
			}`}
			style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
		>
			{/* Orientation gizmo — tap a face to snap to that canonical view. */}
			<div className="pointer-events-auto flex gap-1 rounded-full border border-black/10 bg-white/85 p-1 shadow-sm backdrop-blur-md">
				{VIEWS.map((view) => (
					<button
						key={view.id}
						type="button"
						onClick={() => snapTo(view)}
						aria-pressed={activeViewId === view.id}
						aria-label={`Snap camera to ${view.label} view`}
						className={`grid h-11 min-w-11 place-items-center rounded-full px-2 text-[13px] font-medium tabular-nums transition-colors ${
							activeViewId === view.id ? "bg-black text-white" : "text-black/55 active:bg-black/5"
						}`}
					>
						{view.label}
					</button>
				))}
			</div>
		</div>
	);
}
