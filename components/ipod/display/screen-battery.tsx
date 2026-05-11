"use client";

import { useId } from "react";

import { screenChromeTokens } from "@/lib/design-system";

interface ScreenBatteryProps {
	level?: number;
}

export function ScreenBattery({
	level = screenChromeTokens.statusBar.battery.fillWidthRatio,
}: ScreenBatteryProps) {
	const id = useId().replace(/:/g, "");
	const t = screenChromeTokens.statusBar.battery;
	const safe = Math.min(Math.max(level, 0), 1);

	const bodyW = t.width;
	const bodyH = t.height;
	const capW = t.capWidth;
	const capH = t.capHeight;
	const rx = t.borderRadius;

	const svgW = bodyW + capW + 1;
	const svgH = bodyH + 4;

	const fX = 1;
	const fY = 2;
	const fW = bodyW - 1;
	const fH = bodyH - 1;
	const cW = Math.max(0, fW * safe);

	const termX = bodyW + 0.5;
	const termY = (bodyH - capH) / 2 + 1.5;

	return (
		<svg
			className="shrink-0"
			data-testid="screen-battery"
			aria-hidden="true"
			width={svgW}
			height={svgH}
			viewBox={`0 0 ${svgW} ${svgH}`}
			fill="none"
		>
			<defs>
				<linearGradient
					id={`${id}-fill`}
					x1="0"
					y1={fY}
					x2="0"
					y2={fY + fH}
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor={t.fillFrom} />
					<stop offset="45%" stopColor="#41A457" />
					<stop offset="100%" stopColor={t.fillTo} />
				</linearGradient>
				<linearGradient
					id={`${id}-term`}
					x1="0"
					y1={termY}
					x2="0"
					y2={termY + capH}
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="#8E8E8E" />
					<stop offset="100%" stopColor={t.border} />
				</linearGradient>
			</defs>

			{/* Charge fill */}
			{cW > 0 && (
				<>
					<rect
						x={fX}
						y={fY}
						width={cW}
						height={fH}
						fill={`url(#${id}-fill)`}
						rx={0.5}
					/>
					{cW >= 2 && (
						<rect
							x={fX + 0.5}
							y={fY + 0.5}
							width={cW - 1}
							height={Math.max(1, Math.ceil(fH * 0.35))}
							fill={t.highlight}
							rx={0.5}
						/>
					)}
				</>
			)}

			{/* Body shell */}
			<rect
				x={0.5}
				y={1.5}
				width={bodyW}
				height={bodyH}
				rx={rx}
				stroke={t.border}
				strokeWidth={1}
				fill="none"
			/>

			{/* Bottom contact terminal */}
			<rect
				x={bodyW * 0.3 + 0.5}
				y={bodyH + 1.5}
				width={bodyW * 0.4}
				height={1.5}
				rx={0.75}
				fill={t.border}
			/>

			{/* Top terminal nub */}
			<rect
				x={termX}
				y={termY}
				width={capW}
				height={capH}
				rx={0.75}
				fill={`url(#${id}-term)`}
			/>
		</svg>
	);
}
