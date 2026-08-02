"use client";

import type { ReactNode } from "react";

import type { ExportFraming } from "@/components/three/three-d-ipod";
import { useBlobUrl } from "@/lib/export/use-blob-url";
import type { MotionDoc, MotionTrack, TimeMap } from "@/lib/motion/doc";
import { seamState } from "@/lib/motion/transport";
import { getExportVideoUrl, type ExportRecord } from "@/lib/pocketbase";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";
import {
	Ipod3DMotionInspector,
	type MotionShelfControls,
} from "./ipod-3d-motion-inspector";

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
export type ExportQuality = "standard" | "pro" | "cinema";

export interface ClipExportOptions {
	durationSec: number;
	quality: ExportQuality;
	aspect: ExportAspect;
	/** Whole cycles across the clip; `0` exports the composed angle with no motion. */
	repeat: number;
	/** loop / boomerang, carrying the boomerang's authored turnaround. */
	timeMap: TimeMap;
}

export interface StillExportOptions {
	aspect: ExportAspect;
}

export type Ipod3DExportState = "idle" | `png:${ExportFraming}` | `clip:${string}`;

const ASPECTS: ReadonlyArray<{ id: ExportAspect; label: string; hint: string }> = [
	{ id: "story", label: "9:16", hint: "Story" },
	{ id: "portrait", label: "4:5", hint: "Portrait" },
	{ id: "square", label: "1:1", hint: "Square" },
];

interface Ipod3DExportDockProps {
	exportState: Ipod3DExportState;
	/** Clip length in seconds — lifted to the stage so the playhead cadence matches. */
	durationSec: number;
	onDurationChange: (sec: number) => void;
	/** Playhead — selected clip + live transport (play/scrub), driven by the model. */
	previewMove: string;
	previewPlaying: boolean;
	/** Live playhead position over the full clip, t ∈ [0,1). */
	previewT: number;
	/** Whole cycles across the clip — drives preview + export identically. `0` holds. */
	repeat: number;
	onRepeatChange: (repeat: number) => void;
	/** loop / boomerang — drives preview + export identically. */
	timeMap: TimeMap;
	onTimeMapChange: (timeMap: TimeMap) => void;
	onPreviewMoveChange: (move: string) => void;
	onTogglePlay: () => void;
	onScrub: (t: number) => void;
	onResetPlayhead: () => void;
	onExportPng: (framing: ExportFraming, options: StillExportOptions) => void;
	onExportClip: (move: string, options: ClipExportOptions) => void;
	/**
	 * Aspect + quality — lifted to the stage (like the motion slice) so the proof
	 * fingerprint and the proof panel read the SAME values the export bakes with.
	 */
	aspect: ExportAspect;
	onAspectChange: (aspect: ExportAspect) => void;
	quality: ExportQuality;
	onQualityChange: (quality: ExportQuality) => void;
	/**
	 * The motion inspector's inputs, forwarded verbatim. The dock resolves none of them:
	 * which document is flown, and whether it is the shipped one or a tuned copy, is one
	 * decision the stage already makes for the rig, the encoder and the proof
	 * (`motionClipFor`). A fourth answer computed here is how those three came to disagree.
	 */
	documents: readonly MotionDoc[];
	/** The document as flown — base with overrides applied. */
	doc: MotionDoc;
	/** The document as shipped, which an override is a diff against. */
	baseDoc: MotionDoc;
	onTrackChange: (trackKey: string, track: MotionTrack) => void;
	onTrackClear: (trackKey: string) => void;
	/** The motion shelf and its five commands, forwarded verbatim (§6.7). */
	shelf: MotionShelfControls;
	/**
	 * The inspector's `belowScrubber` slot, forwarded verbatim (§6.5's timeline proof strip).
	 * It arrives already composed because it reads the proof cache, which the stage owns — the
	 * dock forwarding a node keeps that decision where the other three proof readers make it,
	 * and the node re-parents with the inspector rather than needing to be rebuilt.
	 */
	belowScrubber?: ReactNode;
	history?: ExportRecord[];
	/**
	 * Proof thumbnail source — the shared cache, looked up by the record's *proof* key
	 * (derived from its snapshot, since the cache is keyed by the motion-excluded anchor key,
	 * not the full export identity). The stage owns the derivation; the dock just renders.
	 */
	peekProofBlob?: (record: ExportRecord) => Blob | undefined;
	/** Re-open a past export's exact setup (only offered when the record has a snapshot). */
	onReopen?: (record: ExportRecord) => void;
	/** Copy the current look as a `?s=` share link (spec: portable-customizer-state). */
	onShareLink?: () => void;
}

