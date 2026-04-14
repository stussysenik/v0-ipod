"use client";

import { forwardRef } from "react";

import {
	BASE_EXPORT_SCENE_HEIGHT,
	BASE_EXPORT_SCENE_WIDTH,
	type ExportPresetId,
	getExportPreset,
	getExportSceneScale,
} from "@/lib/export-scene";

import { IPodDeviceShell } from "./ipod-device-shell";

interface FramedExportStageProps {
	presetId: ExportPresetId;
	backgroundColor: string;
	skinColor: string;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	exportSafe?: boolean;
	showShadowLayer?: boolean;
	dataTestId?: string;
	className?: string;
}

const FramedExportStageInner = forwardRef<HTMLDivElement, FramedExportStageProps>(
	(
		{
			presetId,
			backgroundColor,
			skinColor,
			screen,
			wheel,
			exportSafe = false,
			showShadowLayer = false,
			dataTestId,
			className = "",
		},
		ref,
	) => {
		const preset = getExportPreset(presetId);
		const scale = getExportSceneScale(presetId);

		return (
			<div
				ref={ref}
				className={`relative overflow-hidden ${className}`}
				data-testid={dataTestId}
				style={{
					width: `${preset.width}px`,
					height: `${preset.height}px`,
					backgroundColor,
				}}
			>
				<div
					className="absolute left-1/2 top-1/2 origin-top-left"
					style={{
						width: `${BASE_EXPORT_SCENE_WIDTH}px`,
						height: `${BASE_EXPORT_SCENE_HEIGHT}px`,
						transform: `translate(-50%, -50%) translateY(${preset.offsetY}px) scale(${scale})`,
					}}
				>
					<IPodDeviceShell
						exportSafe={exportSafe}
						screen={screen}
						showShadowLayer={showShadowLayer}
						skinColor={skinColor}
						wheel={wheel}
					/>
				</div>
			</div>
		);
	},
);
FramedExportStageInner.displayName = "FramedExportStage";
export const FramedExportStage = FramedExportStageInner;
