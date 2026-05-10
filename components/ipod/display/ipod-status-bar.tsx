"use client";

import { getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { screenChromeTokens } from "@/lib/design-system";
import { ScreenBattery } from "@/components/ipod/display/screen-battery";

interface IpodStatusBarProps {
	screenTokens: IpodClassicPresetDefinition["screen"];
	showOsMenu: boolean;
	batteryLevel?: number;
}

export function IpodStatusBar({ screenTokens, showOsMenu, batteryLevel = 1.0 }: IpodStatusBarProps) {
	const statusBarTokens = screenChromeTokens.statusBar;

	return (
		<div
			className="flex items-center justify-between border-b relative"
			style={{
				height: screenTokens.statusBarHeight,
				paddingInline: screenTokens.statusBarPaddingX,
				backgroundImage: `linear-gradient(180deg, ${getSurfaceToken("screen.statusbar.bg.from")} 0%, ${getSurfaceToken("screen.statusbar.bg.to")} 100%)`,
				borderColor: screenChromeTokens.statusBar.divider,
			}}
		>
			{/* Top highlight for metallic feel */}
			<div className="absolute top-0 left-0 right-0 h-[0.5px] bg-white/40" />

			<div
				className="flex items-center gap-[4px] font-bold leading-none tracking-[-0.015em]"
				style={{
					color: getTextTokenCss("screen.statusbar.text"),
					fontSize: Math.max(9, screenTokens.statusBarHeight - 7),
					paddingLeft: 2, // Tiny bit of margin from the left
				}}
				data-testid="screen-status-label"
			>
				<span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
			</div>
			<div className="flex items-center gap-[6px]">
				{!showOsMenu && (
					<div className="relative flex items-center justify-center">
						<svg
							aria-hidden="true"
							className="shrink-0 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]"
							viewBox="0 0 10 10"
							style={{ width: 11, height: 11 }}
						>
							<defs>
								<linearGradient id="play-grad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#6DB1E0" />
									<stop offset="50%" stopColor="#3786BB" />
									<stop offset="100%" stopColor="#2A6A95" />
								</linearGradient>
							</defs>
							<path
								d="M2.5 1.5L9.5 5.5L2.5 9.5Z"
								fill="url(#play-grad)"
								stroke="rgba(0,0,0,0.15)"
								strokeWidth="0.5"
								strokeLinejoin="round"
							/>
							{/* Soft top highlight */}
							<path
								d="M3.2 2.8L7.8 5.5L3.2 8.2V2.8Z"
								fill="rgba(255,255,255,0.25)"
							/>
						</svg>
					</div>
				)}
				<ScreenBattery level={batteryLevel} />
			</div>
		</div>
	);
}
