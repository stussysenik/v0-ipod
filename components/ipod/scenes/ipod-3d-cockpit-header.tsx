"use client";

import type { ReactNode } from "react";

import { type CockpitId, cockpitEntry } from "@/lib/ipod-state/cockpit-roster";

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
 * The position/number and the title live in `lib/ipod-state/cockpit-roster.ts` — the one
 * place that owns card order — and the header reads them from its id. Before, the stage
 * passed `index={4}` and the cockpit passed `title="Battery"`, so a panel's position and
 * its name had two homes and the set of panels had none.
 *
 * Visually it preserves the existing hairline idiom: a tracked-uppercase label on the
 * left and an optional affordance on the right (a lock button, an on/off switch, a live
 * readout), separated from the body by a single 6%-black rule.
 */
interface Ipod3DCockpitHeaderProps {
	/** Which cockpit this is; its number and title are read from the roster. */
	id: CockpitId;
	/** Optional right-aligned affordance: a lock toggle, on/off switch, %, or hint. */
	right?: ReactNode;
}

export function Ipod3DCockpitHeader({ id, right }: Ipod3DCockpitHeaderProps) {
	const { index, label } = cockpitEntry(id);
	return (
		<div className="flex items-center justify-between border-b border-black/[0.06] px-3.5 pb-2.5 pt-3">
			<span className="flex items-baseline gap-1.5">
				<span className="font-mono text-[9px] font-semibold tabular-nums text-black/25">
					{String(index).padStart(2, "0")}
				</span>
				<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/40">
					{label}
				</span>
			</span>
			{right}
		</div>
	);
}
