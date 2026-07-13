"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type Dispatch } from "react";

import { StudioButton, StudioChip, StudioControlScope } from "@/components/ui/studio-controls";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { haptic } from "@/lib/haptics";
import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import type { IpodPresentationState } from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
import {
	matchNamedPose,
	NAMED_POSES,
	type NamedPose,
	type PoseFraming,
	type ShotLook,
	type StudioShot,
} from "@/lib/studio-camera-poses";

/**
 * The /3d bottom bar — the *only* quick camera control, on every viewport.
 *
 *   • Named poses — ¾ / Front / Back / Top. Each carries its own framing, so there is
 *     one "Front" on the page and it means one thing. The active pose is derived from
 *     where the camera actually is, so free-orbiting away honestly deselects.
 *   • Studio shots — a composed camera pose AND the product look (case / wheel / center
 *     / back / edge / bezel / stage) bundled into one recallable swatch. Tap to fly the
 *     camera back and repaint the body in a single gesture; right-click / long-press to drop it.
 *
 * The cockpit (05) is the advanced numeric editor of this same pose state — not a third
 * camera concept. This bar writes goals through the public `ThreeDIpodHandle` only.
 */

/** How a pose reaches the camera: the stage applies framing, then the angles. */
export interface PoseRequest {
	framing: PoseFraming;
	azimuth: number;
	elevation: number;
	/** Omitted by a named pose — a pose re-aims, it does not dolly. */
	reach?: number;
}

interface Ipod3DCameraBarProps {
	apiRef: React.MutableRefObject<ThreeDIpodHandle | null>;
	/** Fly the camera to a pose (framing + angles). Owned by the stage. */
	onPose: (request: PoseRequest) => void;
	/** The framing a newly saved shot is composed under. */
	framing: PoseFraming;
	shots: StudioShot[];
	onShotsChange: (shots: StudioShot[]) => void;
	presentation: IpodPresentationState;
	dispatch: Dispatch<IpodWorkbenchAction>;
	onNotice?: (message: string) => void;
	/** Short-landscape phones: dock bottom-left so the bar never crosses the model. */
	landscape?: boolean;
}

export function Ipod3DCameraBar({
	apiRef,
	onPose,
	framing,
	shots,
	onShotsChange,
	presentation,
	dispatch,
	onNotice,
	landscape = false,
}: Ipod3DCameraBarProps) {
	// Reflect the live (eased) pose so the bar can highlight the pose we're actually on.
	// Polled, not per-rAF — the bar only needs a coarse "which pose are we near".
	const [activePoseId, setActivePoseId] = useState<string | null>(null);
	useEffect(() => {
		const id = window.setInterval(() => {
			setActivePoseId(matchNamedPose(apiRef.current?.getCameraPose() ?? null)?.id ?? null);
		}, 150);
		return () => window.clearInterval(id);
	}, [apiRef]);

	const counter = useRef(1);
	useEffect(() => {
		counter.current = shots.length + 1;
	}, [shots.length]);

	const selectPose = useCallback(
		(pose: NamedPose) => {
			haptic("snap");
			onPose({ framing: pose.framing, azimuth: pose.azimuth, elevation: pose.elevation });
		},
		[onPose],
	);

	const saveShot = useCallback(() => {
		const pose = apiRef.current?.getCameraPose();
		if (!pose) return;
		const look: ShotLook = {
			skinColor: presentation.skinColor,
			ringColor: presentation.ringColor,
			centerColor: presentation.centerColor,
			backColor: presentation.backColor,
			edgeColor: presentation.edgeColor,
			bezelColor: presentation.bezelColor,
			bgColor: presentation.bgColor,
		};
		onShotsChange([...shots, { id: `S${counter.current}`, pose, framing, look }]);
		haptic("select");
		onNotice?.("Studio shot saved");
	}, [apiRef, framing, onShotsChange, presentation, shots, onNotice]);

	const recallShot = useCallback(
		(shot: StudioShot) => {
			haptic("select");
			// Repaint the body, then fly the camera. Colors are React state; the pose eases
			// through the orbit rig — both land together as one composed look.
			dispatch({ type: "SET_SKIN_COLOR", payload: shot.look.skinColor });
			dispatch({ type: "SET_RING_COLOR", payload: shot.look.ringColor });
			dispatch({ type: "SET_CENTER_COLOR", payload: shot.look.centerColor });
			dispatch({ type: "SET_BACK_COLOR", payload: shot.look.backColor });
			dispatch({ type: "SET_EDGE_COLOR", payload: shot.look.edgeColor });
			dispatch({ type: "SET_BEZEL_COLOR", payload: shot.look.bezelColor });
			dispatch({ type: "SET_BG_COLOR", payload: shot.look.bgColor });
			onPose({
				framing: shot.framing,
				azimuth: shot.pose.azimuth,
				elevation: shot.pose.elevation,
				reach: shot.pose.reach,
			});
		},
		[dispatch, onPose],
	);

	const removeShot = useCallback(
		(id: string) => onShotsChange(shots.filter((s) => s.id !== id)),
		[onShotsChange, shots],
	);

	// The bar floats over a user-colored stage, so its surface/label/accent are solved
	// against the active stage color for guaranteed contrast on any background.
	const surfaceStyle: CSSProperties = {
		background: "var(--studio-surface)",
		borderColor: "var(--studio-hairline)",
		paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
	};

	return (
		<StudioControlScope
			stageBackground={presentation.bgColor}
			style={surfaceStyle}
			className={`pointer-events-auto fixed z-30 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border p-1 shadow-sm backdrop-blur-md ${
				landscape ? "bottom-3 left-3" : "bottom-6 left-1/2 -translate-x-1/2"
			}`}
		>
			{/* Named poses — angle *and* framing in one control. */}
			{NAMED_POSES.map((pose) => (
				<StudioButton
					key={pose.id}
					isActive={activePoseId === pose.id}
					onPress={() => selectPose(pose)}
					aria-label={`Camera pose: ${pose.label}`}
					className="shrink-0 rounded-full"
				>
					{pose.label}
				</StudioButton>
			))}

			{/* Saved studio shots — ARCHIVED behind SHOW_CUSTOM_CAMERA_POSES. A user-saved
			    point is an arbitrary pose whose framing isn't guaranteed to fit the viewport
			    it's recalled on; the bar ships the six named angles, which are. */}
			{FEATURE_FLAGS.SHOW_CUSTOM_CAMERA_POSES && (
				<>
					{shots.length > 0 && (
						<span
							className="mx-0.5 h-4 w-px shrink-0"
							style={{ background: "var(--studio-hairline)" }}
							aria-hidden
						/>
					)}

					{shots.map((shot) => (
						<span
							key={shot.id}
							className="flex shrink-0 items-center"
							onContextMenu={(e) => {
								e.preventDefault();
								removeShot(shot.id);
							}}
						>
							<StudioChip
								color={shot.look.skinColor}
								isSelected={false}
								onPress={() => recallShot(shot)}
								label={`Recall studio shot ${shot.id} — azimuth ${shot.pose.azimuth.toFixed(0)}°, elevation ${shot.pose.elevation.toFixed(0)}° (right-click to remove)`}
							/>
						</span>
					))}

					<StudioButton
						onPress={saveShot}
						aria-label="Save the current camera pose and finish as a studio shot"
						className="shrink-0 rounded-full"
					>
						＋ Shot
					</StudioButton>
				</>
			)}
		</StudioControlScope>
	);
}
