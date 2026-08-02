"use client";

import { type Dispatch, useEffect, useRef, useState } from "react";

import {
	ALL_COCKPITS_VISIBLE,
	COCKPIT_ROSTER,
	type CockpitVisibility,
	PRODUCT_VIEW,
	visibleCockpitCount,
} from "@/lib/ipod-state/cockpit-roster";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
import { POP_JOB } from "@/lib/motion-tokens";
import { StudioButton, SURFACE_RADIUS } from "@/components/ui/studio-controls";

/**
 * THE TOOL LIST — every /3d panel in one place, each with the checkbox that puts it on
 * screen or takes it off.
 *
 * WHY IT IS ONE LIST. The nine cockpits were nine always-on cards with no shared control,
 * so the only way to see the object alone was to have never opened them. A per-panel close
 * button would have answered "hide this" and left "what is there" unanswered, and a
 * presentation *mode* would have answered the second question by making the first one
 * unreachable. A roster answers both: the set is legible whether or not any member is on
 * screen, and hidden panels stay listed, so nothing is behind a mode to be discovered.
 *
 * TWO COMMANDS, NOT TWO MODES. `Product view` and `All tools` write the two extreme values
 * of the same map the checkboxes write. There is no third state and no flag: the surface
 * is always showing exactly the panels the map says.
 *
 * The trigger reads its own value (`Panels · 9`) rather than only its name, so the count
 * is legible without opening the list.
 */

interface Ipod3DPanelsRosterProps {
	cockpits: CockpitVisibility;
	dispatch: Dispatch<IpodWorkbenchAction>;
}

export function Ipod3DPanelsRoster({ cockpits, dispatch }: Ipod3DPanelsRosterProps) {
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const shown = visibleCockpitCount(cockpits);

	// Dismiss on Escape or on a pointer outside — the list is a transient surface, and a
	// transient surface that survives the next click is a dialog nobody asked for.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		const onDown = (e: PointerEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("pointerdown", onDown);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("pointerdown", onDown);
		};
	}, [open]);

	return (
		<div ref={root} className="relative shrink-0">
			<StudioButton
				isActive={open}
				onPress={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-label="Panels"
				className="shrink-0"
			>
				Panels
				<span className="font-mono tabular-nums opacity-60">{shown}</span>
			</StudioButton>

			{open && (
				<div
					className={`absolute bottom-[calc(100%+0.5rem)] left-0 w-[204px] overflow-hidden border shadow-lg backdrop-blur-md animate-in fade-in ${POP_JOB.className}`}
					style={{
						background: "var(--studio-surface)",
						borderColor: "var(--studio-hairline)",
						borderRadius: SURFACE_RADIUS,
					}}
				>
					<ul className="flex flex-col p-1">
						{COCKPIT_ROSTER.map((entry) => {
							const on = cockpits[entry.id];
							return (
								<li key={entry.id}>
									<label className="flex h-6 cursor-pointer items-center gap-2 rounded-[3px] px-2 hover:bg-black/[0.05]">
										<input
											type="checkbox"
											checked={on}
											onChange={() =>
												dispatch({ type: "TOGGLE_COCKPIT", payload: entry.id })
											}
											className="h-3 w-3 shrink-0 accent-[var(--studio-accent)]"
										/>
										<span
											className="font-mono text-[9px] font-semibold tabular-nums"
											style={{ color: "var(--studio-label)", opacity: on ? 0.45 : 0.25 }}
										>
											{String(entry.index).padStart(2, "0")}
										</span>
										<span
											className="truncate text-[11px] font-medium"
											style={{ color: "var(--studio-label)", opacity: on ? 1 : 0.45 }}
										>
											{entry.label}
										</span>
									</label>
								</li>
							);
						})}
					</ul>

					<div
						className="flex gap-1 border-t p-1"
						style={{ borderColor: "var(--studio-hairline)" }}
					>
						<StudioButton
							onPress={() => dispatch({ type: "SET_COCKPITS", payload: PRODUCT_VIEW })}
							aria-label="Product view"
						>
							Product
						</StudioButton>
						<StudioButton
							onPress={() => dispatch({ type: "SET_COCKPITS", payload: ALL_COCKPITS_VISIBLE })}
							aria-label="Show all panels"
						>
							All
						</StudioButton>
					</div>
				</div>
			)}
		</div>
	);
}
