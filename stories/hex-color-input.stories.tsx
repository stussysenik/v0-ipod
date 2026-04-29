import { fn } from "@storybook/test";

import { HexColorInput } from "@/components/ipod/hex-color-input";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Controls/Hex Color Input",
	component: HexColorInput,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		value: "#1A1A1A",
		onChange: fn(),
	},
} satisfies Meta<typeof HexColorInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Black: Story = {};

export const Silver: Story = {
	args: { value: "#C8C9CB" },
};

export const Red: Story = {
	args: { value: "#D73B39" },
};
