"use client";

import { getSurfaceToken } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { IpodGlassOverlay } from "./ipod-glass-overlay";
import { IpodStatusBar } from "./ipod-status-bar";

interface IpodDisplayProps {
	preset: IpodClassicPresetDefinition;
	skinColor?: string;
	exportSafe?: boolean;
	showOsMenu: boolean;
	frameRef: React.MutableRefObject<HTMLDivElement | null>;
	children: React.ReactNode;
	batteryLevel?: number;
}

export function IpodDisplay({
	preset,
	skinColor,
	exportSafe = false,
	showOsMenu,
	frameRef,
	children,
	batteryLevel = 1.0,
}: IpodDisplayProps) {
	const screenTokens = preset.screen;
	return (
		<div
			className="relative z-10 mx-auto shrink-0 p-[1px]"
			style={{
				width: screenTokens.frameWidth,
				height: screenTokens.frameHeight,
				background: "linear-gradient(180deg, #e5e5e7 0%, #8e8e93 100%)",
				borderRadius: screenTokens.outerRadius,
				boxShadow:
					"0 0 0 0.5px rgba(0,0,0,0.06), 0 8px 24px -8px rgba(0,0,0,0.15)",
			}}
			data-export-layer="screen"
			data-testid="ipod-screen"
		>
			<div
				ref={frameRef}
				className="relative h-full w-full overflow-hidden"
				style={{
					backgroundColor: getSurfaceToken("screen.content.bg"),
					borderRadius: screenTokens.innerRadius,
					fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
				}}
			>
				<IpodStatusBar
					screenTokens={screenTokens}
					showOsMenu={showOsMenu}
					batteryLevel={batteryLevel}
				/>
				{children}
				<IpodGlassOverlay exportSafe={exportSafe} />
			</div>
		</div>
	);
}
