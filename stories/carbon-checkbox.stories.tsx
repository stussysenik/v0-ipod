import { CarbonCheckbox } from "@/components/ui/carbon-checkbox";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "UI/Carbon Checkbox",
	component: CarbonCheckbox,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
} satisfies Meta<typeof CarbonCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
	args: { checked: true },
};

export const Disabled: Story = {
	args: { disabled: true },
};

export const DisabledChecked: Story = {
	args: { disabled: true, checked: true },
};
