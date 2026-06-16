"use client";

import { type Dispatch } from "react";

import type {
	IpodInteractionModel,
	IpodInteractionState,
	IpodStudioState,
} from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * The studio/interaction cockpit for /3d — the controls that the 2D workbench had but the
 * 3D focus view was missing, which is why composing in 3D felt "stuck": you couldn't change
 * how the on-device screen behaves, or lock it into a clean state for a shot.
 *
 * Three controls, one card (same control-strip idiom as the colour/lighting cockpits):
 *   • Interaction mode — Direct Edit ↔ iPod OS ↔ Original (the exact 2D models, same reducer
 *     action `SET_INTERACTION_MODEL`, so 2D and 3D stay one source of truth).
 *   • Lock — freeze inline editing into a clean, screenshot/export-ready presentation state
 *     (distinct from the camera lock, which freezes the angle).
 *   • Marquee — run the scrolling-text engine on overflowing track titles in the live 3D view.
 */

interface Ipod3DStudioCockpitProps {
	/** Position in the control surface, rendered as the header's number chip. */
	index: number;
	interaction: IpodInteractionState;
	studio: IpodStudioState;
	dispatch: Dispatch<IpodWorkbenchAction>;
	/** On-canvas mobile touch camera controls (gizmo + orbit-pad + pinch). */
	touchControls: boolean;
	onToggleTouchControls: () => void;
}

const MODES: readonly { id: IpodInteractionModel; label: string }[] = [
	{ id: "direct", label: "Direct" },
	{ id: "ipod-os", label: "iPod OS" },
	{ id: "ipod-os-original", label: "Original" },
] as const;

export function Ipod3DStudioCockpit({
	index,
	interaction,
	studio,
	dispatch,
	touchControls,
	onToggleTouchControls,
}: Ipod3DStudioCockpitProps) {
	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader index={index} title="Studio" />
			{/* Interaction mode — segmented, mirrors the 2D workbench */}
			<div className="border-b border-black/[0.06] px-3.5 pb-3 pt-3">
				<Label>Interaction</Label>
				<div className="mt-2 flex gap-1">
					{MODES.map((mode) => {
						const active = interaction.interactionModel === mode.id;
						return (
							<button
								key={mode.id}
								type="button"
								onClick={() => dispatch({ type: "SET_INTERACTION_MODEL", payload: mode.id })}
								aria-pressed={active}
								className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
									active
										? "border-black/80 text-black"
										: "border-black/10 text-black/55 hover:border-black/25 hover:text-black/80"
								}`}
							>
								{mode.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Lock — freeze editing into a clean presentation state */}
			<ToggleRow
				label="Lock editing"
				hint="Clean state for screenshots & export"
				on={studio.interactionLocked}
				onToggle={() => dispatch({ type: "TOGGLE_INTERACTION_LOCK" })}
			/>

			{/* Marquee — the scrolling track-title animation */}
			<ToggleRow
				label="Marquee"
				hint="Scroll overflowing track titles"
				on={studio.marquee}
				onToggle={() => dispatch({ type: "TOGGLE_MARQUEE" })}
			/>

			{/* Ports — headphone jack, hold switch & 30-pin dock (evaluating the look) */}
			<ToggleRow
				label="Edge ports"
				hint="Jack, hold switch & 30-pin dock"
				on={studio.showPorts}
				onToggle={() => dispatch({ type: "TOGGLE_SHOW_PORTS" })}
			/>

			{/* Touch controls — the mobile on-canvas gizmo + orbit-pad + pinch */}
			<ToggleRow
				label="Touch controls"
				hint="On-screen orbit, snap & pinch (mobile)"
				on={touchControls}
				onToggle={onToggleTouchControls}
			/>

			{/* Layout tool — dashed bounding boxes + drag handles to reposition Now Playing
			    elements (dev only). Off by default so the boxes never leak into the live
			    view or an export; with it off, every mode uses plain tap-to-edit text. */}
			{process.env.NODE_ENV !== "production" && (
				<ToggleRow
					label="Layout boxes"
					hint="Drag to reposition · dev only"
					on={studio.layoutMode}
					onToggle={() => dispatch({ type: "TOGGLE_LAYOUT_MODE" })}
				/>
			)}

			{/* Theatre.js timeline — camera-keyframe authoring overlay (dev only). Off by
			    default so its full-screen editor never clutters the view or an export. */}
			{process.env.NODE_ENV !== "production" && (
				<ToggleRow
					label="Theatre timeline"
					hint="Camera keyframe editor · dev only"
					on={studio.theatreStudio}
					onToggle={() => dispatch({ type: "TOGGLE_THEATRE_STUDIO" })}
				/>
			)}
		</div>
	);
}

function ToggleRow({
	label,
	hint,
	on,
	onToggle,
}: {
	label: string;
	hint: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-pressed={on}
			className="flex w-full items-center justify-between border-b border-black/[0.05] px-3.5 py-2.5 text-left last:border-b-0"
		>
			<span className="flex flex-col">
				<span className="text-[11px] font-medium text-black/70">{label}</span>
				<span className="text-[9px] text-black/30">{hint}</span>
			</span>
			{/* A minimal iOS-style switch in the cockpit's monochrome palette. */}
			<span
				className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors duration-300 ${
					on ? "bg-black" : "bg-black/15"
				}`}
			>
				<span
					className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-300 ${
						on ? "translate-x-[14px]" : "translate-x-[2px]"
					}`}
				/>
			</span>
		</button>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
			{children}
		</span>
	);
}
