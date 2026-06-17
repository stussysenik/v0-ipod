"use client";

import { Button, Heading } from "react-aria-components";
import { cva } from "class-variance-authority";

import { ColorField } from "../editors/color-field";
import { IPOD_6G_COLORS } from "@/hooks/use-ipod-theme";
import {
	loadPersistedSongSnapshot,
	savePersistedSongSnapshot,
	saveWorkbenchSnapshot,
} from "@/lib/ipod-state/effects";
import type { ColorTarget } from "@/lib/ipod-state/model";
import { TEST_SONG_SNAPSHOT } from "@/lib/song-snapshots";
import { cn } from "@/lib/utils";
import { IpodStoreContext } from "@/lib/xstate/store";

/**
 * Colors panel content (spec: floating-panel-system §6 — colors panel): the finish editors
 * (Case / Outer Click Wheel / Center Button / Studio Background) plus snapshot Restore/Save.
 * Every value reads from and writes to the same central store the dock's KumaSettingsPanel
 * uses — including the now-lifted `savedColors` history — so both surfaces stay in lockstep
 * until the dock control retires.
 */

const sectionHeading = cva("text-[11px] font-bold text-[#4F555D] uppercase tracking-[0.1em] mb-3 px-1");

const racButton = cva(
	"flex items-center justify-center text-[11px] font-semibold transition-all duration-200 py-2.5 px-3 rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-blue-500 w-full",
	{
		variants: {
			isActive: {
				true: "bg-white border-[#111827] text-[#111827] shadow-sm",
				false: "bg-white/60 border-[#D0D4DA] text-[#6B7280] hover:bg-white/80",
			},
		},
		defaultVariants: { isActive: false },
	},
);

export function ColorsPanelBody() {
	const actorRef = IpodStoreContext.useActorRef();
	const { send } = actorRef;
	const skinColor = IpodStoreContext.useSelector((s) => s.context.presentation.skinColor);
	const ringColor = IpodStoreContext.useSelector((s) => s.context.presentation.ringColor);
	const centerColor = IpodStoreContext.useSelector((s) => s.context.presentation.centerColor);
	const bgColor = IpodStoreContext.useSelector((s) => s.context.presentation.bgColor);
	const savedColors = IpodStoreContext.useSelector((s) => s.context.savedColors);

	const saveCustom = (target: ColorTarget, hex: string) =>
		send({ type: "SAVE_CUSTOM_COLOR", payload: { target, hex } });

	const applyFinish = (caseHex: string, ring: string, center: string, bg: string) => {
		send({ type: "SET_SKIN_COLOR", payload: caseHex });
		send({ type: "SET_RING_COLOR", payload: ring });
		send({ type: "SET_CENTER_COLOR", payload: center });
		send({ type: "SET_BG_COLOR", payload: bg });
	};

	const handleSaveSnapshot = () => {
		// `context` is the full workbench model (plus export-status fields the builder ignores).
		saveWorkbenchSnapshot(actorRef.getSnapshot().context);
	};

	const handleRestoreSnapshot = () => {
		const persisted = loadPersistedSongSnapshot() ?? TEST_SONG_SNAPSHOT;
		send({ type: "APPLY_SONG_SNAPSHOT", payload: persisted });
		savePersistedSongSnapshot(persisted);
	};

	return (
		<div className="flex flex-col">
			{/* Case Finish */}
			<div className="mb-6">
				<Heading className={sectionHeading()}>Case Finish</Heading>
				<div className="grid grid-cols-2 gap-2.5 mb-4">
					<Button
						onPress={() =>
							applyFinish(
								IPOD_6G_COLORS.case.black,
								IPOD_6G_COLORS.wheel.dark.surface,
								IPOD_6G_COLORS.wheel.dark.center,
								IPOD_6G_COLORS.background.white,
							)
						}
						className={racButton({ isActive: skinColor === IPOD_6G_COLORS.case.black })}
					>
						<span className="flex items-center gap-2">
							<span className="w-3.5 h-3.5 rounded-full border border-black/10 bg-[#1A1A1A]" />
							Jet Black
						</span>
					</Button>
					<Button
						onPress={() =>
							applyFinish(
								IPOD_6G_COLORS.case.white,
								IPOD_6G_COLORS.wheel.light.surface,
								IPOD_6G_COLORS.wheel.light.center,
								IPOD_6G_COLORS.background.white,
							)
						}
						className={racButton({ isActive: skinColor === IPOD_6G_COLORS.case.white })}
					>
						<span className="flex items-center gap-2">
							<span className="w-3.5 h-3.5 rounded-full border border-black/10 bg-[#F5F5F5]" />
							Classic White
						</span>
					</Button>
				</div>
				<ColorField
					label=""
					color={skinColor}
					onColorChange={(c) => send({ type: "SET_SKIN_COLOR", payload: c })}
					onSaveCustom={saveCustom}
					target="case"
					savedColors={savedColors.case}
				/>
			</div>

			<ColorField
				label="Outer Click Wheel"
				color={ringColor}
				onColorChange={(c) => send({ type: "SET_RING_COLOR", payload: c })}
				onSaveCustom={saveCustom}
				target="ring"
				savedColors={savedColors.ring}
			/>

			<ColorField
				label="Center Button"
				color={centerColor}
				onColorChange={(c) => send({ type: "SET_CENTER_COLOR", payload: c })}
				onSaveCustom={saveCustom}
				target="center"
				savedColors={savedColors.center}
			/>

			<ColorField
				label="Studio Background"
				color={bgColor}
				onColorChange={(c) => send({ type: "SET_BG_COLOR", payload: c })}
				onSaveCustom={saveCustom}
				target="bg"
				savedColors={savedColors.bg}
			/>

			{/* Persistence */}
			<div className="mt-6 pt-6 border-t border-[#D5D7DA] grid grid-cols-2 gap-3">
				<Button
					onPress={handleRestoreSnapshot}
					className={cn(racButton(), "bg-black/5 border-transparent text-[#111827]")}
				>
					Restore
				</Button>
				<Button
					onPress={handleSaveSnapshot}
					className={cn(racButton(), "bg-[#111827] border-[#111827] text-white hover:bg-black")}
				>
					Snapshot
				</Button>
			</div>
		</div>
	);
}
