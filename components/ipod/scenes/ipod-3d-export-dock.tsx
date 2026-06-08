"use client";

import { useState } from "react";

import type { ExportFraming } from "@/components/three/three-d-ipod";
import { CAMERA_MOVES, type CameraMove, cyclesForDuration, type LoopStyle } from "@/lib/studio-camera";

/**
 * Export dock for the /3d now-playing stage.
 *
 * Same design language as the color cockpit: one white card, a single hairline,
 * black type, no shadow stack. Two stills (high-res PNG) — a dead-on Front fidelity
 * shot and a composed 3/4 Hero shot — plus a single clip (H.264/MP4) of whichever
 * camera move you've selected. Every export bakes the live now-playing screen onto
 * the device; the Hero still and the clip fly the pose you've composed/locked in the
 * camera cockpit, so what you export is the product as framed.
 *
 * A playhead sits above the export buttons: pick a move, scrub or hit play, and the
 * device flies that move LIVE in the viewport using the exact same math the clip
 * exports — true WYSIWYG, so you dial the loop in before you ever render it.
 *
 * Reaches parity with the 2D export model: pick an aspect (Story 9:16 / Square 1:1 /
 * Portrait 4:5), a quality (Standard / Pro), and a clip length up to 60s — the same
 * spacious, preset-driven control surface, just feeding the 3D capture pipeline.
 */

export type ExportAspect = "story" | "square" | "portrait";
export type ExportQuality = "standard" | "pro";

export interface ClipExportOptions {
	durationSec: number;
	quality: ExportQuality;
	aspect: ExportAspect;
	/** Cadence multiplier (1 = natural). */
	speed: number;
	/** loop / boomerang / hold — `hold` exports the composed angle with no motion. */
	loop: LoopStyle;
}

const LOOP_STYLES: ReadonlyArray<{ id: LoopStyle; label: string; hint: string }> = [
	{ id: "loop", label: "Loop", hint: "one-way seamless" },
	{ id: "boomerang", label: "Boomerang", hint: "forward + back" },
	{ id: "hold", label: "Hold", hint: "no motion" },
];

/** Speed multiplier stops — sub-1 slows the cadence, >1 quickens it. */
const SPEED_STOPS = [0.5, 0.75, 1, 1.5, 2] as const;
export interface StillExportOptions {
	aspect: ExportAspect;
}

export type Ipod3DExportState = "idle" | `png:${ExportFraming}` | `clip:${CameraMove}`;

const ASPECTS: ReadonlyArray<{ id: ExportAspect; label: string; hint: string }> = [
	{ id: "story", label: "9:16", hint: "Story" },
	{ id: "portrait", label: "4:5", hint: "Portrait" },
	{ id: "square", label: "1:1", hint: "Square" },
];

const MIN_DURATION = 2;
const MAX_DURATION = 60;

interface Ipod3DExportDockProps {
	exportState: Ipod3DExportState;
	/** Clip length in seconds — lifted to the stage so the playhead cadence matches. */
	durationSec: number;
	onDurationChange: (sec: number) => void;
	/** Playhead — selected move + live transport (play/scrub), driven in the stage. */
	previewMove: CameraMove;
	previewPlaying: boolean;
	/** Live playhead position over the full clip, t ∈ [0,1). */
	previewT: number;
	/** Cadence multiplier (1 = natural) — drives preview + export identically. */
	speed: number;
	onSpeedChange: (speed: number) => void;
	/** loop / boomerang / hold — drives preview + export identically. */
	loopStyle: LoopStyle;
	onLoopStyleChange: (loop: LoopStyle) => void;
	onPreviewMoveChange: (move: CameraMove) => void;
	onTogglePlay: () => void;
	onScrub: (t: number) => void;
	onResetPlayhead: () => void;
	onExportPng: (framing: ExportFraming, options: StillExportOptions) => void;
	onExportClip: (move: CameraMove, options: ClipExportOptions) => void;
}

