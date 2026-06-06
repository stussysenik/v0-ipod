"use client";

import { useCallback } from "react";

import { isAuthenticInteractionModel } from "@/lib/ipod-state/selectors";
import type { IpodWorkbenchModel } from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";

/**
 * Canonical top-level menu for the iPod classic OS.
 *
 * Shared by every surface that drives the click wheel — the authoring
 * workbench and the focused 3D stage — so menu length and ordering stay in
 * lockstep across views.
 */
export const CLASSIC_OS_MENU_ITEMS = [
	{ id: "music", label: "Music" },
	{ id: "videos", label: "Videos" },
	{ id: "photos", label: "Photos" },
	{ id: "podcasts", label: "Podcasts" },
	{ id: "extras", label: "Extras" },
	{ id: "settings", label: "Settings" },
	{ id: "shuffle-songs", label: "Shuffle Songs" },
	{ id: "now-playing", label: "Now Playing" },
	{ id: "about", label: "About" },
] as const;

export interface ClickWheelControlsParams {
	model: IpodWorkbenchModel;
	dispatch: React.Dispatch<IpodWorkbenchAction>;
	/** Plays the mechanical click sample on wheel/button interaction. */
	playClick: () => void;
	/**
	 * Invoked when the user selects "Settings" from the menu. The workbench
	 * opens its settings panel here; lighter surfaces (e.g. the 3D stage) can
	 * pass a no-op or their own affordance.
	 */
	onOpenSettings?: () => void;
	/**
	 * Surfaces a transient status message (e.g. "Playing", or a queued-feature
	 * hint). Optional so headless surfaces can ignore it.
	 */
	onNotice?: (message: string) => void;
}

export interface ClickWheelControls {
	menuItems: typeof CLASSIC_OS_MENU_ITEMS;
	setOsScreen: (next: IpodWorkbenchModel["interaction"]["osScreen"]) => void;
	cycleOsMenu: (direction: number) => void;
	handleWheelSeek: (delta: number) => void;
	handleSeek: (direction: number) => void;
	handleOsMenuSelect: () => void;
	handleNowPlayingCenterClick: () => void;
	handleMenuButtonPress: () => void;
	handlePreviousButtonPress: () => void;
	handleNextButtonPress: () => void;
	handlePlayPauseButtonPress: () => void;
}

/**
 * Encapsulates the iPod click-wheel interaction model — menu cycling, seek,
 * select, and transport controls — against a workbench reducer.
 *
 * This is the single source of truth for "what the wheel does". Chrome-specific
 * side effects (opening settings, surfacing notices) are injected so the same
 * behavior can power both the full workbench and the focused 3D page without
 * duplicating the handler logic.
 */
export function useIpodClickWheelControls({
	model,
	dispatch,
	playClick,
	onOpenSettings,
	onNotice,
}: ClickWheelControlsParams): ClickWheelControls {
	const state = model.metadata;
	const osScreen = model.interaction.osScreen;
	const osMenuIndex = model.interaction.menuIndex;
	const isPlaying = model.interaction.isPlaying;
	const isAuthenticInteraction = isAuthenticInteractionModel(
		model.interaction.interactionModel,
	);

	const setOsScreen = useCallback(
		(nextScreen: IpodWorkbenchModel["interaction"]["osScreen"]) => {
			dispatch({ type: "SET_OS_SCREEN", payload: nextScreen });
		},
		[dispatch],
	);

	const cycleOsMenu = useCallback(
		(direction: number) => {
			dispatch({
				type: "CYCLE_OS_MENU",
				payload: { direction, total: CLASSIC_OS_MENU_ITEMS.length },
			});
			playClick();
		},
		[dispatch, playClick],
	);

	const handleWheelSeek = useCallback(
		(delta: number) => {
			if (osScreen === "menu") {
				cycleOsMenu(delta);
				return;
			}

			const step = 2;
			const nextTime = Math.max(
				0,
				Math.min(state.duration, state.currentTime + delta * step),
			);
			if (Math.floor(nextTime) !== Math.floor(state.currentTime)) {
				dispatch({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
				if (Math.abs(delta) > 0.5) playClick();
			}
		},
		[cycleOsMenu, dispatch, osScreen, playClick, state.currentTime, state.duration],
	);

	const handleSeek = useCallback(
		(direction: number) => {
			const step = 15;
			const nextTime = Math.max(
				0,
				Math.min(state.duration, state.currentTime + direction * step),
			);
			dispatch({ type: "UPDATE_CURRENT_TIME", payload: nextTime });
			playClick();
		},
		[dispatch, playClick, state.currentTime, state.duration],
	);

	const handleOsMenuSelect = useCallback(() => {
		const activeItem = CLASSIC_OS_MENU_ITEMS[osMenuIndex];
		if (!activeItem) return;

		switch (activeItem.id) {
			case "music":
			case "now-playing":
			case "shuffle-songs":
				setOsScreen("now-playing");
				return;
			case "settings":
				onOpenSettings?.();
				return;
			default:
				onNotice?.(`${activeItem.label} is queued for the fuller OS pass`);
		}
	}, [onNotice, onOpenSettings, osMenuIndex, setOsScreen]);

	const handleNowPlayingCenterClick = useCallback(() => {
		dispatch({ type: "TOGGLE_OS_NOW_PLAYING_EDITABLE" });
	}, [dispatch]);

	const handleMenuButtonPress = useCallback(() => {
		if (!isAuthenticInteraction) {
			// Direct mode: toggle between menu and now-playing
			setOsScreen(osScreen === "menu" ? "now-playing" : "menu");
			return;
		}
		dispatch({ type: "SET_OS_NOW_PLAYING_EDITABLE", payload: false });
		setOsScreen("menu");
	}, [dispatch, isAuthenticInteraction, osScreen, setOsScreen]);

	const handlePreviousButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			cycleOsMenu(-1);
			return;
		}
		handleSeek(-1);
	}, [cycleOsMenu, handleSeek, osScreen]);

	const handleNextButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			cycleOsMenu(1);
			return;
		}
		handleSeek(1);
	}, [cycleOsMenu, handleSeek, osScreen]);

	const handlePlayPauseButtonPress = useCallback(() => {
		if (osScreen === "menu") {
			setOsScreen("now-playing");
			return;
		}

		dispatch({ type: "TOGGLE_IS_PLAYING" });
		playClick();

		const nextIsPlaying = !isPlaying;
		onNotice?.(nextIsPlaying ? "Playing" : "Paused");
	}, [dispatch, isPlaying, onNotice, osScreen, playClick, setOsScreen]);

	return {
		menuItems: CLASSIC_OS_MENU_ITEMS,
		setOsScreen,
		cycleOsMenu,
		handleWheelSeek,
		handleSeek,
		handleOsMenuSelect,
		handleNowPlayingCenterClick,
		handleMenuButtonPress,
		handlePreviousButtonPress,
		handleNextButtonPress,
		handlePlayPauseButtonPress,
	};
}
