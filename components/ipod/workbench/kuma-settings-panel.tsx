"use client";

import { useCallback, useState } from "react";
import { Button } from "@cloudflare/kumo";
import { HexColorInput } from "../editors/hex-color-input";
import { NativeColorPicker } from "../editors/native-color-picker";
import { IPOD_6G_COLORS } from "@/hooks/use-ipod-theme";
import { IPOD_CLASSIC_PRESETS } from "@/lib/ipod-classic-presets";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { findKumuPaletteProximityMatches } from "@/lib/color-proximity";
import type { BatteryMode, IpodHardwarePresetId, IpodInteractionModel } from "@/lib/ipod-state/model";
import { Settings } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

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
	onSaveCustomColor: (target: "case" | "bg" | "ring" | "center", hex: string) => void;
	onLoadSnapshot: () => void;
	onSaveSnapshot: () => void;
}

// ─── Shared tokens ─────────────────────────────────────────────────────────────────

const BORDER_ACTIVE = "1px solid #111827";
const BORDER_INACTIVE = "1px solid #C8CDD3";
const BORDER_SUBTLE = "1px solid #BEC3CA";
const BG_ACTIVE = "rgba(255,255,255,0.9)";
const BG_INACTIVE = "rgba(255,255,255,0.65)";
const BG_HOVER = "rgba(255,255,255,0.8)";
const TEXT_ACTIVE = "#111827";
const TEXT_MUTED = "#6B7280";
const TEXT_HEADING = "#4F555D";

const sectionHeadingClass =
	"text-[11px] font-semibold text-[#4F555D] uppercase tracking-[0.08em] mb-2 px-1";

// ─── Sub-components ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
	return <h3 className={sectionHeadingClass}>{children}</h3>;
}

function ToggleButton({
	isActive,
	onClick,
	children,
	colSpan,
}: {
	isActive: boolean;
	onClick: () => void;
	children: React.ReactNode;
	colSpan?: boolean;
}) {
	return (
		<Button
			type="button"
			onClick={onClick}
			variant="ghost"
			size="xs"
			aria-pressed={isActive}
			className={`${colSpan ? "w-full" : "flex-1"} ${!isActive ? "hover:bg-[rgba(255,255,255,0.8)]" : ""}`}
			style={{
				borderRadius: 12,
				border: isActive ? BORDER_ACTIVE : BORDER_INACTIVE,
				backgroundColor: isActive ? BG_ACTIVE : BG_INACTIVE,
				color: isActive ? TEXT_ACTIVE : TEXT_MUTED,
				fontSize: 11,
				fontWeight: 600,
				padding: "8px 12px",
				height: "auto",
			}}
		>
			{children}
		</Button>
	);
}

function ColorSwatchButton({
	color,
	isActive,
	onClick,
	label,
	size = 28,
}: {
	color: string;
	isActive: boolean;
	onClick: () => void;
	label: string;
	size?: number;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			aria-label={label}
			className="rounded-full p-0 transition-transform hover:scale-110"
			style={{
				width: size,
				height: size,
				backgroundColor: color,
				border: `${isActive ? 2 : 1}px solid ${isActive ? "#111827" : "#B5BBC3"}`,
				boxShadow: isActive ? "0 0 0 2px #CDD1D6" : undefined,
			}}
		/>
	);
}

const SHADE_DISTANCE_THRESHOLD = 15; // CIEDE2000 units — only genuinely close colors

