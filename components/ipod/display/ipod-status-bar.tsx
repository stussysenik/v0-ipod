"use client";

import { getSurfaceToken, getTextTokenCss } from "@/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { screenChromeTokens } from "@/lib/design-system";
import { ScreenBattery } from "@/components/ipod/display/screen-battery";

interface IpodStatusBarProps {
	screenTokens: IpodClassicPresetDefinition["screen"];
	showOsMenu: boolean;
}

export function IpodStatusBar({ screenTokens, showOsMenu }: IpodStatusBarProps) {
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
			<div className="flex items-center gap-[7px]">
				{!showOsMenu && (
					<div className="relative flex items-center justify-center">
						<svg
							aria-hidden="true"
							className="shrink-0 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.12)]"
							viewBox="0 0 10 9"
							style={{ width: 12, height: 11 }}
						>
							<path
								d="M1 0.5L9 4.5L1 8.5V0.5Z"
								fill={statusBarTokens.playIndicator}
								stroke="rgba(255,255,255,0.75)"
								strokeWidth="0.75"
								strokeLinejoin="round"
							/>
							{/* Internal volumetric highlight */}
							<path
								d="M2 1.8L7.5 4.5L2 7.2V1.8Z"
								fill="rgba(255,255,255,0.35)"
							/>
						</svg>
					</div>
				)}
				<ScreenBattery level={1} />
			</div>
		</div>
	);
}
