"use client";

import { useMemo } from "react";
import { BASE_EXPORT_SCENE_HEIGHT, BASE_EXPORT_SCENE_WIDTH } from "@/lib/export/export-scene";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { deriveGasketColor } from "@/lib/color-proximity";

/**
 * Physical enclosure for the iPod device.
 *
 * This component is intentionally limited to the outer body and its material
 * treatment. It should not own playback logic, screen scene logic, or click
 * wheel behavior. Those concerns are passed in as composed child assemblies.
 */
interface IPodDeviceShellProps {
	preset: IpodClassicPresetDefinition;
	skinColor: string;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	exportSafe?: boolean;
	showShadowLayer?: boolean;
	dataTestId?: string;
}

/**
 * Render the outer shell assembly around the display and click wheel.
 *
 * Naming note:
 * - "shell" refers to the enclosure only
 * - "screen" is the composed display assembly inserted into the enclosure
 * - "wheel" is the composed input assembly inserted into the enclosure
 */
export function IPodDeviceShell({
	preset,
	skinColor,
	screen,
	wheel,
	exportSafe = false,
	showShadowLayer = false,
	dataTestId,
}: IPodDeviceShellProps) {
	const shellShadow = exportSafe
		? "0 0 0 0.5px rgba(70,76,84,0.08)"
		: "0 20px 48px -28px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.12)";

	const shellSurfaceStyle = useMemo(
		() => ({
			backgroundColor: skinColor,
			backgroundImage: [
				"linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 14%, rgba(255,255,255,0) 30%)",
				"linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.07) 100%)",
			].join(", "),
		}),
		[skinColor],
	);

	const gasketColor = useMemo(() => deriveGasketColor(skinColor), [skinColor]);

	return (
		<div
			className="relative"
			style={{
				width: `${BASE_EXPORT_SCENE_WIDTH}px`,
				height: `${BASE_EXPORT_SCENE_HEIGHT}px`,
			}}
			data-testid={dataTestId}
		>
			{/* Ground contact shadow — anchors the device in scene */}
			<div
				className="pointer-events-none absolute left-1/2 bottom-[118px] h-[80px] w-[240px] -translate-x-1/2 rounded-full opacity-50 blur-[24px]"
				style={{
					background: "radial-gradient(circle, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.14) 40%, rgba(0,0,0,0) 72%)",
				}}
				aria-hidden="true"
			/>
			<div className="relative p-12">
				<div
					className="relative flex flex-col items-center justify-between overflow-hidden transition-all duration-300"
					style={{
						...shellSurfaceStyle,
						width: preset.shell.width,
						height: preset.shell.height,
						borderRadius: preset.shell.radius,
						paddingLeft: preset.shell.paddingX,
						paddingRight: preset.shell.paddingX,
						paddingTop: preset.shell.paddingTop,
						paddingBottom: preset.shell.paddingBottom,
						boxShadow: shellShadow,
					}}
					data-export-layer="shell"
				>
					{/* Machined chamfer — the decisive edge that reads as CNC aluminum */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							borderRadius: preset.shell.radius,
							boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1.5px 3px rgba(0,0,0,0.10)",
						}}
						aria-hidden="true"
					/>

					{(showShadowLayer || exportSafe) && (
						<div
							className="absolute inset-0"
							style={{
								borderRadius: preset.shell.radius,
								boxShadow: "0 20px 48px -28px rgba(0,0,0,0.4), 0 42px 64px -44px rgba(0,0,0,0.3)",
							}}
							aria-hidden="true"
							data-export-layer="shell-shadow"
						/>
					)}

					{/* Subsurface grain/material feel */}
					<div
						className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
						}}
						aria-hidden="true"
					/>

					{/* Environmental reflection — soft top-left light catch */}
					<div
						className="pointer-events-none absolute left-[8%] top-[2%] h-[28%] w-[76%] rounded-[80px] opacity-22"
						style={{
							background: "linear-gradient(162deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0) 50%)",
						}}
						aria-hidden="true"
					/>

					<div
						className="pointer-events-none absolute inset-x-[6%] bottom-[5%] h-[16%] rounded-[60px] opacity-10"
						style={{
							background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 70%, rgba(0,0,0,0.1) 100%)",
						}}
						aria-hidden="true"
					/>

					{/* Screen gasket — recessed edge derived from case color */}
					<div 
						className="relative z-10 w-full"
						style={{
							backgroundColor: gasketColor,
							borderRadius: preset.screen.outerRadius,
						}}
					>
						{screen}
					</div>

					<div className="relative z-10 -mt-2 flex flex-1 items-center justify-center">
						{wheel}
					</div>
				</div>
			</div>
		</div>
	);
}