function ColorField({
	label,
	color,
	onColorChange,
	onSaveCustom,
	target,
	savedColors,
}: {
	label: string;
	color: string;
	onColorChange: (color: string) => void;
	onSaveCustom: (target: "case" | "bg" | "ring" | "center", hex: string) => void;
	target: "case" | "bg" | "ring" | "center";
	savedColors: string[];
}) {
	const [showShades, setShowShades] = useState(false);
	const proximityShades = findKumuPaletteProximityMatches(color, 12)
		.filter((m) => m.distance <= SHADE_DISTANCE_THRESHOLD);
	return (
		<div className="mb-4">
			{label ? <SectionHeading>{label}</SectionHeading> : null}
			{savedColors.length > 0 && (
				<div className="mb-3">
					<div className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
						Recent Custom
					</div>
					<div className="flex flex-wrap gap-2 px-1">
						{savedColors.map((savedColor) => (
							<ColorSwatchButton
								key={savedColor}
								color={savedColor}
								isActive={color === savedColor}
								onClick={() => onColorChange(savedColor)}
								label={`Custom ${savedColor}`}
							/>
						))}
					</div>
				</div>
			)}
			<div
				className="flex items-end gap-1 mb-4 cursor-text"
				onClick={(e) => {
					const input = (e.currentTarget as HTMLElement).querySelector("input") as HTMLInputElement | null;
					input?.focus();
				}}
			>
				<HexColorInput
					value={color}
					onChange={(newColor: string) => {
						onColorChange(newColor);
						onSaveCustom(target, newColor);
					}}
				/>
				<NativeColorPicker
					value={color}
					onChange={(newColor: string) => {
						onColorChange(newColor);
						onSaveCustom(target, newColor);
					}}
					target={label.toLowerCase() || target}
				/>
			</div>
			<Button
				type="button"
				onClick={() => setShowShades((v) => !v)}
				variant="ghost"
				size="xs"
				className="w-full"
				style={{
					fontSize: 10,
					fontWeight: 600,
					height: 28,
					borderRadius: 8,
					border: "1px solid #D5D7DA",
					backgroundColor: "transparent",
					color: TEXT_MUTED,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 4,
					padding: 0,
				}}
			>
				<span
					className="w-3 h-3 rounded-full border shrink-0"
					style={{
						backgroundColor: color,
						borderColor: "#B5BBC3",
					}}
				/>
				{showShades ? "Hide Shades" : "Shades"}
			</Button>
			{showShades && (
				<div className="flex flex-wrap gap-1 mt-2 px-0.5">
					{proximityShades.map(({ hex, distance, label }) => (
						<button
							key={hex}
							type="button"
							onClick={() => {
								onColorChange(hex);
								onSaveCustom(target, hex);
							}}
							title={`${hex} · ${label}`}
							aria-label={`Select shade ${hex}, distance ${label}`}
							className="rounded-full p-0 transition-transform hover:scale-[1.15]"
							style={{
								width: 28,
								height: 28,
								backgroundColor: hex,
								border: color === hex ? "2px solid #111827" : "1px solid #B5BBC3",
								boxShadow: color === hex ? "0 0 0 2px #CDD1D6" : undefined,
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Main Panel ────────────────────────────────────────────────────────────────────

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

	const panelPosition: Record<string, string> = isCompactToolbox
		? {
				position: "fixed",
				right: "12px",
				left: "12px",
				bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)",
				maxHeight: "min(52dvh, 24rem)",
				borderRadius: "16px",
			}
		: {
				position: "absolute",
				top: "0",
				right: "56px",
				width: "292px",
				maxHeight: "min(74dvh, 40rem)",
			};

	return (
		<div className="relative group">
			<IconButton
				icon={<Settings size={20} />}
				label="Theme"
				data-testid="theme-button"
				onClick={handleToggle}
				isActive={showSettings}
			/>

			{showSettings && (
				<div
					data-testid="theme-panel"
					className="z-20 overflow-y-auto"
					style={{
						viewTransitionName: "settings-panel" as unknown as string,
						overscrollBehavior: "contain",
						...panelPosition,
						backgroundColor: "rgba(240,240,236,0.96)",
						backdropFilter: "blur(12px)",
						borderColor: "#D6D8DC",
						borderWidth: 1,
						borderStyle: "solid",
						boxShadow: "0 18px 34px rgba(0,0,0,0.16)",
						padding: 16,
						zIndex: 20,
					}}
				>
					{/* Revision Attempt */}
					<div className="mb-4">
						<SectionHeading>Revision Attempt</SectionHeading>
						<div className="flex flex-col gap-2">
							{IPOD_CLASSIC_PRESETS.filter(
								(p) =>
									FEATURE_FLAGS.SHOW_EXTRA_HARDWARE_PRESETS ||
									p.id === "classic-2008-black",
							).map((presetOption) => (
								<Button
									key={presetOption.id}
									type="button"
									data-testid={`hardware-preset-${presetOption.id}-button`}
									variant="ghost"
									size="xs"
									aria-pressed={hardwarePreset === presetOption.id}
									onClick={() => onHardwarePresetChange(presetOption.id)}
									className={`w-full text-left ${hardwarePreset !== presetOption.id ? "hover:bg-[rgba(255,255,255,0.8)]" : ""}`}
									style={{
										borderRadius: 12,
										border: hardwarePreset === presetOption.id ? BORDER_ACTIVE : BORDER_INACTIVE,
										backgroundColor: hardwarePreset === presetOption.id ? BG_ACTIVE : BG_INACTIVE,
										boxShadow: hardwarePreset === presetOption.id
											? "inset 0 0 0 1px rgba(17,24,39,0.08)"
											: undefined,
										padding: "8px 12px",
										height: "auto",
									}}
								>
									<div className="flex flex-col text-left w-full">
										<span className="text-[11px] font-semibold" style={{ color: TEXT_ACTIVE }}>
											{presetOption.label}
										</span>
										<span className="text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>
											{presetOption.notes}
										</span>
									</div>
								</Button>
							))}
						</div>
					</div>

					{/* Interaction */}
					<div className="mb-4">
						<SectionHeading>Interaction</SectionHeading>
						<div className="flex gap-2">
							<ToggleButton
								isActive={interactionModel === "direct"}
								onClick={() => onInteractionModelChange("direct")}
							>
								Direct Edit
							</ToggleButton>
							<ToggleButton
								isActive={interactionModel === "ipod-os"}
								onClick={() => onInteractionModelChange("ipod-os")}
							>
								iPod OS
							</ToggleButton>
						</div>
						{FEATURE_FLAGS.SHOW_IPOD_OS_ORIGINAL && (
							<div className="mt-2">
								<ToggleButton
									isActive={interactionModel === "ipod-os-original"}
									onClick={() =>
										onInteractionModelChange("ipod-os-original")
									}
									colSpan
								>
									iPod OS Original
								</ToggleButton>
							</div>
						)}
						{FEATURE_FLAGS.SHOW_IPOD_OS_ORIGINAL &&
							interactionModel === "ipod-os-original" && (
								<p className="mt-2 px-1 text-[10px] leading-[1.35]" style={{ color: TEXT_MUTED }}>
									Mirrors the standard iPod OS layout.
								</p>
							)}
					</div>

					{/* Battery */}
					<div className="mb-4">
						<div className="flex items-center justify-between mb-2 px-1">
							<h3 className={sectionHeadingClass + " mb-0 px-0"}>Battery</h3>
							<span className="text-[10px] font-mono" style={{ color: TEXT_MUTED, fontFamily: "var(--font-geist-mono)" }}>
								{Math.round(batteryLevel * 100)}%
							</span>
						</div>
						<div className="px-1">
							<input
								type="range"
								min="0.05"
								max="1"
								step="0.01"
								value={batteryLevel}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onBatteryLevelChange(parseFloat(e.target.value))
								}
								className="w-full h-1.5 rounded-lg cursor-pointer appearance-none"
								style={{
									backgroundColor: "#D6D8DC",
									accentColor: "#111827",
								}}
							/>
						</div>
						<div className="flex gap-1.5 mt-2 px-1">
							{(["manual", "solar"] as const).map((mode) => (
								<Button
									key={mode}
									type="button"
									onClick={() => onBatteryModeChange(mode)}
									title={
										mode === "manual"
											? "18h real-life drain"
											: "Depletes over one song"
									}
									variant="ghost"
									size="xs"
									className={`flex-1 ${batteryMode !== mode ? "hover:bg-[rgba(255,255,255,0.8)]" : ""}`}
									style={{
										borderRadius: 8,
										border: batteryMode === mode ? BORDER_ACTIVE : BORDER_SUBTLE,
										backgroundColor: batteryMode === mode ? BG_ACTIVE : BG_INACTIVE,
										color: batteryMode === mode ? TEXT_ACTIVE : TEXT_MUTED,
										fontSize: 10,
										fontWeight: 600,
										lineHeight: 1.25,
										padding: "4px 6px",
										height: "auto",
									}}
								>
									{mode === "manual" ? "Manual" : "Solar"}
								</Button>
							))}
						</div>
					</div>

					{/* Case Color */}
					<div className="mb-4">
						<h3 className={sectionHeadingClass + " mb-3"}>Case Color</h3>
						<div className="grid grid-cols-2 gap-2 mb-3">
							<Button
								type="button"
								onClick={() => {
									onSkinColorChange(IPOD_6G_COLORS.case.black);
									onRingColorChange(IPOD_6G_COLORS.wheel.dark.surface);
									onCenterColorChange(IPOD_6G_COLORS.wheel.dark.center);
									onBgColorChange(IPOD_6G_COLORS.background.white);
								}}
								variant="ghost"
								size="xs"
								className={skinColor !== IPOD_6G_COLORS.case.black ? "hover:bg-white" : ""}
								style={{
									borderRadius: 8,
									border: skinColor === IPOD_6G_COLORS.case.black ? BORDER_ACTIVE : BORDER_SUBTLE,
									backgroundColor: skinColor === IPOD_6G_COLORS.case.black ? BG_ACTIVE : "rgba(255,255,255,0.75)",
									color: skinColor === IPOD_6G_COLORS.case.black ? TEXT_ACTIVE : TEXT_MUTED,
									fontSize: 11,
									fontWeight: 600,
									padding: "6px 8px",
									height: "auto",
								}}
							>
								<span className="flex items-center gap-2">
									<span
										className="w-4 h-4 rounded-full border shrink-0"
										style={{
											backgroundColor: IPOD_6G_COLORS.case.black,
											borderColor: "#B5BBC3",
										}}
									/>
									Black
								</span>
							</Button>
							<Button
								type="button"
								onClick={() => {
									onSkinColorChange(IPOD_6G_COLORS.case.white);
									onRingColorChange(IPOD_6G_COLORS.wheel.light.surface);
									onCenterColorChange(IPOD_6G_COLORS.wheel.light.center);
									onBgColorChange(IPOD_6G_COLORS.background.white);
								}}
								variant="ghost"
								size="xs"
								className={skinColor !== IPOD_6G_COLORS.case.white ? "hover:bg-white" : ""}
								style={{
									borderRadius: 8,
									border: skinColor === IPOD_6G_COLORS.case.white ? BORDER_ACTIVE : BORDER_SUBTLE,
									backgroundColor: skinColor === IPOD_6G_COLORS.case.white ? BG_ACTIVE : "rgba(255,255,255,0.75)",
									color: skinColor === IPOD_6G_COLORS.case.white ? TEXT_ACTIVE : TEXT_MUTED,
									fontSize: 11,
									fontWeight: 600,
									padding: "6px 8px",
									height: "auto",
								}}
							>
								<span className="flex items-center gap-2">
									<span
										className="w-4 h-4 rounded-full border shrink-0"
										style={{
											backgroundColor: IPOD_6G_COLORS.case.white,
											borderColor: "#B5BBC3",
										}}
									/>
									White
								</span>
							</Button>
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
						label="Outer Ring Color"
						color={ringColor}
						onColorChange={onRingColorChange}
						onSaveCustom={onSaveCustomColor}
						target="ring"
						savedColors={savedRingColors}
					/>

					<ColorField
						label="Inner Ring Color"
						color={centerColor}
						onColorChange={onCenterColorChange}
						onSaveCustom={onSaveCustomColor}
						target="center"
						savedColors={savedCenterColors}
					/>

					<ColorField
						label="Background"
						color={bgColor}
						onColorChange={onBgColorChange}
						onSaveCustom={onSaveCustomColor}
						target="bg"
						savedColors={savedBgColors}
					/>

					{/* Load/Save Snapshot */}
					<div className="mt-4 pt-3" style={{ borderTop: "1px solid #D5D7DA" }}>
						<div className="grid grid-cols-2 gap-2">
							<Button
								type="button"
								data-testid="load-song-snapshot-button"
								onClick={onLoadSnapshot}
								variant="ghost"
								size="xs"
								className="hover:bg-white"
								style={{
									borderRadius: 8,
									border: BORDER_SUBTLE,
									backgroundColor: "rgba(255,255,255,0.8)",
									color: TEXT_ACTIVE,
									fontSize: 11,
									fontWeight: 600,
									padding: "6px 8px",
									height: "auto",
								}}
							>
								Load Snapshot
							</Button>
							<Button
								type="button"
								data-testid="save-song-snapshot-button"
								onClick={onSaveSnapshot}
								variant="ghost"
								size="xs"
								className="hover:bg-white"
								style={{
									borderRadius: 8,
									border: BORDER_SUBTLE,
									backgroundColor: "rgba(255,255,255,0.8)",
									color: TEXT_ACTIVE,
									fontSize: 11,
									fontWeight: 600,
									padding: "6px 8px",
									height: "auto",
								}}
							>
								Save Snapshot
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
