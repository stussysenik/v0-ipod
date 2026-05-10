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
	const tokens = screenChromeTokens.statusBar.battery;
	const safeLevel = Math.min(Math.max(level, 0), 1);

	// Dimensions from tokens
	const shellWidth = tokens.width;
	const shellHeight = tokens.height;
	const terminalWidth = tokens.capWidth;
	const terminalHeight = tokens.capHeight;

	// Total SVG size needs to accommodate the terminal nub and stroke
	const svgWidth = shellWidth + terminalWidth + 1; 
	const svgHeight = shellHeight + 2; // Extra px for stroke safety

	// Integer boundaries — align fill precisely inside the 1px stroke shell.
	// Shell rect is at x=0.5 y=1.5; stroke inward offset is 0.5px on each side.
	const innerLeft = 1;
	const innerTop = 2;
	const innerWidth = shellWidth - 1;
	const innerHeight = shellHeight - 1; 

	// The fill occupies the entire shell interior with no inset gaps
	const fillX = innerLeft; 
	const fillY = innerTop; 
	const maxFillWidth = innerWidth; 
	const fillHeight = innerHeight; 

	const fillWidth = Math.max(0, maxFillWidth * safeLevel);

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
					{/* Reference shows a very vibrant, slightly volumetric green */}
					<stop offset="0%" stopColor="#A6E63A" />
					<stop offset="100%" stopColor="#69C00D" />
				</linearGradient>
			</defs>

			{/* The Fill - vibrant citrus green "brick" */}
			{fillWidth > 0 && (
				<rect
					x={fillX}
					y={fillY}
					width={fillWidth}
					height={fillHeight}
					fill={`url(#${batteryId}-fill)`}
					rx={0.5}
				/>
			)}

			{/* Battery Shell (prominent 1px border) */}
			<rect
				x={0.5}
				y={1.5}
				width={shellWidth}
				height={shellHeight}
				rx={1.5}
				stroke="#666666"
				strokeWidth={1}
				fill="none"
			/>

			{/* Terminal (the nub) */}
			<rect
				x={shellWidth + 0.5}
				y={(shellHeight - terminalHeight) / 2 + 1.5}
				width={terminalWidth}
				height={terminalHeight}
				fill="#666666"
				rx={0.5}
			/>
		</svg>
	);
}
