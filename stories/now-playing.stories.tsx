import { fn } from "@storybook/test";

import { ClickWheel } from "@/components/ipod/click-wheel";
import { IPodDeviceShell } from "@/components/ipod/ipod-device-shell";
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

interface NowPlayingArgs {
	skinColor: string;
	exportSafe: boolean;
}

function NowPlayingComposition({ skinColor, exportSafe }: NowPlayingArgs) {
	return (
		<IPodDeviceShell
			exportSafe={exportSafe}
			screen={
				<IpodScreen
					dispatch={fn()}
					exportSafe={exportSafe}
					interactionModel="direct"
					isEditable={false}
					osScreen="now-playing"
					playClick={fn()}
					preset={preset}
					skinColor={skinColor}
					state={baseState}
				/>
			}
			showShadowLayer={exportSafe}
			skinColor={skinColor}
			wheel={
				<ClickWheel
					exportSafe={exportSafe}
					playClick={fn()}
					preset={preset}
					skinColor={skinColor}
					onSeek={fn()}
				/>
			}
		/>
	);
}

const meta = {
	title: "iPod/Now Playing",
	component: NowPlayingComposition,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		...compatParameters("satori"),
		docs: {
			description: {
				component: "Full device composition: shell + screen + wheel. This is the canonical Phase-1 frame that the Figma push treats as the product surface.",
			},
		},
	},
	args: {
		skinColor: "#1A1A1A",
		exportSafe: true,
	},
	argTypes: {
		skinColor: { control: "color" },
		exportSafe: { control: "boolean" },
	},
} satisfies Meta<typeof NowPlayingComposition>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Black: Story = {};

export const Silver: Story = {
	args: { skinColor: "#C8C9CB" },
};
