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

	// High-fidelity dimensions to match the reference image exactly
	// Reference shows a clean outline with the fill sitting perfectly inside the strokes
	const svgWidth = 18.5; // Width including the terminal
	const svgHeight = 8;
	const shellWidth = 16.5;
	const shellHeight = 8;
	const terminalWidth = 1.5;
	const terminalHeight = 3.5;

	// The fill should be inside the shell's 1px border
	const fillX = 1;
	const fillY = 1;
	const fillWidth = (shellWidth - 2) * safeLevel;
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
					y1="1"
					x2="0"
					y2="7"
					gradientUnits="userSpaceOnUse"
				>
					{/* Authentic 3D Volumetric Apple 'Battery Green' */}
					<stop offset="0" stopColor="#E2F5B6" />
					<stop offset="0.1" stopColor="#81D72B" />
					<stop offset="0.5" stopColor="#4BB30B" />
					<stop offset="0.55" stopColor="#6AC914" />
					<stop offset="1" stopColor="#9DE43E" />
				</linearGradient>
			</defs>

			{/* Battery Shell and Terminal as a single dark path */}
			<path
				d={`
          M 1 0 
          H ${shellWidth - 1} 
          Q ${shellWidth} 0, ${shellWidth} 1 
          V ${(svgHeight - terminalHeight) / 2} 
          H ${shellWidth + terminalWidth - 0.5} 
          Q ${shellWidth + terminalWidth} ${(svgHeight - terminalHeight) / 2}, ${shellWidth + terminalWidth} ${(svgHeight - terminalHeight) / 2 + 0.5} 
          V ${(svgHeight + terminalHeight) / 2 - 0.5} 
          Q ${shellWidth + terminalWidth} ${(svgHeight + terminalHeight) / 2}, ${shellWidth + terminalWidth - 0.5} ${(svgHeight + terminalHeight) / 2} 
          H ${shellWidth} 
          V ${shellHeight - 1} 
          Q ${shellWidth} ${shellHeight}, ${shellWidth - 1} ${shellHeight} 
          H 1 
          Q 0 ${shellHeight}, 0 ${shellHeight - 1} 
          V 1 
          Q 0 0, 1 0 
          Z
        `}
				fill="#555555"
			/>

			{/* Inner background (empty space) */}
			<rect
				x={fillX}
				y={fillY}
				width={shellWidth - 2}
				height={fillHeight}
				fill="#FFFFFF"
			/>

			{/* The Fill - vibrant citrus green with sharp Apple-style gloss */}
			{fillWidth > 0 && (
				<>
					<rect
						x={fillX}
						y={fillY}
						width={fillWidth}
						height={fillHeight}
						fill={`url(#${batteryId}-fill)`}
					/>
					{/* Horizontal highlight for 'glassy' depth - sharp Apple-style gloss */}
					<rect
						x={fillX}
						y={fillY}
						width={fillWidth}
						height={fillHeight / 2}
						fill="rgba(255,255,255,0.42)"
					/>
				</>
			)}
		</svg>
	);
}
