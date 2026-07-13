"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { type StudioPose } from "@/lib/studio-camera";
import type { SavedPose } from "@/lib/studio-camera-poses";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * The camera cockpit for the /3d now-playing stage — a designer-facing readout of
 * the live camera in *studio coordinates* (the language a DP programs a motion-
 * control rig in), matching the color cockpit's monochrome hairline look.
 *
 *   • Azimuth   — the plan-view dial ("from the top"). 0° = dead front.
 *   • Elevation — height angle above the turntable. + cranes down onto it.
 *   • Reach     — distance = apparent size (dolly).
 *
 * Direct manipulation first: you compose by dragging the canvas (the orbit rig
 * already handles that) and this panel mirrors the pose live; the ◄► steppers are
 * for precise nudges. Save a pose to recall it one tap later. Whatever's framed
 * here is the hero the Robo/Orbit clip exports anchor on.
 *
 * The cockpit is the *advanced altitude* on the same pose state the bottom camera bar
 * drives — not a third camera concept. It owns no persistence of its own: the stage
 * holds the one camera store and hands the saved poses down.
 */

interface AxisDef {
	key: "azimuth" | "elevation" | "reach";
	label: string;
	step: number;
	unit: string;
	digits: number;
}

const AXES: readonly AxisDef[] = [
	{ key: "azimuth", label: "Azimuth", step: 3, unit: "°", digits: 0 },
	{ key: "elevation", label: "Elevation", step: 2, unit: "°", digits: 0 },
	{ key: "reach", label: "Reach", step: 0.5, unit: "", digits: 1 },
] as const;

interface Ipod3DCameraCockpitProps {
	/** Position in the control surface, rendered as the header's number chip. */
	index: number;
	apiRef: React.MutableRefObject<ThreeDIpodHandle | null>;
	/** When true, the perspective is locked — drag/wheel are frozen and recompose is off. */
	locked?: boolean;
	/** Toggle the locked perspective (persists the pose; drives Hero/clip exports). */
	onToggleLock?: () => void;
	/** Snap the camera back to the default "home" framing (the origin view). */
	onResetCamera?: () => void;
	/** Whether the world-origin gizmo is showing. */
	showOrigin?: boolean;
	/** Toggle the origin gizmo (compose-time aid; never baked into exports). */
	onToggleOrigin?: () => void;
	/** Saved numeric poses — owned by the stage's camera store, not by this panel. */
	presets: SavedPose[];
	onPresetsChange: (presets: SavedPose[]) => void;
}

