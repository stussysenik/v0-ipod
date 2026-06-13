"use client";

import { useEffect, useRef, useState } from "react";

import type { ProofEntry } from "@/lib/export/proof-cache";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * The proof panel — the guarantee made visible.
 *
 * `/3d` export pixels are a pure function of their inputs, so the proof never needs to be
 * computed when asked: the speculative cache (see `useProofCache`) already holds the anchor
 * frame for the current composition. This panel is a PURE READER of that cache — it never
 * triggers a render. A hit shows instantly and is, by construction, byte-identical to what
 * an export will produce. A miss keeps the last frame on screen, dimmed, with a hairline
 * "computing…" until the background queue fills the slot. The proof is ambient, not awaited.
 *
 * The export spec and the Export action live here too, docked with the frame they validate:
 * you ship from the same surface that shows exactly what you'll get.
 */

export interface Ipod3DExportProofPanelProps {
	index: number;
	/** Current composition's proof key; null until the first pose is read. */
	fingerprint: string | null;
	/** Non-bumping cache read (the hook's `peek`). */
	peek: (fingerprint: string) => ProofEntry | undefined;
	/** Bumps when a frame lands — forces a re-read of `peek`. */
	version: number;
	// Export spec (driven directly by props so it updates the instant a control changes).
	aspect: string;
	quality: string;
	fps: number;
	durationSec: number;
	hold: boolean;
	moveLabel: string;
	/** Initiate the export this proof validates. */
	onExport: () => void;
	exportBusy: boolean;
}

export function Ipod3DExportProofPanel({
	index,
	fingerprint,
	peek,
	version,
	aspect,
	quality,
	fps,
	durationSec,
	hold,
	moveLabel,
	onExport,
	exportBusy,
}: Ipod3DExportProofPanelProps) {
	// Resolve the current frame on every fingerprint/version change. `version` is in the dep
	// list so a freshly-stored frame is picked up even though `peek` is a stable function.
	const entry = fingerprint ? peek(fingerprint) : undefined;
	const hit = entry?.blob ?? null;

	// Keep the last frame we actually showed, so a miss can display it dimmed rather than
	// flashing empty. An object URL is minted per blob and revoked when it changes/unmounts.
	const [shownUrl, setShownUrl] = useState<string | null>(null);
	const shownBlobRef = useRef<Blob | null>(null);
	useEffect(() => {
		if (!hit || hit === shownBlobRef.current) return;
		const url = URL.createObjectURL(hit);
		shownBlobRef.current = hit;
		setShownUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return url;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hit, version]);
	useEffect(() => () => {
		if (shownUrl) URL.revokeObjectURL(shownUrl);
	}, [shownUrl]);

	const pending = !hit && fingerprint !== null;
	const empty = !shownUrl;
	const frameCount = hold ? 1 : Math.max(1, Math.round(fps * durationSec));

	return (
		<div className="pointer-events-auto w-full select-none rounded-[16px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader index={index} title="Proof" />

			{/* The frame — the export's anchor, content-addressed and pre-rendered. */}
			<div className="px-4 pt-3.5">
				<div className="relative aspect-[3/4] w-full overflow-hidden rounded-[10px] border border-black/[0.06] bg-[#fafafa]">
					{shownUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={shownUrl}
							alt="Export proof"
							className={`h-full w-full object-contain transition-opacity duration-300 ${
								pending ? "opacity-40" : "opacity-100"
							}`}
						/>
					) : (
						<div className="grid h-full w-full place-items-center">
							<span className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/30">
								Composing…
							</span>
						</div>
					)}

					{/* Non-blocking pending hairline — a miss is computing, never an error. */}
					{pending && !empty && (
						<div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-white/70 px-2.5 py-1 backdrop-blur-sm">
							<span className="h-1 w-1 animate-pulse rounded-full bg-black/50" />
							<span className="font-mono text-[9px] uppercase tracking-tight text-black/45">
								Computing…
							</span>
						</div>
					)}

					{/* A guaranteed hit earns a quiet "exact" stamp — this IS the export. */}
					{hit && (
						<div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white/90">
							Exact
						</div>
					)}
				</div>
			</div>

			{/* Export spec — aspect · quality · fps · duration · frames. For Hold, the single
			    proof frame IS the whole clip, so we say so instead of a misleading frame count. */}
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 font-mono text-[10px] uppercase tracking-tight text-black/45">
				<span>{aspect}</span>
				<span className="text-black/15">·</span>
				<span>{quality}</span>
				<span className="text-black/15">·</span>
				<span>{fps}fps</span>
				<span className="text-black/15">·</span>
				<span>{durationSec}s</span>
				<span className="text-black/15">·</span>
				<span>{hold ? "still = whole clip" : `${frameCount} frames`}</span>
			</div>

			{/* Docked Export action — ship from the surface that shows what you'll get. */}
			<div className="px-4 pb-3.5">
				<button
					type="button"
					onClick={onExport}
					disabled={exportBusy}
					className="flex w-full items-center justify-between rounded-lg border border-black/80 bg-black px-3.5 py-2.5 text-left text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<span className="text-[12.5px] font-medium">
						{exportBusy ? "Capturing…" : "Export this proof"}
					</span>
					<span className="font-mono text-[10px] uppercase tracking-tight text-white/55">
						{hold ? "hold" : moveLabel}
					</span>
				</button>
			</div>
		</div>
	);
}
