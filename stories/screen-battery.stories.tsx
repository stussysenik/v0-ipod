import { ScreenBattery } from "@/components/ipod/screen-battery";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Fields/Screen Battery",
	component: ScreenBattery,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: { level: 0.72 },
	argTypes: {
		level: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
	},
} satisfies Meta<typeof ScreenBattery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = { args: { level: 1 } };
export const Normal: Story = {};
export const Low: Story = { args: { level: 0.18 } };
export const Empty: Story = { args: { level: 0 } };
