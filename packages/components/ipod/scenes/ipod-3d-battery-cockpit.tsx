"use client";

import type { Dispatch } from "react";

import type { BatteryMode } from "@ipod/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@ipod/lib/ipod-state/update";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * Battery cockpit for the /3d stage.
 *
 * Same design language as the other cockpits — one translucent card, a single hairline,
 * black type. Drives the shared OS reducer so the on-device status-bar battery reflects
 * the level/mode live, exactly as the 2D workbench does. Intentionally dumb: renders
 * state, forwards intent.
 */
interface Ipod3DBatteryCockpitProps {
	/** Position in the control surface, rendered as the header's number chip. */
	index: number;
	batteryLevel: number;
	batteryMode: BatteryMode;
	dispatch: Dispatch<IpodWorkbenchAction>;
}

const MODES: readonly { id: BatteryMode; label: string }[] = [
	{ id: "manual", label: "Manual" },
	{ id: "solar", label: "Solar" },
] as const;

export function Ipod3DBatteryCockpit({
	index,
	batteryLevel,
	batteryMode,
	dispatch,
}: Ipod3DBatteryCockpitProps) {
	const pct = Math.round(batteryLevel * 100);
	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader
				index={index}
				title="Battery"
				right={<span className="font-mono text-[11px] tabular-nums text-black/55">{pct}%</span>}
			/>

			<div className="flex flex-col gap-3 px-3.5 py-3">
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={batteryLevel}
					onChange={(e) =>
						dispatch({ type: "SET_BATTERY_LEVEL", payload: parseFloat(e.target.value) })
					}
					aria-label="Battery level"
					className="h-1 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-black"
				/>

				<div className="flex gap-1.5">
					{MODES.map((m) => {
						const active = batteryMode === m.id;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => dispatch({ type: "SET_BATTERY_MODE", payload: m.id })}
								className={`flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
									active
										? "border-black/80 text-black"
										: "border-black/10 text-black/55 hover:border-black/40 hover:text-black"
								}`}
							>
								{m.label}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
