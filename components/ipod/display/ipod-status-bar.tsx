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
				borderColor: "rgba(0,0,0,0.08)",
			}}
		>
			<div
				className="flex items-center gap-[4px] font-bold leading-none tracking-[-0.03em]"
				style={{
					color: getTextTokenCss("screen.statusbar.text"),
					fontSize: Math.max(9, screenTokens.statusBarHeight - 7),
					paddingLeft: 2, // Tiny bit of margin from the left
				}}
				data-testid="screen-status-label"
			>
				<span>{showOsMenu ? "RE:MIX" : "Now Playing"}</span>
			</div>
			<div className="flex items-center gap-[5px]">
				{!showOsMenu && (
					<div className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
						<svg
							aria-hidden="true"
							className="shrink-0 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.12)]"
							viewBox="0 0 8 7"
							style={{ width: 14, height: 12 }}
						>
							<path
								d="M1.5 0.5L6.5 3.5L1.5 6.5V0.5Z"
								fill={statusBarTokens.playIndicator}
								stroke="rgba(255,255,255,0.75)"
								strokeWidth="0.75"
								strokeLinejoin="round"
							/>
							<path
								d="M2.5 1.5L5.5 3.5L2.5 5.5V1.5Z"
								fill="rgba(255,255,255,0.35)"
							/>
						</svg>
					</div>
				)}
				<ScreenBattery level={batteryLevel} />
			</div>
		</div>
	);
}
