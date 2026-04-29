import { Switch } from "@/components/ui/switch";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "UI/Switch",
	component: Switch,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
	args: { checked: true },
};

export const Disabled: Story = {
	args: { disabled: true },
};
