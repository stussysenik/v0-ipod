"use client";

import { useCallback } from "react";
import {
	Heading,
	Slider,
	SliderOutput,
	SliderTrack,
	SliderThumb,
	ListBox,
	ListBoxItem,
} from "react-aria-components";
import { ColorField } from "../editors/color-field";
import {
	StudioButton,
	StudioControlScope,
	StudioLabel,
	StudioSegment,
} from "@/components/ui/studio-controls";
import { IPOD_6G_COLORS } from "@/hooks/use-ipod-theme";
import { IPOD_CLASSIC_PRESETS } from "@/lib/ipod-classic-presets";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { BatteryMode, ColorTarget, IpodHardwarePresetId, IpodInteractionModel } from "@/lib/ipod-state/model";
import { Settings, Check } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

interface KumaSettingsPanelProps {
	showSettings: boolean;
	onToggleSettings: () => void;
	isCompactToolbox: boolean;
	hardwarePreset: IpodHardwarePresetId;
	onHardwarePresetChange: (id: IpodHardwarePresetId) => void;
	interactionModel: IpodInteractionModel;
	onInteractionModelChange: (model: IpodInteractionModel) => void;
	batteryLevel: number;
	onBatteryLevelChange: (level: number) => void;
	batteryMode: BatteryMode;
	onBatteryModeChange: (mode: BatteryMode) => void;
	skinColor: string;
	onSkinColorChange: (color: string) => void;
	ringColor: string;
	onRingColorChange: (color: string) => void;
	centerColor: string;
	onCenterColorChange: (color: string) => void;
	bgColor: string;
	onBgColorChange: (color: string) => void;
	savedCaseColors: string[];
	savedRingColors: string[];
	savedCenterColors: string[];
	savedBgColors: string[];
	onSaveCustomColor: (target: ColorTarget, hex: string) => void;
	onLoadSnapshot: () => void;
	onSaveSnapshot: () => void;
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<Heading className={cn("mb-3 px-1", className)}>
			<StudioLabel>{children}</StudioLabel>
		</Heading>
	);
}

