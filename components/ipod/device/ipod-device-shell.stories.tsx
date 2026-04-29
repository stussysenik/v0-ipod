"use client";

import { useCallback, useReducer } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { IpodClickWheel } from "@/components/ipod/controls/ipod-click-wheel";
import { IpodScreen } from "@/components/ipod/display/ipod-screen";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import {
	createInitialIpodWorkbenchModel,
	type IpodHardwarePresetId,
	type IpodInteractionModel,
	type IpodOsScreen,
} from "@/lib/ipod-state/model";
import { ipodWorkbenchReducer } from "@/lib/ipod-state/update";
import { IPodDeviceShell } from "./ipod-device-shell";

const CLASSIC_OS_MENU_ITEMS = [
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

const MENU_TO_NOW_PLAYING = new Set(["music", "shuffle-songs", "now-playing"]);

interface PhysicalAssemblyStoryArgs {
	presetId: IpodHardwarePresetId;
	skinColor: string;
	interactionModel: IpodInteractionModel;
	initialScreen: IpodOsScreen;
	exportSafe: boolean;
	showShadowLayer: boolean;
}

function PhysicalAssemblyShowcase({
	presetId,
	skinColor,
	interactionModel,
	initialScreen,
	exportSafe,
	showShadowLayer,
}: PhysicalAssemblyStoryArgs) {
	const [model, dispatch] = useReducer(ipodWorkbenchReducer, undefined, () => {
		const initial = createInitialIpodWorkbenchModel();
		const preset = getIpodClassicPreset(presetId);

		return {
			...initial,
			presentation: {
				...initial.presentation,
				hardwarePreset: presetId,
				skinColor: skinColor || preset.defaultShellColor,
				bgColor: preset.defaultBackdropColor,
			},
			interaction: {
				...initial.interaction,
				interactionModel,
				osScreen:
					interactionModel === "direct"
						? "now-playing"
						: initialScreen,
				menuIndex: 0,
			},
		};
	});

	const activePreset = getIpodClassicPreset(model.presentation.hardwarePreset);
	const isMenuScreen =
		model.interaction.interactionModel !== "direct" &&
		model.interaction.osScreen === "menu";

	const openNowPlaying = useCallback(() => {
		dispatch({ type: "SET_OS_SCREEN", payload: "now-playing" });
	}, []);

	const openMenu = useCallback(() => {
		if (model.interaction.interactionModel === "direct") return;
		dispatch({ type: "SET_OS_SCREEN", payload: "menu" });
	}, [model.interaction.interactionModel]);

	const handleWheelSeek = useCallback(
		(direction: number) => {
			if (isMenuScreen) {
				dispatch({
					type: "CYCLE_OS_MENU",
					payload: { direction, total: CLASSIC_OS_MENU_ITEMS.length },
				});
				return;
			}

			dispatch({
				type: "UPDATE_CURRENT_TIME",
				payload: model.metadata.currentTime + direction * 5,
			});
		},
		[isMenuScreen, model.metadata.currentTime],
	);

	const handleCenterClick = useCallback(() => {
		if (!isMenuScreen) return;

		const activeItem = CLASSIC_OS_MENU_ITEMS[model.interaction.menuIndex];
		if (activeItem && MENU_TO_NOW_PLAYING.has(activeItem.id)) {
			openNowPlaying();
		}
	}, [isMenuScreen, model.interaction.menuIndex, openNowPlaying]);

	return (
		<div
			className="rounded-[40px] p-6"
			style={{
				background: "radial-gradient(circle at top, rgba(255,255,255,0.9) 0%, rgba(244,239,226,0.86) 38%, rgba(232,223,208,0.96) 100%)",
			}}
		>
			<IPodDeviceShell
				preset={activePreset}
				skinColor={model.presentation.skinColor}
				exportSafe={exportSafe}
				showShadowLayer={showShadowLayer}
				screen={
					<IpodScreen
						preset={activePreset}
						skinColor={model.presentation.skinColor}
						state={model.metadata}
						dispatch={dispatch}
						playClick={fn()}
						interactionModel={
							model.interaction.interactionModel
						}
						osScreen={model.interaction.osScreen}
						osMenuItems={CLASSIC_OS_MENU_ITEMS}
						osMenuIndex={model.interaction.menuIndex}
						osOriginalMenuSplit={
							model.interaction.osOriginalMenuSplit
						}
						onOsOriginalMenuSplitChange={(nextSplit) =>
							dispatch({
								type: "SET_OS_ORIGINAL_MENU_SPLIT",
								payload: nextSplit,
							})
						}
						osNowPlayingLayout={
							model.interaction.osNowPlayingLayout
						}
						onOsNowPlayingLayoutChange={(nextLayout) =>
							dispatch({
								type: "SET_OS_NOW_PLAYING_LAYOUT",
								payload: nextLayout,
							})
						}
						isEditable={false}
						exportSafe={exportSafe}
						animateText
						titlePreview
						titleCaptureReady
					/>
				}
				wheel={
					<IpodClickWheel
						preset={activePreset}
						skinColor={model.presentation.skinColor}
						playClick={fn()}
						onSeek={handleWheelSeek}
						onCenterClick={handleCenterClick}
						onMenuPress={openMenu}
						onPreviousPress={() => handleWheelSeek(-1)}
						onNextPress={() => handleWheelSeek(1)}
						onPlayPausePress={openNowPlaying}
						exportSafe={exportSafe}
					/>
				}
			/>
		</div>
	);
}

const meta = {
	title: "components/ipod/device/PhysicalIpod",
	component: PhysicalAssemblyShowcase,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Repository-default review surface for the physical iPod assembly. Use this lane for hardware finish, screen chrome, and click-wheel fidelity work before checking the full workbench flow.",
			},
		},
	},
	args: {
		presetId: "classic-2007",
		skinColor: "#E2E2E4",
		interactionModel: "ipod-os",
		initialScreen: "menu",
		exportSafe: false,
		showShadowLayer: true,
	},
	argTypes: {
		presetId: {
			control: "select",
			options: ["classic-2007", "classic-2008", "classic-2009"],
		},
		interactionModel: {
			control: "inline-radio",
			options: ["direct", "ipod-os", "ipod-os-original"],
		},
		initialScreen: {
			control: "inline-radio",
			options: ["menu", "now-playing"],
		},
	},
	render: (args) => (
		<PhysicalAssemblyShowcase
			key={JSON.stringify(args)}
			{...(args as PhysicalAssemblyStoryArgs)}
		/>
	),
} satisfies Meta<typeof PhysicalAssemblyShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightMenu: Story = {};

export const BlackMenu: Story = {
	args: {
		skinColor: "#1C1C1E",
	},
};

export const LightNowPlaying: Story = {
	args: {
		initialScreen: "now-playing",
	},
};

export const BlackNowPlaying: Story = {
	args: {
		skinColor: "#1C1C1E",
		initialScreen: "now-playing",
	},
};
