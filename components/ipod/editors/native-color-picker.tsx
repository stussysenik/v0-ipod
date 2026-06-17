"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pipette, Palette } from "lucide-react";

interface NativeColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	target: string;
}

function hasEyeDropperApi(): boolean {
	return typeof window !== "undefined" && "EyeDropper" in window;
}

function hasNativeColorInput(): boolean {
	if (typeof document === "undefined") return false;
	const input = document.createElement("input");
	input.type = "color";
	return input.type === "color";
}

export function NativeColorPicker({ value, onChange, target }: NativeColorPickerProps) {
	const [hasDropper, setHasDropper] = useState(false);
	const [hasColorInput, setHasColorInput] = useState(false);
	const colorInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setHasDropper(hasEyeDropperApi());
		setHasColorInput(hasNativeColorInput());
	}, []);

	const openEyeDropper = useCallback(async () => {
		try {
			const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
			const result = await eyeDropper.open();
			const hex = result.sRGBHex;
			onChange(hex);
		} catch {
			// User cancelled or API unavailable
		}
	}, [onChange]);

	const openNativeColorPicker = useCallback(() => {
		colorInputRef.current?.click();
	}, []);

	const handleNativeColorChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
		},
		[onChange],
	);

	return (
		<div className="flex items-center gap-1">
			{hasDropper && (
				<button
					type="button"
					onClick={openEyeDropper}
					className="inline-flex h-11 w-11 items-center justify-center rounded hover:bg-black/5 text-[#6B7280] hover:text-[#111827] transition-colors"
					title="Pick color from screen"
					aria-label={`Pick ${target} color from screen`}
				>
					<Pipette size={14} />
				</button>
			)}
			{hasColorInput && (
				<>
					<button
						type="button"
						onClick={openNativeColorPicker}
						className="inline-flex h-11 w-11 items-center justify-center rounded hover:bg-black/5 text-[#6B7280] hover:text-[#111827] transition-colors"
						title="Open system color picker"
						aria-label={`Open system color picker for ${target}`}
					>
						<Palette size={14} />
					</button>
					<input
						ref={colorInputRef}
						type="color"
						value={value}
						onChange={handleNativeColorChange}
						className="absolute opacity-0 w-0 h-0 pointer-events-none"
						aria-hidden="true"
						tabIndex={-1}
					/>
				</>
			)}
		</div>
	);
}
