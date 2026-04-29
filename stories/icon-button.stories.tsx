import { Camera, Download, Share } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "UI/Icon Button",
	component: IconButton,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		icon: <Camera aria-hidden="true" className="h-5 w-5" />,
		label: "Capture",
	},
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
	args: { isActive: true },
};

export const Contrast: Story = {
	args: { contrast: true, icon: <Share aria-hidden="true" className="h-5 w-5" /> },
};

export const WithBadge: Story = {
	args: {
		icon: <Download aria-hidden="true" className="h-5 w-5" />,
		badge: "NEW",
	},
};

export const Disabled: Story = {
	args: { disabled: true },
};
