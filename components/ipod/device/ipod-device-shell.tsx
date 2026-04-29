"use client";

import { useMemo } from "react";
import { BASE_EXPORT_SCENE_HEIGHT, BASE_EXPORT_SCENE_WIDTH } from "@/lib/export/export-scene";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

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
		? "0 8px 16px -8px rgba(0,0,0,0.4), 0 24px 48px -20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.4)"
		: "0 20px 48px -28px rgba(0,0,0,0.5), 0 42px 64px -44px rgba(0,0,0,0.38), inset 0 1.5px 0.5px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.12)";

	const shellSurfaceStyle = useMemo(
		() => ({
			backgroundColor: skinColor,
			backgroundImage: [
				"linear-gradient(158deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 16%, rgba(255,255,255,0) 32%)",
				"linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.06) 100%)",
				"radial-gradient(circle at 50% 102%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%)",
			].join(", "),
		}),
		[skinColor],
	);

	return (
		<div
			className="relative"
			style={{
				width: `${BASE_EXPORT_SCENE_WIDTH}px`,
				height: `${BASE_EXPORT_SCENE_HEIGHT}px`,
			}}
			data-testid={dataTestId}
		>
			{/* Ground contact shadows anchor the device in the preview scene. */}
			<div
				className="pointer-events-none absolute left-1/2 bottom-[118px] h-[88px] w-[248px] -translate-x-1/2 rounded-full opacity-60 blur-[32px]"
				style={{
					background: "radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 78%)",
				}}
				aria-hidden="true"
			/>
			<div className="relative p-12">
				<div
					className="relative flex flex-col items-center justify-between overflow-hidden border transition-all duration-300"
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
						borderColor: "rgba(0,0,0,0.15)",
					}}
					data-export-layer="shell"
				>
					{/* Rim Highlight / Chamfer */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							borderRadius: preset.shell.radius,
							boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), inset 1px 0 0 rgba(255,255,255,0.2), inset -1px 0 0 rgba(255,255,255,0.2)",
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

					<div
						className="pointer-events-none absolute inset-[2.5px]"
						style={{
							borderRadius: preset.shell.innerRadius,
							boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -18px 32px rgba(0,0,0,0.04)",
						}}
						aria-hidden="true"
					/>

					{/* Top-down environmental reflection */}
					<div
						className="pointer-events-none absolute left-[8%] top-[2.5%] h-[38%] w-[84%] rounded-[100px] opacity-40"
						style={{
							background: "linear-gradient(166deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 22%, rgba(255,255,255,0) 60%)",
						}}
						aria-hidden="true"
					/>

					<div
						className="pointer-events-none absolute inset-x-[6%] bottom-[5%] h-[24%] rounded-[80px] opacity-20"
						style={{
							background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.12) 100%)",
						}}
						aria-hidden="true"
					/>

					{/* Screen Assembly with "Gasket" Gap */}
					<div className="relative z-10 w-full rounded-[10px] bg-black/5 p-[1px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(0,0,0,0.3)]">
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