export function Ipod3DExportDock({
	exportState,
	durationSec,
	onDurationChange,
	previewMove,
	previewPlaying,
	previewT,
	speed,
	onSpeedChange,
	loopStyle,
	onLoopStyleChange,
	onPreviewMoveChange,
	onTogglePlay,
	onScrub,
	onResetPlayhead,
	onExportPng,
	onExportClip,
}: Ipod3DExportDockProps) {
	const busy = exportState !== "idle";
	const [aspect, setAspect] = useState<ExportAspect>("story");
	const [quality, setQuality] = useState<ExportQuality>("standard");

	const still: StillExportOptions = { aspect };
	const clip: ClipExportOptions = { durationSec, quality, aspect, speed, loop: loopStyle };

	const hold = loopStyle === "hold";
	const moveSpec = CAMERA_MOVES.find((m) => m.id === previewMove) ?? CAMERA_MOVES[0];
	const cycles = cyclesForDuration(previewMove, durationSec, speed, loopStyle);
	const elapsed = previewT * durationSec;
	// What the clip button promises: a held angle, or N× of the selected move.
	const clipHint = hold ? "no motion" : `${cycles}× · ${moveSpec.label}`;

	return (
		<div className="pointer-events-auto w-full select-none rounded-[16px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<div className="border-b border-black/[0.06] px-4 pb-3 pt-3.5">
				<Label>Export</Label>
			</div>

			{/* Presets — aspect · quality · length (spacious, tactile controls) */}
			<div className="flex flex-col gap-3 border-b border-black/[0.06] px-4 py-3.5">
				<Row label="Aspect">
					<Segmented
						options={ASPECTS.map((a) => ({ id: a.id, label: a.label }))}
						value={aspect}
						onChange={(v) => setAspect(v as ExportAspect)}
						disabled={busy}
					/>
				</Row>
				<Row label="Quality">
					<Segmented
						options={[
							{ id: "standard", label: "Standard" },
							{ id: "pro", label: "Pro" },
						]}
						value={quality}
						onChange={(v) => setQuality(v as ExportQuality)}
						disabled={busy}
					/>
				</Row>
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<Label>Clip length</Label>
						<span className="font-mono text-[12px] tabular-nums text-black/60">
							{durationSec}s
						</span>
					</div>
					<input
						type="range"
						min={MIN_DURATION}
						max={MAX_DURATION}
						step={1}
						value={durationSec}
						disabled={busy}
						onChange={(e) => onDurationChange(Number(e.target.value))}
						className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-black disabled:cursor-not-allowed disabled:opacity-40"
					/>
				</div>
			</div>

			{/*
			 * Preview — the live transport, set off from the export settings above by
			 * its own labelled header so it reads as "what you dial in" vs. "how it
			 * renders." Pick a move + style, scrub/play it LIVE, then export the exact
			 * loop you see (true WYSIWYG).
			 */}
			<div className="flex flex-col gap-2.5 border-b border-black/[0.06] px-4 py-3.5">
				<div className="flex items-center justify-between">
					<Label>Preview</Label>
					<span className="font-mono text-[10px] uppercase tracking-tight text-black/35">
						{hold ? "still" : `${cycles}× · ${moveSpec.hint}`}
					</span>
				</div>

				{/* Style — loop / boomerang / hold (hold freezes the composed angle) */}
				<Segmented
					options={LOOP_STYLES.map((s) => ({ id: s.id, label: s.label }))}
					value={loopStyle}
					onChange={(v) => onLoopStyleChange(v as LoopStyle)}
					disabled={busy}
				/>

				{/* Move picker — irrelevant under Hold, so it dims out. */}
				<div className="grid grid-cols-2 gap-1 rounded-lg bg-black/[0.04] p-0.5">
					{CAMERA_MOVES.map((m) => {
						const active = m.id === previewMove;
						return (
							<button
								key={m.id}
								type="button"
								disabled={busy || hold}
								onClick={() => onPreviewMoveChange(m.id)}
								className={`rounded-[7px] px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
									active ? "bg-white text-black shadow-sm" : "text-black/45 hover:text-black/70"
								}`}
							>
								{m.label}
							</button>
						);
					})}
				</div>

				{/* Speed — cadence multiplier; also moot under Hold. */}
				<div className="flex items-center justify-between gap-3">
					<Label>Speed</Label>
					<div className="flex gap-1 rounded-lg bg-black/[0.04] p-0.5">
						{SPEED_STOPS.map((s) => {
							const active = s === speed;
							return (
								<button
									key={s}
									type="button"
									disabled={busy || hold}
									onClick={() => onSpeedChange(s)}
									className={`rounded-[7px] px-2 py-1.5 font-mono text-[10px] tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
										active ? "bg-white text-black shadow-sm" : "text-black/45 hover:text-black/70"
									}`}
								>
									{s}×
								</button>
							);
						})}
					</div>
				</div>

				{/* Transport — play/pause · scrub · reset · time readout */}
				<div className="flex items-center gap-2.5">
					<button
						type="button"
						disabled={busy}
						onClick={onTogglePlay}
						aria-label={previewPlaying ? "Pause preview" : "Play preview"}
						className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-black/70 transition-colors hover:border-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
					>
						{previewPlaying ? <PauseIcon /> : <PlayIcon />}
					</button>
					<input
						type="range"
						min={0}
						max={1000}
						step={1}
						value={Math.round(previewT * 1000)}
						disabled={busy}
						onChange={(e) => onScrub(Number(e.target.value) / 1000)}
						aria-label="Scrub preview"
						className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-black disabled:cursor-not-allowed disabled:opacity-40"
					/>
					<button
						type="button"
						disabled={busy}
						onClick={onResetPlayhead}
						aria-label="Reset playhead"
						className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-black/55 transition-colors hover:border-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ResetIcon />
					</button>
				</div>
				<div className="flex justify-end">
					<span className="font-mono text-[11px] tabular-nums text-black/45">
						{elapsed.toFixed(1)}s / {durationSec}s
					</span>
				</div>
			</div>

			<div className="flex flex-col gap-2 px-4 py-3.5">
				<DockButton
					busy={exportState === `clip:${previewMove}`}
					disabled={busy}
					hint={`${durationSec}s · ${clipHint}`}
					label="Export clip"
					onClick={() => onExportClip(previewMove, clip)}
				/>
				<DockButton
					busy={exportState === "png:hero"}
					disabled={busy}
					hint="3/4 still"
					label="Still · Hero"
					onClick={() => onExportPng("hero", still)}
				/>
				<DockButton
					busy={exportState === "png:front"}
					disabled={busy}
					hint="Front still"
					label="Still · Front"
					onClick={() => onExportPng("front", still)}
				/>
			</div>

			<p className="border-t border-black/[0.06] px-4 py-2.5 text-[10px] leading-snug text-black/35">
				Stills are high-res PNG; the clip is a seamless H.264/MP4 up to 60s — loop,
				boomerang, or Hold (the composed angle, no motion). Hero + clip fly the
				composed/locked pose; Front is the dead-on fidelity shot. The now-playing
				screen is baked on at capture.
			</p>
		</div>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<Label>{label}</Label>
			{children}
		</div>
	);
}

