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
	/** Override the status-bar label (e.g. the active portfolio screen). */
	statusBarTitle?: string;
	/** Force-hide the playback indicator for non-music screens. */
	showPlayIndicator?: boolean;
}

export function IpodDisplay({
	preset,
	skinColor,
	exportSafe = false,
	showOsMenu,
	frameRef,
	children,
	batteryLevel = 1.0,
	statusBarTitle,
	showPlayIndicator,
}: IpodDisplayProps) {
	const screenTokens = preset.screen;
	return (
		<div
			className="relative z-10 mx-auto shrink-0 p-0"
			style={{
				width: screenTokens.frameWidth,
				height: screenTokens.frameHeight,
				background: "transparent",
				borderRadius: screenTokens.outerRadius,
				boxShadow: "none",
				outline: "none",
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
					boxShadow:
						"inset 0 0 0 0.5px rgba(255,255,255,0.7)",
					outline: "none",
					border: "1px solid #e5e7eb",
				}}
			>
				<IpodStatusBar
					screenTokens={screenTokens}
					showOsMenu={showOsMenu}
					batteryLevel={batteryLevel}
					title={statusBarTitle}
					showPlayIndicator={showPlayIndicator}
				/>
				{children}
				<IpodGlassOverlay exportSafe={exportSafe} />
			</div>
		</div>
	);
}