export function KumaSettingsPanel({
	showSettings,
	onToggleSettings,
	isCompactToolbox,
	hardwarePreset,
	onHardwarePresetChange,
	interactionModel,
	onInteractionModelChange,
	batteryLevel,
	onBatteryLevelChange,
	batteryMode,
	onBatteryModeChange,
	skinColor,
	onSkinColorChange,
	ringColor,
	onRingColorChange,
	centerColor,
	onCenterColorChange,
	bgColor,
	onBgColorChange,
	savedCaseColors,
	savedRingColors,
	savedCenterColors,
	savedBgColors,
	onSaveCustomColor,
	onLoadSnapshot,
	onSaveSnapshot,
}: KumaSettingsPanelProps) {
	const handleToggle = useCallback(() => {
		if (document.startViewTransition) {
			document.startViewTransition(() => {
				onToggleSettings();
			});
		} else {
			onToggleSettings();
		}
	}, [onToggleSettings]);

	const panelPosition: React.CSSProperties = isCompactToolbox
		? {
				position: "fixed",
				right: "16px",
				left: "16px",
				bottom: "calc(env(safe-area-inset-bottom) + 5rem)",
				maxHeight: "60dvh",
				borderRadius: "24px",
			}
		: {
				position: "absolute",
				top: "0",
				right: "64px",
				width: "320px",
				maxHeight: "min(85dvh, 48rem)",
				borderRadius: "24px",
			};

	return (
		<div className="relative group">
			<IconButton
				icon={<Settings size={22} />}
				label="Theme & Controls"
				data-testid="theme-button"
				onClick={handleToggle}
				isActive={showSettings}
				className="w-12 h-12"
			/>

			{showSettings && (
				<StudioControlScope
					stageBackground={bgColor}
					data-testid="theme-panel"
					className="z-50 overflow-y-auto border border-[#D6D8DC] bg-[#F5F5F2]/95 backdrop-blur-xl shadow-[0_24px_50px_rgba(0,0,0,0.2)] p-5 animate-in fade-in zoom-in-95 duration-200"
					style={{
						viewTransitionName: "settings-panel",
						overscrollBehavior: "contain",
						...panelPosition,
					}}
				>
					{/* Hardware Selection — ARCHIVED: hidden behind SHOW_PHYSICAL_REVISION because each
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
									if (key) onHardwarePresetChange(key);
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

					{/* Interaction Model */}
					<div className="mb-6">
						<SectionHeading>Control Interface</SectionHeading>
						<StudioSegment
							aria-label="Control Interface"
							value={interactionModel}
							onChange={(value: IpodInteractionModel) => onInteractionModelChange(value)}
							options={[
								{ value: "direct", label: "Direct Edit" },
								{ value: "ipod-os", label: "iPod OS" },
							]}
						/>
					</div>

					{/* Battery Level - Real RAC Slider */}
					<div className="mb-8">
						<Slider
							value={batteryLevel}
							onChange={(val) => onBatteryLevelChange(val as number)}
							minValue={0.05}
							maxValue={1}
							step={0.01}
							className="flex flex-col gap-3"
						>
							<div className="flex items-center justify-between px-1">
								<SectionHeading className="mb-0 px-0">Power Cell</SectionHeading>
								<SliderOutput className="text-[10px] font-mono font-bold text-[color:var(--studio-label)]">
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
							onChange={(value: BatteryMode) => onBatteryModeChange(value)}
							options={[
								{ value: "manual", label: "Manual" },
								{ value: "solar", label: "Automatic" },
							]}
						/>
					</div>

					{/* Colors */}
					<div className="space-y-6 pt-6 border-t border-[#D5D7DA]">
						<div>
							<SectionHeading>Case Finish</SectionHeading>
							<div className="grid grid-cols-2 gap-2.5 mb-4">
								<StudioButton
									fullWidth
									isActive={skinColor === IPOD_6G_COLORS.case.black}
									onPress={() => {
										onSkinColorChange(IPOD_6G_COLORS.case.black);
										onRingColorChange(IPOD_6G_COLORS.wheel.dark.surface);
										onCenterColorChange(IPOD_6G_COLORS.wheel.dark.center);
										onBgColorChange(IPOD_6G_COLORS.background.white);
									}}
								>
									<span className="w-3.5 h-3.5 rounded-full border border-black/10 bg-[#1A1A1A]" />
									Jet Black
								</StudioButton>
								<StudioButton
									fullWidth
									isActive={skinColor === IPOD_6G_COLORS.case.white}
									onPress={() => {
										onSkinColorChange(IPOD_6G_COLORS.case.white);
										onRingColorChange(IPOD_6G_COLORS.wheel.light.surface);
										onCenterColorChange(IPOD_6G_COLORS.wheel.light.center);
										onBgColorChange(IPOD_6G_COLORS.background.white);
									}}
								>
									<span className="w-3.5 h-3.5 rounded-full border border-black/10 bg-[#F5F5F5]" />
									Classic White
								</StudioButton>
							</div>
							<ColorField
								label=""
								color={skinColor}
								onColorChange={onSkinColorChange}
								onSaveCustom={onSaveCustomColor}
								target="case"
								savedColors={savedCaseColors}
							/>
						</div>

						<ColorField
							label="Outer Click Wheel"
							color={ringColor}
							onColorChange={onRingColorChange}
							onSaveCustom={onSaveCustomColor}
							target="ring"
							savedColors={savedRingColors}
						/>

						<ColorField
							label="Center Button"
							color={centerColor}
							onColorChange={onCenterColorChange}
							onSaveCustom={onSaveCustomColor}
							target="center"
							savedColors={savedCenterColors}
						/>

						<ColorField
							label="Studio Background"
							color={bgColor}
							onColorChange={onBgColorChange}
							onSaveCustom={onSaveCustomColor}
							target="bg"
							savedColors={savedBgColors}
						/>
					</div>

					{/* Persistence */}
					<div className="mt-10 pt-6 border-t border-[#D5D7DA]">
						<div className="grid grid-cols-2 gap-3">
							<StudioButton fullWidth variant="secondary" onPress={onLoadSnapshot}>
								Restore
							</StudioButton>
							<StudioButton fullWidth variant="primary" onPress={onSaveSnapshot}>
								Snapshot
							</StudioButton>
						</div>
					</div>
				</StudioControlScope>
			)}
		</div>
	);
}
