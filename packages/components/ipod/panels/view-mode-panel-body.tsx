"use client";

import { availableViewModes } from "@ipod/lib/view-modes";
import { IpodStoreContext } from "@ipod/lib/xstate/store";

/**
 * Seed panel content (spec: floating-panel-system §6.1): the view-mode switch, migrated
 * out of the fixed toolbox into a floating panel. Reads/writes the same central store the
 * dock buttons use, so the two surfaces stay in lockstep until the dock control retires.
 */
export function ViewModePanelBody() {
	const { send } = IpodStoreContext.useActorRef();
	const viewMode = IpodStoreContext.useSelector((s) => s.context.presentation.viewMode);

	return (
		<div className="flex flex-col gap-1.5">
			{availableViewModes().map((mode) => (
				<button
					key={mode.id}
					type="button"
					data-testid={`panel-view-${mode.id}`}
					aria-pressed={viewMode === mode.id}
					onClick={() => send({ type: "SET_VIEW_MODE", payload: mode.id })}
					className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
						viewMode === mode.id
							? "border-blue-200 bg-blue-100 text-blue-700"
							: "border-[#D0D4DA] bg-white/70 text-black/70 hover:bg-white"
					}`}
				>
					{mode.label}
				</button>
			))}
		</div>
	);
}
