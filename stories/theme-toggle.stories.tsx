import { fn } from "@storybook/test";

import { ThemeToggle } from "@/components/ui/theme-toggle";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "UI/Theme Toggle",
	component: ThemeToggle,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		theme: "black",
		onToggle: fn(),
		showLabel: true,
	},
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Black: Story = {};

export const White: Story = {
	args: { theme: "white" },
};

export const NoLabel: Story = {
	args: { showLabel: false },
};
