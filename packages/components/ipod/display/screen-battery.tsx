"use client";

import { useId } from "react";

import { screenChromeTokens } from "@ipod/lib/design-system";

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
	const fH = bodyH - 1;
	// Use a small epsilon for "full" state to ensure visual determinism at 100%
	const isFull = safe >= 0.98;
	// At threshold, we fill the body completely to connect seamlessly with the terminal
	const cW = isFull ? bodyW : Math.max(0, (bodyW - 1) * safe);

	const bodyRight = bodyW + 0.5;
	const bodyBottom = bodyH + 1.5;
	const termX = bodyW + 0.5;
	const termY = (bodyH - capH) / 2 + 1.5;
	const termRight = termX + capW;
	const termBottom = termY + capH;

	const shellD = [
		`M ${0.5 + rx} 1.5`,
		`L ${bodyRight - rx} 1.5`,
		`Q ${bodyRight} 1.5 ${bodyRight} ${1.5 + rx}`,
		`L ${bodyRight} ${termY}`,
		`L ${termRight - rx} ${termY}`,
		`Q ${termRight} ${termY} ${termRight} ${termY + rx}`,
		`L ${termRight} ${termBottom - rx}`,
		`Q ${termRight} ${termBottom} ${termRight - rx} ${termBottom}`,
		`L ${bodyRight} ${termBottom}`,
		`L ${bodyRight} ${bodyBottom - rx}`,
		`Q ${bodyRight} ${bodyBottom} ${bodyRight - rx} ${bodyBottom}`,
		`L ${0.5 + rx} ${bodyBottom}`,
		`Q 0.5 ${bodyBottom} 0.5 ${bodyBottom - rx}`,
		`L 0.5 ${1.5 + rx}`,
		`Q 0.5 1.5 ${0.5 + rx} 1.5`,
		"Z",
	].join(" ");

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
			</defs>

			{/* Background Fill Layer */}
			<path d={shellD} fill={t.background} />

			{/* Charge fill: body interior */}
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

			{/* Terminal nub fills green at 100% (deterministic threshold) */}
			{isFull && (
				<>
					<rect
						x={termX - 0.5}
						y={termY + 0.5}
						width={capW + 0.5}
						height={capH - 1}
						fill={`url(#${id}-fill)`}
						rx={0.5}
					/>
					<rect
						x={termX}
						y={termY + 0.5}
						width={capW - 1}
						height={Math.max(1, Math.ceil(capH * 0.35))}
						fill={t.highlight}
						rx={0.5}
					/>
				</>
			)}

			{/* Stroke Layer: Top-most to ensure "pixel detail" consistency of the outline */}
			<path d={shellD} stroke={t.border} strokeWidth={1} pointerEvents="none" />
		</svg>
	);
}
