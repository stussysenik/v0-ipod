import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { IpodScreen } from "./ipod-screen";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import {
	INITIAL_SONG_METADATA,
	DEFAULT_OS_NOW_PLAYING_LAYOUT,
	type IpodNowPlayingLayoutState,
} from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";

const classic2007 = getIpodClassicPreset("classic-2007");
const noopDispatch: React.Dispatch<IpodWorkbenchAction> = () => undefined;
const menuItems = [
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

const meta = {
	title: "components/ipod/display/IpodScreen",
	component: IpodScreen,
	args: {
		preset: classic2007,
		skinColor: "#E2E2E4",
		state: INITIAL_SONG_METADATA,
		dispatch: noopDispatch,
		playClick: fn(),
		interactionModel: "ipod-os",
		osScreen: "menu",
		osMenuItems: menuItems,
		osMenuIndex: 0,
		osOriginalMenuSplit: 0.54,
		osNowPlayingLayout: DEFAULT_OS_NOW_PLAYING_LAYOUT,
		onOsOriginalMenuSplitChange: fn(),
		onOsNowPlayingLayoutChange: fn<(nextLayout: IpodNowPlayingLayoutState) => void>(),
		isEditable: false,
		exportSafe: false,
		animateText: true,
		titlePreview: true,
		titleCaptureReady: true,
	},
	argTypes: {
		preset: {
			control: false,
		},
		state: {
			control: false,
		},
		dispatch: {
			control: false,
		},
		playClick: {
			control: false,
		},
		osMenuItems: {
			control: false,
		},
		onOsOriginalMenuSplitChange: {
			control: false,
		},
		onOsNowPlayingLayoutChange: {
			control: false,
		},
	},
	render: (args) => <IpodScreen {...args} />,
} satisfies Meta<typeof IpodScreen>;

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
		osScreen: "now-playing",
	},
};

export const BlackNowPlaying: Story = {
	args: {
		skinColor: "#1C1C1E",
		osScreen: "now-playing",
	},
};