function Segmented({
	options,
	value,
	onChange,
	disabled,
}: {
	options: ReadonlyArray<{ id: string; label: string }>;
	value: string;
	onChange: (id: string) => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex gap-1 rounded-lg bg-black/[0.04] p-0.5">
			{options.map((o) => {
				const active = o.id === value;
				return (
					<button
						key={o.id}
						type="button"
						disabled={disabled}
						onClick={() => onChange(o.id)}
						className={`rounded-[7px] px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
							active
								? "bg-white text-black shadow-sm"
								: "text-black/45 hover:text-black/70"
						}`}
					>
						{o.label}
					</button>
				);
			})}
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
			className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
				busy
					? "border-black/80 text-black"
					: "border-black/10 text-black/70 hover:border-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:text-black/70"
			}`}
		>
			<span className="text-[12.5px] font-medium">{busy ? "Capturing…" : label}</span>
			<span className="font-mono text-[10px] uppercase tracking-tight text-black/35">
				{hint}
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

function PlayIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M8 5v14l11-7z" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M6 5h4v14H6zM14 5h4v14h-4z" />
		</svg>
	);
}

function ResetIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<path d="M3 12a9 9 0 1 0 3-6.7" />
			<path d="M3 4v4h4" />
		</svg>
	);
}
