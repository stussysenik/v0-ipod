"use client";

import { useId } from "react";

import { screenChromeTokens } from "@/lib/design-system";

interface ScreenBatteryProps {
	level?: number;
}

export function ScreenBattery({
	level = screenChromeTokens.statusBar.battery.fillWidthRatio,
}: ScreenBatteryProps) {
	const batteryId = useId().replace(/:/g, "");
	const safeLevel = Math.min(Math.max(level, 0), 1);

	const svgWidth = 23;
	const svgHeight = 11;
	const shellWidth = 20;
	const shellHeight = 10;
	const terminalWidth = 2;
	const terminalHeight = 4;

	// The fill should be inside the shell's 1px border
	const fillX = 1.5;
	const fillY = 1.5;
	const fillWidth = Math.max(0, (shellWidth - 2) * safeLevel);
	const fillHeight = shellHeight - 2;

	return (
		<svg
			className="shrink-0"
			data-testid="screen-battery"
			aria-hidden="true"
			width={svgWidth}
			height={svgHeight}
			viewBox={`0 0 ${svgWidth} ${svgHeight}`}
			fill="none"
		>
			<defs>
				<linearGradient
					id={`${batteryId}-fill`}
					x1="0"
					y1={fillY}
					x2="0"
					y2={fillY + fillHeight}
					gradientUnits="userSpaceOnUse"
				>
					{/* Authentic 4-stop 3D Volumetric Apple Glass Green */}
					<stop offset="0%" stopColor="#A2E94A" />
					<stop offset="48%" stopColor="#71C31B" />
					<stop offset="50%" stopColor="#449704" />
					<stop offset="100%" stopColor="#5EBB0C" />
				</linearGradient>
			</defs>

			{/* Inner background (empty space) */}
			<rect
				x={0.5}
				y={0.5}
				width={shellWidth}
				height={shellHeight}
				rx={1}
				fill="#FFFFFF"
			/>

			{/* The Fill - vibrant citrus green with sharp Apple-style gloss */}
			{fillWidth > 0 && (
				<rect
					x={fillX}
					y={fillY}
					width={fillWidth}
					height={fillHeight}
					fill={`url(#${batteryId}-fill)`}
				/>
			)}

			{/* Battery Shell (1px crisp border) */}
			<rect
				x={0.5}
				y={0.5}
				width={shellWidth}
				height={shellHeight}
				rx={1}
				stroke="#444444"
				strokeWidth={1}
				fill="none"
			/>

			{/* Terminal (the nub) */}
			<path
				d={`M ${shellWidth + 0.5} ${(svgHeight - terminalHeight) / 2} h ${terminalWidth} v ${terminalHeight} h -${terminalWidth} Z`}
				fill="#444444"
			/>
		</svg>
	);
}
