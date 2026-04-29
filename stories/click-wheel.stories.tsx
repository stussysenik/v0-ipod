import { fn } from "@storybook/test";

import { ClickWheel } from "@/components/ipod/click-wheel";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const preset = getIpodClassicPreset("classic-2008-black");

const meta = {
	title: "iPod/Wheel/Click Wheel",
	component: ClickWheel,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		preset,
		playClick: fn(),
		onSeek: fn(),
		onCenterClick: fn(),
		onMenuPress: fn(),
		onPreviousPress: fn(),
		onNextPress: fn(),
		onPlayPausePress: fn(),
		disabled: false,
		exportSafe: false,
	},
	argTypes: {
		skinColor: { control: "color" },
	},
} satisfies Meta<typeof ClickWheel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Silver: Story = {
	args: { skinColor: "#C8C9CB" },
};

export const ExportSafe: Story = {
	args: { exportSafe: true },
};

export const Disabled: Story = {
	args: { disabled: true },
};
