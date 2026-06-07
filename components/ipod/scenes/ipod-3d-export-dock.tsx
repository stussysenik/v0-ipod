"use client";

import type { ExportFraming } from "@/components/three/three-d-ipod";
import { CAMERA_MOVES, type CameraMove } from "@/lib/studio-camera";

/**
 * Export dock for the /3d now-playing stage.
 *
 * Same design language as the color cockpit: one white card, a single hairline,
 * black type, no shadow stack. Two stills (high-res PNG) — a dead-on Front fidelity
 * shot and a composed 3/4 Hero shot — plus a clip (H.264/MP4) per camera move. Every
 * export bakes the live now-playing screen onto the device; the Hero still and the
 * clips fly the pose you've composed/locked in the camera cockpit, so what you export
 * is the product as framed.
 *
 * The component is intentionally dumb: it renders state and forwards intent. The
 * stage owns the capture handle and the busy/idle machine.
 */

export type Ipod3DExportState = "idle" | `png:${ExportFraming}` | `clip:${CameraMove}`;

interface Ipod3DExportDockProps {
	exportState: Ipod3DExportState;
	onExportPng: (framing: ExportFraming) => void;
	onExportClip: (move: CameraMove) => void;
}

export function Ipod3DExportDock({
	exportState,
	onExportPng,
	onExportClip,
}: Ipod3DExportDockProps) {
	const busy = exportState !== "idle";

	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<div className="border-b border-black/[0.06] px-3.5 pb-2.5 pt-3">
				<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
					Export
				</span>
			</div>

			<div className="flex flex-col gap-1.5 px-3.5 py-3">
				<DockButton
					busy={exportState === "png:hero"}
					disabled={busy}
					hint="3/4 · 2160×3840"
					label="Still · Hero"
					onClick={() => onExportPng("hero")}
				/>
				<DockButton
					busy={exportState === "png:front"}
					disabled={busy}
					hint="FRONT · 2160×3840"
					label="Still · Front"
					onClick={() => onExportPng("front")}
				/>
				{CAMERA_MOVES.map((m) => (
					<DockButton
						key={m.id}
						busy={exportState === `clip:${m.id}`}
						disabled={busy}
						hint={m.hint}
						label={`Clip · ${m.label}`}
						onClick={() => onExportClip(m.id)}
					/>
				))}
			</div>

			<p className="border-t border-black/[0.06] px-3.5 py-2 text-[10px] leading-snug text-black/35">
				Vertical 9:16 for IG. Hero + clips fly the composed/locked pose; Front is
				the dead-on fidelity shot. The now-playing screen is baked on at capture.
			</p>
		</div>
	);
}

function DockButton({
	label,
	hint,
	busy,
	disabled,
	onClick,
}: {
	label: string;
	hint: string;
	busy: boolean;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
				busy
					? "border-black/80 text-black"
					: "border-black/10 text-black/70 hover:border-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-black/70"
			}`}
		>
			<span className="text-[12px] font-medium">{busy ? "Capturing…" : label}</span>
			<span className="font-mono text-[10px] uppercase tracking-tight text-black/35">
				{hint}
			</span>
		</button>
	);
}
