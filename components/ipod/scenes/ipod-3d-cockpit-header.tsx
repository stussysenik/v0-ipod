"use client";

import type { ReactNode } from "react";

/**
 * The numbered header every /3d cockpit wears.
 *
 * WHY ONE SHARED HEADER
 * ---------------------
 * The control surface is seven stacked cards. Before, each card opened with its own
 * ad-hoc label, so the stack read as a pile of unrelated panels. Giving every card the
 * SAME header — a zero-padded number chip plus a one-word title — turns the pile into a
 * single ordered sequence (01 → 07) the eye can follow top-to-bottom: a "shoot pipeline"
 * cadence. The title is deliberately one word so each card commits to a single job.
 *
 * The position/number lives in the stage (the one place that owns card order), not in
 * the cockpit, so re-ordering the pipeline is a one-file change.
 *
 * Visually it preserves the existing hairline idiom: a tracked-uppercase label on the
 * left and an optional affordance on the right (a lock button, an on/off switch, a live
 * readout), separated from the body by a single 6%-black rule.
 */
interface Ipod3DCockpitHeaderProps {
	/** 1-based position in the control surface; rendered as a zero-padded chip (e.g. "04"). */
	index: number;
	/** The card's single-job title (e.g. "Camera"). */
	title: string;
	/** Optional right-aligned affordance: a lock toggle, on/off switch, %, or hint. */
	right?: ReactNode;
}

export function Ipod3DCockpitHeader({ index, title, right }: Ipod3DCockpitHeaderProps) {
	return (
		<div className="flex items-center justify-between border-b border-black/[0.06] px-3.5 pb-2.5 pt-3">
			<span className="flex items-baseline gap-1.5">
				<span className="font-mono text-[9px] font-semibold tabular-nums text-black/25">
					{String(index).padStart(2, "0")}
				</span>
				<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/40">
					{title}
				</span>
			</span>
			{right}
		</div>
	);
}
