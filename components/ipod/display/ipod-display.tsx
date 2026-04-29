"use client";

import { getSurfaceToken, deriveScreenSurround } from "@/lib/color-manifest";
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
}

export function IpodDisplay({
	preset,
	skinColor,
	exportSafe = false,
	showOsMenu,
	frameRef,
	children,
}: IpodDisplayProps) {
	const screenTokens = preset.screen;
	const surround = skinColor ? deriveScreenSurround(skinColor) : null;
	const screenShadow = exportSafe
		? "inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15)"
		: "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 1.5px 3px rgba(0,0,0,0.6), 0 1px 0.5px rgba(255,255,255,0.12)";

	return (
		<div
			className="relative z-10 mx-auto shrink-0 p-[1.5px]"
			style={{
				background: `linear-gradient(180deg, ${surround?.top ?? getSurfaceToken("screen.surround.top")} 0%, ${surround?.mid ?? getSurfaceToken("screen.surround.mid")} 16%, ${surround?.bottom ?? getSurfaceToken("screen.surround.bottom")} 100%)`,
				boxShadow: screenShadow,
				width: screenTokens.frameWidth,
				height: screenTokens.frameHeight,
				borderRadius: screenTokens.outerRadius,
			}}
			data-export-layer="screen"
			data-testid="ipod-screen"
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.25), inset 0 -0.5px 0 rgba(0,0,0,0.1)",
					borderRadius: screenTokens.outerRadius,
				}}
				aria-hidden="true"
			/>
			<div
				ref={frameRef}
				className="relative h-full w-full overflow-hidden border"
				style={{
					backgroundColor: getSurfaceToken("screen.content.bg"),
					borderColor: "rgba(0,0,0,0.6)",
					borderRadius: screenTokens.innerRadius,
					fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
				}}
			>
				<IpodStatusBar
					screenTokens={screenTokens}
					showOsMenu={showOsMenu}
				/>
				{children}
				<IpodGlassOverlay exportSafe={exportSafe} />
			</div>
		</div>
	);
}
