"use client";

import { Button, Heading, ListBox, ListBoxItem, Slider, SliderOutput, SliderThumb, SliderTrack } from "react-aria-components";
import { Check } from "lucide-react";
import { cva } from "class-variance-authority";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { IPOD_CLASSIC_PRESETS } from "@/lib/ipod-classic-presets";
import type { BatteryMode, IpodHardwarePresetId } from "@/lib/ipod-state/model";
import { cn } from "@/lib/utils";
import { IpodStoreContext } from "@/lib/xstate/store";

/**
 * Settings panel content (spec: floating-panel-system §6.1): the device-settings dock
 * controls — Physical Revision, Control Interface, Power Cell — migrated into a floating
 * panel. Every value is read from and written to the same central store the dock's
 * KumaSettingsPanel uses, so the two surfaces stay in lockstep until the dock control retires.
 */

const sectionHeading = cva("text-[11px] font-bold text-[#4F555D] uppercase tracking-[0.1em] mb-3 px-1");

const racButton = cva(
	"flex items-center justify-center text-[11px] font-semibold transition-all duration-200 py-2.5 px-3 rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
	{
		variants: {
			isActive: {
				true: "bg-white border-[#111827] text-[#111827] shadow-sm",
				false: "bg-white/60 border-[#D0D4DA] text-[#6B7280] hover:bg-white/80",
			},
			fullWidth: { true: "w-full", false: "flex-1" },
		},
		defaultVariants: { isActive: false, fullWidth: false },
	},
);

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
	return <Heading className={cn(sectionHeading(), className)}>{children}</Heading>;
}

export function SettingsPanelBody() {
	const { send } = IpodStoreContext.useActorRef();
	const hardwarePreset = IpodStoreContext.useSelector((s) => s.context.presentation.hardwarePreset);
	const interactionModel = IpodStoreContext.useSelector((s) => s.context.interaction.interactionModel);
	const batteryLevel = IpodStoreContext.useSelector((s) => s.context.interaction.batteryLevel);
	const batteryMode = IpodStoreContext.useSelector((s) => s.context.interaction.batteryMode);

	return (
		<div className="flex flex-col">
			{/* Physical Revision */}
			<div className="mb-6">
				<SectionHeading>Physical Revision</SectionHeading>
				<ListBox
					aria-label="Hardware Preset"
					selectedKeys={[hardwarePreset]}
					selectionMode="single"
					onSelectionChange={(keys) => {
						const key = Array.from(keys)[0] as IpodHardwarePresetId;
						if (key) send({ type: "SET_HARDWARE_PRESET", payload: key });
					}}
					className="flex flex-col gap-2"
				>
					{IPOD_CLASSIC_PRESETS.filter(
						(p) => FEATURE_FLAGS.SHOW_EXTRA_HARDWARE_PRESETS || p.id === "classic-2008-black",
					).map((preset) => (
						<ListBoxItem
							key={preset.id}
							id={preset.id}
							className={({ isSelected, isFocused }) =>
								cn(
									"flex flex-col p-3 rounded-xl border transition-all cursor-pointer outline-none",
									isSelected ? "bg-white border-[#111827] shadow-sm" : "bg-white/40 border-transparent hover:bg-white/60",
									isFocused && "ring-2 ring-blue-500 ring-inset",
								)
							}
						>
							{({ isSelected }) => (
								<div className="flex items-center justify-between">
									<div className="flex flex-col">
										<span className="text-[11px] font-bold text-[#111827]">{preset.label}</span>
										<span className="text-[10px] text-[#6B7280] mt-0.5">{preset.notes}</span>
									</div>
									{isSelected && <Check size={14} className="text-[#111827]" />}
								</div>
							)}
						</ListBoxItem>
					))}
				</ListBox>
			</div>

			{/* Control Interface */}
			<div className="mb-6">
				<SectionHeading>Control Interface</SectionHeading>
				<div className="flex gap-2.5">
					<Button
						onPress={() => send({ type: "SET_INTERACTION_MODEL", payload: "direct" })}
						className={racButton({ isActive: interactionModel === "direct" })}
					>
						Direct Edit
					</Button>
					<Button
						onPress={() => send({ type: "SET_INTERACTION_MODEL", payload: "ipod-os" })}
						className={racButton({ isActive: interactionModel === "ipod-os" })}
					>
						iPod OS
					</Button>
				</div>
			</div>

			{/* Power Cell */}
			<div>
				<Slider
					value={batteryLevel}
					onChange={(val) => send({ type: "SET_BATTERY_LEVEL", payload: val as number })}
					minValue={0.05}
					maxValue={1}
					step={0.01}
					className="flex flex-col gap-3"
				>
					<div className="flex items-center justify-between px-1">
						<SectionHeading className="mb-0 px-0">Power Cell</SectionHeading>
						<SliderOutput className="text-[10px] font-mono font-bold text-[#111827]">
							{({ state }) => `${Math.round(state.getThumbValue(0) * 100)}%`}
						</SliderOutput>
					</div>
					<SliderTrack className="relative h-2 w-full rounded-full bg-black/10">
						{({ state }) => (
							<>
								<div
									className="absolute h-full rounded-full bg-[#111827]"
									style={{ width: `${state.getThumbPercent(0) * 100}%` }}
								/>
								<SliderThumb className="h-5 w-5 rounded-full bg-white border-2 border-[#111827] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 transition-shadow top-1/2" />
							</>
						)}
					</SliderTrack>
				</Slider>

				<div className="flex gap-2 mt-4">
					{(["manual", "solar"] as const).map((mode) => (
						<Button
							key={mode}
							onPress={() => send({ type: "SET_BATTERY_MODE", payload: mode as BatteryMode })}
							className={racButton({ isActive: batteryMode === mode, fullWidth: true })}
						>
							{mode === "manual" ? "Standard" : "Live"}
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}
