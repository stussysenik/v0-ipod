"use client";

import React from "react";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import { deriveGasketColor } from "@/lib/color-proximity";
import { clsx, type ClassValue } from "clsx";
import { ipodDeviceVariants } from "./ipod-device-variants";

import { liveTheme, captureTheme, vars } from "@/lib/ipod-state/theme.css";

function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

interface IpodDeviceProps {
	preset: IpodClassicPresetDefinition;
	skinColor: string;
	exportSafe?: boolean;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	viewMode?: "flat" | "3d" | "focus" | "preview" | "ascii";
	className?: string;
}

export function IpodDevice({
	preset,
	skinColor,
	exportSafe = false,
	screen,
	wheel,
	viewMode = "flat",
	className,
}: IpodDeviceProps) {
	const shellShadow = exportSafe
		? "0 0 0 0.5px rgba(82,88,97,0.10)"
		: "0 16px 32px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(88,94,102,0.15), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.08)";

	const gasketColor = deriveGasketColor(skinColor);
	const activeTheme = exportSafe ? captureTheme : liveTheme;

	return (
		<div
			className={cn(
				"flex flex-col items-center overflow-hidden",
				ipodDeviceVariants({ 
					viewMode, 
					preset: (preset.id as any) || "custom",
					materiality: viewMode === "ascii" ? "flat" : "physical"
				}),
				activeTheme,
				className
			)}
			style={{
				width: preset.shell.width,
				height: preset.shell.height,
				backgroundColor: skinColor,
				boxShadow: viewMode === "ascii" ? "none" : shellShadow,
				borderRadius: preset.shell.radius,
				paddingLeft: preset.shell.paddingX,
				paddingRight: preset.shell.paddingX,
				paddingTop: preset.shell.paddingTop,
				paddingBottom: preset.shell.paddingBottom,
				"--skin-color": skinColor,
				"--gasket-color": gasketColor,
			} as React.CSSProperties}
			data-export-layer="shell"
		>
			{/* Machined chamfer — only visible in non-ASCII modes */}
			{viewMode !== "ascii" && (
				<div
					className="pointer-events-none absolute inset-0"
					aria-hidden="true"
					style={{
						borderRadius: preset.shell.radius,
						boxShadow: vars.material.chamferShadow,
					}}
				/>
			)}

			{/* Specular sheen — only visible in non-ASCII modes */}
			{viewMode !== "ascii" && (
				<div
					className="pointer-events-none absolute inset-[2px]"
					aria-hidden="true"
					style={{
						borderRadius: preset.shell.innerRadius,
						background: vars.material.specularSheen,
					}}
				/>
			)}

			{/* Screen gasket */}
			<div
				className="relative z-10 w-full"
				style={{
					backgroundColor: vars.material.gasketColor,
					borderRadius: preset.screen.outerRadius,
				}}
			>
				{screen}
			</div>

			<div
				className="relative z-10 flex justify-center"
				style={{ marginTop: preset.shell.controlMarginTop }}
			>
				{wheel}
			</div>
		</div>
	);
}
