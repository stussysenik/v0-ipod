import { Checkbox } from "@/components/ui/checkbox";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "UI/Checkbox",
	component: Checkbox,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
	args: { checked: true },
};

export const Disabled: Story = {
	args: { disabled: true },
};