export function Ipod3DExportDock({
	exportState,
	durationSec,
	onDurationChange,
	previewMove,
	previewPlaying,
	previewT,
	repeat,
	onRepeatChange,
	timeMap,
	onTimeMapChange,
	onPreviewMoveChange,
	onTogglePlay,
	onScrub,
	onResetPlayhead,
	onExportPng,
	onExportClip,
	aspect,
	onAspectChange,
	quality,
	onQualityChange,
	documents,
	doc,
	baseDoc,
	onTrackChange,
	onTrackClear,
	shelf,
	belowScrubber,
	history = [],
	peekProofBlob,
	onReopen,
	onShareLink,
}: Ipod3DExportDockProps) {
	const busy = exportState !== "idle";

	const still: StillExportOptions = { aspect };
	const clip: ClipExportOptions = { durationSec, quality, aspect, repeat, timeMap };

	// What the clip button promises: a held angle, or N× of the selected document.
	const clipHint = seamState(repeat) === "held" ? "no motion" : `${repeat}× · ${doc.label}`;

	return (
		<div className="pointer-events-auto w-full select-none rounded-[16px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader id="export" />

			{/* Presets — aspect · quality · length (spacious, tactile controls) */}
			<div className="flex flex-col gap-3 border-b border-black/[0.06] px-4 py-3.5">
				<Row label="Aspect">
					<Segmented
						options={ASPECTS.map((a) => ({ id: a.id, label: a.label }))}
						value={aspect}
						onChange={(v) => onAspectChange(v as ExportAspect)}
						disabled={busy}
					/>
				</Row>
				<Row label="Quality">
					<Segmented
						options={[
							{ id: "standard", label: "Standard" },
							{ id: "pro", label: "Pro" },
							{ id: "cinema", label: "Cinema" },
						]}
						value={quality}
						onChange={(v) => onQualityChange(v as ExportQuality)}
						disabled={busy}
					/>
				</Row>
			</div>

			{/*
			 * The motion inspector (spec: motion-authoring §6). It replaces what was the
			 * Preview section — a picker, a style segment, a repeat row and a transport,
			 * four controls that could set a motion and not one that could open it. The
			 * dock owns the mount and nothing else here;
			 * `refactor-3d-control-surface-to-inspector` re-parents the panel under the
			 * Camera part by deleting these lines, not by rewriting the component.
			 */}
			<div className="border-b border-black/[0.06] px-4 py-3.5">
				<Ipod3DMotionInspector
					documents={documents}
					docId={previewMove}
					onDocChange={onPreviewMoveChange}
					doc={doc}
					baseDoc={baseDoc}
					onTrackChange={onTrackChange}
					onTrackClear={onTrackClear}
					shelf={shelf}
					repeat={repeat}
					onRepeatChange={onRepeatChange}
					durationSec={durationSec}
					onDurationChange={onDurationChange}
					timeMap={timeMap}
					onTimeMapChange={onTimeMapChange}
					playing={previewPlaying}
					onTogglePlay={onTogglePlay}
					playhead={previewT}
					onScrub={onScrub}
					onResetPlayhead={onResetPlayhead}
					disabled={busy}
					belowScrubber={belowScrubber}
				/>
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
				{onShareLink && (
					<DockButton
						busy={false}
						disabled={busy}
						hint="Copy URL"
						label="Share link"
						onClick={onShareLink}
					/>
				)}
			</div>

			{/* Export History — past 1080p clips saved to PocketBase. Collapsed by default so
			    the dock's one message stays "set up & capture"; the past work is one tap away. */}
			{history.length > 0 && (
				<details className="group/recent border-t border-black/[0.06] px-4 py-3.5">
					<summary className="flex cursor-pointer list-none items-center justify-between">
						<span className="flex items-center gap-1.5">
							<span className="text-[9px] leading-none text-black/30 transition-transform group-open/recent:rotate-90">
								›
							</span>
							<Label>Recent Exports</Label>
							<span className="text-[10px] font-medium text-black/30">{history.length}</span>
						</span>
						<span className="text-[10px] font-medium text-black/35">1080p</span>
					</summary>
					<div className="mt-2 flex flex-col gap-1.5">
						{history.map((record) => {
							// Provenance: the proof thumbnail is the SAME cached frame the panel showed
							// pre-export (one store, two tenses); re-open restores the exact setup.
							const proofBlob = peekProofBlob?.(record);
							const canReopen = Boolean(record.snapshot) && Boolean(onReopen);
							return (
								<div
									key={record.id}
									className="group flex items-center gap-2.5 rounded-lg bg-black/[0.03] px-3 py-2 transition-colors hover:bg-black/[0.06]"
								>
									<ProofThumb blob={proofBlob} />
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-[11px] font-semibold text-black/75">
											{record.title}
										</span>
										<span className="font-mono text-[9px] uppercase tracking-tight text-black/40">
											{record.move} · {record.aspect} · {record.duration}s
										</span>
									</div>
									<div className="flex items-center gap-1">
										{canReopen && (
											<button
												type="button"
												onClick={() => onReopen?.(record)}
												className="flex h-7 items-center rounded-md border border-black/10 bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-black/60 shadow-sm transition-all hover:border-black/30 hover:text-black active:scale-[0.97]"
											>
												Re-open
											</button>
										)}
										<a
											href={getExportVideoUrl(record)}
											target="_blank"
											rel="noreferrer"
											className="flex h-7 items-center rounded-md border border-black/10 bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-black/60 shadow-sm transition-all hover:border-black/30 hover:text-black active:scale-[0.97]"
										>
											View
										</a>
									</div>
								</div>
							);
						})}
					</div>
				</details>
			)}

			<p className="border-t border-black/[0.06] px-4 py-2.5 text-[10px] leading-snug text-black/35">
				Stills export as PNG, clips as seamless MP4 up to 60s. The now-playing screen is
				baked on at capture.
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

/**
 * A small proof thumbnail for a history row. Mints an object URL for the cached blob and
 * revokes it on change/unmount; renders a neutral placeholder for legacy records (no proof).
 */
function ProofThumb({ blob }: { blob?: Blob }) {
	const url = useBlobUrl(blob);

	return (
		<div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-black/[0.08] bg-[#fafafa]">
			{url ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={url} alt="" className="h-full w-full object-contain" />
			) : (
				<span className="font-mono text-[7px] uppercase tracking-tight text-black/20">mp4</span>
			)}
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
			{children}
		</span>
	);
}

