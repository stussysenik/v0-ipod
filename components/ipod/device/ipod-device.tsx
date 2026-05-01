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
		? "0 0 0 1px rgba(82,88,97,0.12), inset 0 1px 0 rgba(255,255,255,0.52), inset 0 -1px 0 rgba(0,0,0,0.08)"
		: "0 20px 28px -28px rgba(0,0,0,0.36), 0 12px 18px -18px rgba(0,0,0,0.18), 0 0 0 1px rgba(88,94,102,0.10), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.04)";

	return (
		<div
			className="relative flex flex-col items-center border border-white/45 transition-all duration-300"
			style={{
				width: preset.shell.width,
				height: preset.shell.height,
				backgroundColor: skinColor,
				borderColor: exportSafe ? "rgba(96,102,110,0.24)" : undefined,
				boxShadow: shellShadow,
				borderRadius: preset.shell.radius,
				paddingLeft: preset.shell.paddingX,
				paddingRight: preset.shell.paddingX,
				paddingTop: preset.shell.paddingTop,
				paddingBottom: preset.shell.paddingBottom,
			}}
			data-export-layer="shell"
		>
			<div
				className="pointer-events-none absolute inset-[1px]"
				aria-hidden="true"
				style={{
					borderRadius: preset.shell.innerRadius,
					background: "radial-gradient(circle at 22% 10%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 22%), linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.02) 100%)",
				}}
			/>
			<div className="relative z-10 flex w-full justify-center">{screen}</div>
			<div
				className="relative z-10 flex justify-center"
				style={{ marginTop: preset.shell.controlMarginTop }}
			>
				{wheel}
			</div>
		</div>
	);
}
