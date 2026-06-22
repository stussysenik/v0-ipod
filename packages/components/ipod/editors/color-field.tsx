"use client";

import { useState } from "react";
import { Button } from "react-aria-components";
import { Check } from "lucide-react";
import { cva } from "class-variance-authority";

import { findKumuPaletteProximityMatches } from "@ipod/lib/color-proximity";
import type { ColorTarget } from "@ipod/lib/ipod-state/model";
import { cn } from "@ipod/lib/utils";
import { HexColorInput } from "./hex-color-input";
import { NativeColorPicker } from "./native-color-picker";

/**
 * Shared color editor: hex input + native picker, a "Recent Custom" swatch strip, and an
 * on-demand proximity-shade tray. Extracted from the device dock so the floating Colors
 * panel renders the exact same control (spec: floating-panel-system §6 — colors panel).
 */

const sectionHeading = cva("text-[11px] font-bold text-[#4F555D] uppercase tracking-[0.1em] mb-3 px-1");

const SHADE_DISTANCE_THRESHOLD = 15;

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
		<Button
			onPress={onClick}
			aria-label={label}
			className={cn(
				"rounded-full transition-transform hover:scale-110 border box-border outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
				isActive ? "border-[#111827] border-2 shadow-[0_0_0_2px_#CDD1D6]" : "border-[#B5BBC3] border-1",
			)}
			style={{ width: size, height: size, backgroundColor: color }}
		>
			{isActive && <Check size={12} className="text-white mix-blend-difference mx-auto" />}
		</Button>
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
			{label ? <h3 className={sectionHeading()}>{label}</h3> : null}
			{savedColors.length > 0 && (
				<div className="mb-3">
					<div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
						Recent Custom
					</div>
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
			<Button
				onPress={() => setShowShades((v) => !v)}
				className="w-full h-8 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] bg-transparent border border-[#D5D7DA] rounded-lg hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
			>
				<span
					className="w-3 h-3 rounded-full border border-[#B5BBC3] shrink-0"
					style={{ backgroundColor: color }}
				/>
				{showShades ? "Hide Shades" : "View Shades"}
			</Button>
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
