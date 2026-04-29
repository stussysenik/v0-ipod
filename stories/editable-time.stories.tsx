import { fn } from "@storybook/test";

import { EditableTime } from "@/components/ipod/editable-time";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Fields/Editable Time",
	component: EditableTime,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		value: 72,
		onChange: fn(),
	},
} satisfies Meta<typeof EditableTime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Elapsed: Story = {};

export const Remaining: Story = {
	args: { value: 192, isRemaining: true },
};

export const Disabled: Story = {
	args: { disabled: true },
};
