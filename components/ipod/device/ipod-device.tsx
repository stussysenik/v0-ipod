"use client";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

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
		? "0 0 0 1px rgba(82,88,97,0.12), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.06)"
		: "0 14px 28px -18px rgba(0,0,0,0.38), 0 0 0 1px rgba(88,94,102,0.08), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.06)";

	return (
		<div
			className="relative flex flex-col items-center transition-all duration-300"
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
					boxShadow:
						"inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.12)",
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

			{/* Screen gasket — the dark physical gap between shell and display */}
			<div
				className="relative z-10 w-full bg-[#0F0F0F]"
				style={{
					borderRadius: preset.screen.outerRadius,
					boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
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
