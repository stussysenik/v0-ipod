"use client";

import { useCallback, useEffect, useRef } from "react";
import { IpodDisplay } from "@/components/ipod/display/ipod-display";
import { useIpodNowPlayingLayout } from "@/components/ipod/hooks/use-ipod-now-playing-layout";
import { IpodMenuScene } from "@/components/ipod/scenes/ipod-menu-scene";
import { IpodNowPlayingScene } from "@/components/ipod/scenes/ipod-now-playing-scene";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { SongMetadata } from "@/types/ipod";
import type {
	IpodInteractionModel,
	IpodNowPlayingLayoutState,
	IpodOsScreen,
} from "@/lib/ipod-state/model";

interface IpodScreenProps {
	preset: IpodClassicPresetDefinition;
	skinColor?: string;
	state: SongMetadata;
	dispatch?: (action: any) => void;
	playClick: () => void;
	interactionModel?: IpodInteractionModel;
	osScreen?: IpodOsScreen;
	osMenuItems?: readonly { id: string; label: string }[];
	osMenuIndex?: number;
	osOriginalMenuSplit?: number;
	onOsOriginalMenuSplitChange?: (nextSplit: number) => void;
	osNowPlayingLayout?: IpodNowPlayingLayoutState;
	onOsNowPlayingLayoutChange?: (nextLayout: IpodNowPlayingLayoutState) => void;
	isEditable?: boolean;
	/**
	 * Dev-only layout tool: when true, Now Playing elements get dashed bounding boxes
	 * + drag handles for repositioning. Default false → no boxes ever, and direct
	 * inline editing stays on in every interaction model. Never derived from the
	 * interaction model, so it can't leak into a preview or export.
	 */
	layoutMode?: boolean;
	exportSafe?: boolean;
	animateText?: boolean;
	titlePreview?: boolean;
	titleCaptureReady?: boolean;
	onTitleOverflowChange?: (overflow: boolean) => void;
	batteryLevel?: number;
}

const EMPTY_OS_MENU_ITEMS: readonly { id: string; label: string }[] = [];

export function IpodScreen({
	preset,
	skinColor,
	state,
	dispatch: dispatchProp,
	playClick,
	osScreen = "now-playing",
	osMenuItems = EMPTY_OS_MENU_ITEMS,
	osMenuIndex = 0,
	osNowPlayingLayout = {},
	onOsNowPlayingLayoutChange,
	isEditable = true,
	layoutMode = false,
	exportSafe = false,
	animateText = false,
	titlePreview = false,
	titleCaptureReady = false,
	onTitleOverflowChange,
	batteryLevel = 1.0,
}: IpodScreenProps) {
	const send = dispatchProp;
	const remainingAnchorRef = useRef<number | null>(null);
	const screenTokens = preset.screen;
	const showOsMenu = osScreen === "menu";
	// Layout-drag mode (dashed bounding boxes + drag handles) is a DEV-ONLY tool,
	// gated solely on the `layoutMode` toggle — never on the interaction model. With
	// it off (the default), the boxes can never appear in the live view, a preview,
	// or an export, and direct inline editing stays on in EVERY interaction model.
	const isNowPlayingLayoutMode =
		layoutMode && !showOsMenu && isEditable && !exportSafe;
	// Saved element positions still render in any Now Playing view (default layout is
	// empty, so this is a no-op until a dev actually drags something in layout mode).
	const shouldApplyNowPlayingLayout = !showOsMenu;
	// Tap-to-edit text/artwork works in all models; only export and the dev layout
	// tool suppress it.
	const isInlineEditingEnabled =
		isEditable && !exportSafe && !isNowPlayingLayoutMode;
	// Layered "lift" so the cover reads as a physical tile sitting on the glossy
	// screen — a tight contact shadow for the edge + a soft ambient cast for depth.
	// This is most of the "pop": flat single shadows make album art look pasted on.
	const artworkShadow =
		"0 1px 2px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.20)";
	const { frameRef, renderElement } = useIpodNowPlayingLayout({
		isLayoutMode: isNowPlayingLayoutMode,
		shouldApplyLayout: shouldApplyNowPlayingLayout,
		layout: osNowPlayingLayout,
		statusBarHeight: screenTokens.statusBarHeight,
		onLayoutChange: onOsNowPlayingLayoutChange,
		playClick,
	});

	useEffect(() => {
		if (showOsMenu) {
			onTitleOverflowChange?.(false);
		}
	}, [showOsMenu, onTitleOverflowChange]);

	const setCurrentTime = useCallback(
		(currentTime: number, preserveRemaining = false) => {
			const safeCurrent = Math.max(0, Math.floor(currentTime));
			if (send) {
				send({ type: "UPDATE_CURRENT_TIME", payload: safeCurrent });
			}

			if (preserveRemaining && remainingAnchorRef.current !== null) {
				if (send) {
					send({
						type: "UPDATE_DURATION",
						payload: safeCurrent + remainingAnchorRef.current,
					});
				}
			}
		},
		[send],
	);

	const setRemainingTime = useCallback(
		(remainingSeconds: number) => {
			const safeRemaining = Math.max(0, Math.floor(remainingSeconds));
			remainingAnchorRef.current = safeRemaining;
			if (send) {
				send({
					type: "UPDATE_DURATION",
					payload: state.currentTime + safeRemaining,
				});
			}
		},
		[send, state.currentTime],
	);

	return (
		<IpodDisplay
			preset={preset}
			skinColor={skinColor}
			exportSafe={exportSafe}
			showOsMenu={showOsMenu}
			frameRef={frameRef}
			batteryLevel={batteryLevel}
		>
			{showOsMenu ? (
				<IpodMenuScene
					screenTokens={screenTokens}
					state={state}
					osMenuItems={osMenuItems}
					osMenuIndex={osMenuIndex}
					artworkShadow={artworkShadow}
				/>
			) : (
				<IpodNowPlayingScene
					screenTokens={screenTokens}
					state={state}
					dispatch={send as any}
					renderElement={renderElement}
					isInlineEditingEnabled={isInlineEditingEnabled}
					exportSafe={exportSafe}
					artworkShadow={artworkShadow}
					playClick={playClick}
					titlePreview={titlePreview}
					animateText={animateText}
					titleCaptureReady={titleCaptureReady}
					onTitleOverflowChange={onTitleOverflowChange}
					setCurrentTime={setCurrentTime}
					setRemainingTime={setRemainingTime}
					clearRemainingAnchor={() => {
						remainingAnchorRef.current = null;
					}}
				/>
			)}
		</IpodDisplay>
	);
}

