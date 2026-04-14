"use client";

import { screenChromeTokens } from "@/lib/design-system";

interface ScreenBatteryProps {
	level?: number;
}

export function ScreenBattery({
	level = screenChromeTokens.statusBar.battery.fillWidthRatio,
}: ScreenBatteryProps) {
	const { battery } = screenChromeTokens.statusBar;
	const safeLevel = Math.min(Math.max(level, 0), 1);
	const bodyWidth = battery.width - battery.fillInset * 2;
	const fillWidth = Math.max(2, bodyWidth * safeLevel);

	return (
		<div
			aria-hidden="true"
			className="flex shrink-0 items-center"
			data-testid="screen-battery"
			style={{ gap: battery.gap }}
		>
			<div
				className="relative"
				style={{
					width: battery.width,
					height: battery.height,
					borderRadius: battery.borderRadius,
					border: `1px solid ${battery.border}`,
					backgroundColor: battery.background,
					boxShadow: `inset 0 1px 0 ${battery.highlight}`,
				}}
			>
				<div
					className="absolute rounded-[0.5px]"
					style={{
						top: battery.fillInset,
						bottom: battery.fillInset,
						left: battery.fillInset,
						width: fillWidth,
						backgroundImage: `linear-gradient(180deg, ${battery.fillFrom} 0%, ${battery.fillTo} 100%)`,
					}}
				/>
			</div>
			<div
				style={{
					width: battery.capWidth,
					height: battery.capHeight,
					borderTopRightRadius: battery.borderRadius,
					borderBottomRightRadius: battery.borderRadius,
					backgroundColor: battery.border,
				}}
			/>
		</div>
	);
}
