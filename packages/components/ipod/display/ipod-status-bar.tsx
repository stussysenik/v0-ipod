"use client";

import { getTextTokenCss } from "@ipod/lib/color-manifest";
import type { IpodClassicPresetDefinition } from "@ipod/lib/ipod-classic-presets";
import { screenChromeTokens } from "@ipod/lib/design-system";
import { ScreenBattery } from "@ipod/components/ipod/display/screen-battery";

interface IpodStatusBarProps {
	screenTokens: IpodClassicPresetDefinition["screen"];
	showOsMenu: boolean;
	batteryLevel?: number;
	/** Override the status label. Defaults to the music-OS title. */
	title?: string;
	/** Whether to show the playback indicator. Defaults to `!showOsMenu`. */
	showPlayIndicator?: boolean;
}

export function IpodStatusBar({
	screenTokens,
	showOsMenu,
	batteryLevel = 1.0,
	title,
	showPlayIndicator,
}: IpodStatusBarProps) {
	const statusBarTokens = screenChromeTokens.statusBar;
	const label = title ?? (showOsMenu ? "RE:MIX" : "Now Playing");
	const playVisible = showPlayIndicator ?? !showOsMenu;

	return (
		<div
			className="flex items-center justify-between border-b relative"
			style={{
				height: screenTokens.statusBarHeight,
				paddingInline: screenTokens.statusBarPaddingX,
				backgroundImage: "none",
				backgroundColor: "#f9fafb",
				borderColor: "#e5e7eb",
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
				<span>{label}</span>
			</div>
			<div className="flex items-center gap-[5px]">
				{playVisible && (
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
