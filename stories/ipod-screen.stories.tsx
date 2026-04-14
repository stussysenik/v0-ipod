import { fn } from "@storybook/test";

import { IpodScreen } from "@/components/ipod/ipod-screen";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const preset = getIpodClassicPreset("classic-2008-black");

const baseState = {
	title: "Such Great Heights",
	artist: "The Postal Service",
	album: "Give Up",
	artwork: "",
	duration: 264,
	currentTime: 72,
	rating: 4,
	trackNumber: 3,
	totalTracks: 10,
};

const meta = {
	title: "iPod/Screen",
	component: IpodScreen,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		preset,
		state: baseState,
		dispatch: fn(),
		playClick: fn(),
		interactionModel: "direct",
		osScreen: "now-playing",
		isEditable: false,
		exportSafe: true,
	},
} satisfies Meta<typeof IpodScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NowPlaying: Story = {};

export const OsMenu: Story = {
	args: {
		interactionModel: "ipod-os",
		osScreen: "menu",
		osMenuItems: [
			{ id: "music", label: "Music" },
			{ id: "videos", label: "Videos" },
			{ id: "photos", label: "Photos" },
			{ id: "podcasts", label: "Podcasts" },
			{ id: "extras", label: "Extras" },
			{ id: "settings", label: "Settings" },
			{ id: "shuffle-songs", label: "Shuffle Songs" },
			{ id: "now-playing", label: "Now Playing" },
			{ id: "about", label: "About" },
		],
		osMenuIndex: 0,
	},
};

export const LongTitle: Story = {
	args: {
		state: {
			...baseState,
			title: "This Is An Extraordinarily Long Track Title That Should Marquee",
			artist: "A Band With An Equally Unreasonable Name",
		},
		animateText: true,
	},
};
