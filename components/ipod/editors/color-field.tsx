"use client";

import { useState } from "react";

import { findKumuPaletteProximityMatches } from "@/lib/color-proximity";
import type { ColorTarget } from "@/lib/ipod-state/model";
import { StudioButton, StudioChip, StudioLabel } from "@/components/ui/studio-controls";
import { HexColorInput } from "./hex-color-input";
import { NativeColorPicker } from "./native-color-picker";

/**
 * Shared color editor: hex input + native picker, a "Recent Custom" swatch strip, and an
 * on-demand proximity-shade tray. Extracted from the device dock so the floating Colors
 * panel renders the exact same control (spec: floating-panel-system §6 — colors panel).
 */

const SHADE_DISTANCE_THRESHOLD = 15;

/** Selectable color swatch — a thin re-export of the studio chip for back-compat. */
export function ColorSwatchButton({
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
		<StudioChip color={color} isSelected={isActive} onPress={onClick} label={label} size={size} />
	);
}

export function ColorField({
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
	onSaveCustom: (target: ColorTarget, hex: string) => void;
	target: ColorTarget;
	savedColors: string[];
}) {
	const [showShades, setShowShades] = useState(false);
	const proximityShades = findKumuPaletteProximityMatches(color, 12).filter(
		(m) => m.distance <= SHADE_DISTANCE_THRESHOLD,
	);

	return (
		<div className="mb-6 last:mb-0">
			{label ? <StudioLabel className="mb-3 px-1">{label}</StudioLabel> : null}
			{savedColors.length > 0 && (
				<div className="mb-3">
					<StudioLabel className="text-[10px] tracking-[0.08em] mb-2 px-1 opacity-60">
						Recent Custom
					</StudioLabel>
					<div className="flex flex-wrap gap-2.5 px-1">
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
			<div className="flex items-center gap-2 mb-3">
				<div className="flex-1">
					<HexColorInput
						value={color}
						onChange={(newColor: string) => {
							onColorChange(newColor);
							onSaveCustom(target, newColor);
						}}
					/>
				</div>
				<NativeColorPicker
					value={color}
					onChange={(newColor: string) => {
						onColorChange(newColor);
						onSaveCustom(target, newColor);
					}}
					target={label.toLowerCase() || target}
				/>
			</div>
			<StudioButton
				fullWidth
				variant="secondary"
				onPress={() => setShowShades((value) => !value)}
				className="uppercase tracking-wider"
			>
				<span
					className="w-3 h-3 rounded-full border border-black/10 shrink-0"
					style={{ backgroundColor: color }}
				/>
				{showShades ? "Hide Shades" : "View Shades"}
			</StudioButton>
			{showShades && (
				<div className="flex flex-wrap gap-2 mt-3 p-2 bg-black/5 rounded-xl">
					{proximityShades.map(({ hex, label }) => (
						<ColorSwatchButton
							key={hex}
							color={hex}
							isActive={color === hex}
							onClick={() => {
								onColorChange(hex);
								onSaveCustom(target, hex);
							}}
							label={`${hex} · ${label}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