export function Ipod3DCameraCockpit({
	index,
	apiRef,
	locked = false,
	onToggleLock,
	onResetCamera,
	showOrigin = false,
	onToggleOrigin,
	presets,
	onPresetsChange,
}: Ipod3DCameraCockpitProps) {
	const [pose, setPose] = useState<StudioPose | null>(null);
	const counter = useRef(1);
	useEffect(() => {
		counter.current = presets.length + 1;
	}, [presets.length]);

	// Mirror the live camera pose. The rig drives the camera every frame; we poll a
	// few times a second for the readout rather than re-rendering on every rAF.
	useEffect(() => {
		const id = window.setInterval(() => {
			const next = apiRef.current?.getCameraPose() ?? null;
			if (next) setPose(next);
		}, 90);
		return () => window.clearInterval(id);
	}, [apiRef]);

	const nudge = useCallback(
		(key: AxisDef["key"], delta: number) => {
			const current = apiRef.current?.getCameraPose();
			if (!current) return;
			apiRef.current?.setCameraGoal({ [key]: current[key] + delta });
		},
		[apiRef],
	);

	const savePose = useCallback(() => {
		const current = apiRef.current?.getCameraPose();
		if (!current) return;
		onPresetsChange([...presets, { id: `P${counter.current}`, pose: current }]);
	}, [apiRef, onPresetsChange, presets]);

	const recallPose = useCallback(
		(p: StudioPose) => {
			apiRef.current?.setCameraGoal({
				azimuth: p.azimuth,
				elevation: p.elevation,
				reach: p.reach,
			});
		},
		[apiRef],
	);

	const removePose = useCallback(
		(id: string) => onPresetsChange(presets.filter((p) => p.id !== id)),
		[onPresetsChange, presets],
	);

	const fmt = (axis: AxisDef) =>
		pose ? `${pose[axis.key].toFixed(axis.digits)}${axis.unit}` : "—";

	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader
				index={index}
				title="Camera"
				right={
					onToggleLock ? (
						<button
							type="button"
							onClick={onToggleLock}
							aria-pressed={locked}
							title={locked ? "Unlock to recompose" : "Lock this perspective for exports"}
							className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] transition-colors ${
								locked
									? "border-black/80 bg-black text-white"
									: "border-black/10 text-black/40 hover:border-black/40 hover:text-black"
							}`}
						>
							<span aria-hidden>{locked ? "🔒" : "🔓"}</span>
							{locked ? "Locked" : "Lock"}
						</button>
					) : (
						<span className="text-[9px] font-medium text-black/25">drag to compose</span>
					)
				}
			/>

			{/* Studio-coordinate axes */}
			<div className="px-3.5 py-2">
				{AXES.map((axis) => (
					<div key={axis.key} className="flex h-8 items-center justify-between">
						<span className="text-[11px] font-medium text-black/55">{axis.label}</span>
						<span className="flex items-center gap-2">
							<span className="w-12 text-right font-mono text-[10px] uppercase tracking-tight text-black/45">
								{fmt(axis)}
							</span>
							<Stepper disabled={locked} label={`${axis.label} down`} onClick={() => nudge(axis.key, -axis.step)}>
								◄
							</Stepper>
							<Stepper disabled={locked} label={`${axis.label} up`} onClick={() => nudge(axis.key, axis.step)}>
								►
							</Stepper>
						</span>
					</div>
				))}
			</div>

			{/* Home + origin — reset the angles to the default framing, and a compose-time
			   gizmo to see world centre. Both sit right under the axes (the "angles"). */}
			<div className="flex items-center gap-2 border-t border-black/[0.06] px-3.5 py-2.5">
				<button
					type="button"
					onClick={onResetCamera}
					disabled={locked}
					title="Snap the camera back to the default framing"
					className="flex items-center gap-1 text-[11px] font-medium text-black/55 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black/55"
				>
					<span aria-hidden>⌂</span> Home
				</button>
				<button
					type="button"
					onClick={onToggleOrigin}
					aria-pressed={showOrigin}
					title="Show a centre crosshair to compose against the origin"
					className={`ml-auto flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] transition-colors ${
						showOrigin
							? "border-black/80 bg-black text-white"
							: "border-black/10 text-black/40 hover:border-black/40 hover:text-black"
					}`}
				>
					<span aria-hidden>✛</span> Origin
				</button>
			</div>

			{/* Saved poses — ARCHIVED behind SHOW_CUSTOM_CAMERA_POSES (spec: camera-control-truth).
			    The camera ships a closed set of six named angle presets; an arbitrary user-saved
			    point has no framing guarantee on the viewport it's recalled on. Code path intact. */}
			{FEATURE_FLAGS.SHOW_CUSTOM_CAMERA_POSES && (
			<div className="flex items-center gap-2 border-t border-black/[0.06] px-3.5 py-2.5">
				<button
					type="button"
					onClick={savePose}
					disabled={locked}
					className="text-[11px] font-medium text-black/55 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black/55"
				>
					Save pose
				</button>
				{presets.length > 0 && (
					<div className="flex flex-1 flex-wrap justify-end gap-1">
						{presets.map((p) => (
							<button
								key={p.id}
								type="button"
								title={`az ${p.pose.azimuth.toFixed(0)}° · el ${p.pose.elevation.toFixed(0)}° · r ${p.pose.reach.toFixed(1)}`}
								onClick={() => recallPose(p.pose)}
								onContextMenu={(e) => {
									e.preventDefault();
									removePose(p.id);
								}}
								className="rounded-md border border-black/10 px-1.5 py-0.5 font-mono text-[9px] text-black/55 transition-colors hover:border-black/40 hover:text-black"
							>
								{p.id}
							</button>
						))}
					</div>
				)}
			</div>
			)}
		</div>
	);
}

function Stepper({
	children,
	label,
	onClick,
	disabled = false,
}: {
	children: React.ReactNode;
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			disabled={disabled}
			className="grid h-5 w-5 place-items-center rounded-md border border-black/10 text-[9px] text-black/45 transition-colors hover:border-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/10 disabled:hover:text-black/45"
		>
			{children}
		</button>
	);
}
