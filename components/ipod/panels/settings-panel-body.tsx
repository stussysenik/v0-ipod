"use client";

import { Heading, ListBox, ListBoxItem, Slider, SliderOutput, SliderThumb, SliderTrack } from "react-aria-components";
import { Check } from "lucide-react";

import { StudioControlScope, StudioLabel, StudioSegment } from "@/components/ui/studio-controls";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { IPOD_CLASSIC_PRESETS } from "@/lib/ipod-classic-presets";
import type { BatteryMode, IpodHardwarePresetId, IpodInteractionModel } from "@/lib/ipod-state/model";
import { cn } from "@/lib/utils";
import { IpodStoreContext } from "@/lib/xstate/store";

/**
 * Settings panel content (spec: floating-panel-system §6.1): the device-settings dock
 * controls — Physical Revision, Control Interface, Power Cell — migrated into a floating
 * panel. Every value is read from and written to the same central store the dock's
 * KumaSettingsPanel uses, so the two surfaces stay in lockstep until the dock control retires.
 */

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<Heading className={cn("mb-3 px-1", className)}>
			<StudioLabel>{children}</StudioLabel>
		</Heading>
	);
}

export function SettingsPanelBody() {
	const { send } = IpodStoreContext.useActorRef();
	const hardwarePreset = IpodStoreContext.useSelector((s) => s.context.presentation.hardwarePreset);
	const interactionModel = IpodStoreContext.useSelector((s) => s.context.interaction.interactionModel);
	const batteryLevel = IpodStoreContext.useSelector((s) => s.context.interaction.batteryLevel);
	const batteryMode = IpodStoreContext.useSelector((s) => s.context.interaction.batteryMode);
	const bgColor = IpodStoreContext.useSelector((s) => s.context.presentation.bgColor);

	return (
		<StudioControlScope stageBackground={bgColor} className="flex flex-col">
			{/* Physical Revision — ARCHIVED: hidden behind SHOW_PHYSICAL_REVISION because each
			    revision is an unfinished physical assembly (see lib/feature-flags.ts). */}
			{FEATURE_FLAGS.SHOW_PHYSICAL_REVISION && (
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
										"flex flex-col p-3 rounded-[8px] border transition-all cursor-pointer outline-none",
										isSelected
											? "bg-[color:var(--studio-surface)] border-[color:var(--studio-accent)] shadow-sm"
											: "bg-white/40 border-transparent hover:bg-white/60",
										isFocused && "ring-2 ring-[color:var(--studio-focus-ring)] ring-inset",
									)
								}
							>
								{({ isSelected }) => (
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<span className="text-[11px] font-bold text-[color:var(--studio-label)]">{preset.label}</span>
											<span className="text-[10px] text-[#6B7280] mt-0.5">{preset.notes}</span>
										</div>
										{isSelected && <Check size={14} className="text-[color:var(--studio-accent)]" />}
									</div>
								)}
							</ListBoxItem>
						))}
					</ListBox>
				</div>
			)}

			{/* Control Interface */}
			<div className="mb-6">
				<SectionHeading>Control Interface</SectionHeading>
				<StudioSegment
					aria-label="Control Interface"
					value={interactionModel}
					onChange={(value: IpodInteractionModel) =>
						send({ type: "SET_INTERACTION_MODEL", payload: value })
					}
					options={[
						{ value: "direct", label: "Direct Edit" },
						{ value: "ipod-os", label: "iPod OS" },
					]}
				/>
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
									className="absolute h-full rounded-full bg-[color:var(--studio-accent)]"
									style={{ width: `${state.getThumbPercent(0) * 100}%` }}
								/>
								<SliderThumb className="h-5 w-5 rounded-full bg-white border-2 border-[color:var(--studio-accent)] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--studio-focus-ring)]/30 transition-shadow top-1/2" />
							</>
						)}
					</SliderTrack>
				</Slider>

				<StudioSegment
					className="mt-4"
					aria-label="Power Cell Mode"
					value={batteryMode}
					onChange={(value: BatteryMode) => send({ type: "SET_BATTERY_MODE", payload: value })}
					options={[
						{ value: "manual", label: "Manual" },
						{ value: "solar", label: "Automatic" },
					]}
				/>
			</div>
		</StudioControlScope>
	);
}
