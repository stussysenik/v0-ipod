"use client";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { deriveGasketColor, hexToHsl } from "@/lib/color-proximity";

interface IpodDeviceProps {
	preset: IpodClassicPresetDefinition;
	skinColor: string;
	exportSafe?: boolean;
	screen: React.ReactNode;
	wheel: React.ReactNode;
}

export function IpodDevice({
	preset,
	skinColor,
	exportSafe = false,
	screen,
	wheel,
}: IpodDeviceProps) {
	const shellShadow = exportSafe
		? "0 0 0 0.5px rgba(82,88,97,0.10)"
		: "0 16px 32px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(88,94,102,0.15), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.08)";

	const gasketColor = deriveGasketColor(skinColor);
	const gasketShadowOpacity = hexToHsl(skinColor).l < 0.45 ? "0.5" : "0.18";

	return (
		<div
			className="relative flex flex-col items-center overflow-hidden transition-all duration-300"
			style={{
				width: preset.shell.width,
				height: preset.shell.height,
				backgroundColor: skinColor,
				boxShadow: shellShadow,
				borderRadius: preset.shell.radius,
				paddingLeft: preset.shell.paddingX,
				paddingRight: preset.shell.paddingX,
				paddingTop: preset.shell.paddingTop,
				paddingBottom: preset.shell.paddingBottom,
			}}
			data-export-layer="shell"
		>
			{/* Machined chamfer — the key edge that reads as anodized aluminum */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					borderRadius: preset.shell.radius,
					boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1.5px 3px rgba(0,0,0,0.14)",
				}}
			/>

			{/* Specular sheen — unified top-left light source */}
			<div
				className="pointer-events-none absolute inset-[2px]"
				aria-hidden="true"
				style={{
					borderRadius: preset.shell.innerRadius,
					background:
						"radial-gradient(ellipse at 24% 8%, rgba(255,255,255,0.16) 0%, transparent 55%)",
				}}
			/>

			{/* Screen gasket — recessed edge derived from case color */}
			<div
				className="relative z-10 w-full"
				style={{
					backgroundColor: gasketColor,
					borderRadius: preset.screen.outerRadius,
					boxShadow: `inset 0 1px 2px rgba(0,0,0,${gasketShadowOpacity})`,
				}}
			>
				{screen}
			</div>

			<div
				className="relative z-10 flex justify-center"
				style={{ marginTop: preset.shell.controlMarginTop }}
			>
				{wheel}
			</div>
		</div>
	);
}
