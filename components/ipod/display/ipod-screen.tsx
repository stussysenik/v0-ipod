"use client";

import { useCallback, useEffect, useRef } from "react";
import { IpodDisplay } from "@/components/ipod/display/ipod-display";
import { useIpodNowPlayingLayout } from "@/components/ipod/hooks/use-ipod-now-playing-layout";
import { IpodMenuScene } from "@/components/ipod/scenes/ipod-menu-scene";
import { IpodNowPlayingScene } from "@/components/ipod/scenes/ipod-now-playing-scene";
import { isStandardOsInteractionModel } from "@/lib/ipod-state/selectors";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
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
	dispatch: React.Dispatch<IpodWorkbenchAction>;
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
	dispatch,
	playClick,
	interactionModel = "direct",
	osScreen = "now-playing",
	osMenuItems = EMPTY_OS_MENU_ITEMS,
	osMenuIndex = 0,
	osNowPlayingLayout = {},
	onOsNowPlayingLayoutChange,
	isEditable = true,
	exportSafe = false,
	animateText = false,
	titlePreview = false,
	titleCaptureReady = false,
	onTitleOverflowChange,
	batteryLevel = 1.0,
}: IpodScreenProps) {
	const remainingAnchorRef = useRef<number | null>(null);
	const screenTokens = preset.screen;
	const showOsMenu = isStandardOsInteractionModel(interactionModel) && osScreen === "menu";
	const isNowPlayingLayoutMode =
		isStandardOsInteractionModel(interactionModel) &&
		!showOsMenu &&
		isEditable &&
		!exportSafe;
	const shouldApplyNowPlayingLayout =
		isStandardOsInteractionModel(interactionModel) && !showOsMenu;
	const isInlineEditingEnabled = isEditable && !isNowPlayingLayoutMode;
	const artworkShadow = "0 1px 2px rgba(0,0,0,0.14)";
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
			dispatch({ type: "UPDATE_CURRENT_TIME", payload: safeCurrent });

			if (preserveRemaining && remainingAnchorRef.current !== null) {
				dispatch({
					type: "UPDATE_DURATION",
					payload: safeCurrent + remainingAnchorRef.current,
				});
			}
		},
		[dispatch],
	);

	const setRemainingTime = useCallback(
		(remainingSeconds: number) => {
			const safeRemaining = Math.max(0, Math.floor(remainingSeconds));
			remainingAnchorRef.current = safeRemaining;
			dispatch({
				type: "UPDATE_DURATION",
				payload: state.currentTime + safeRemaining,
			});
		},
		[dispatch, state.currentTime],
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
					dispatch={dispatch}
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
