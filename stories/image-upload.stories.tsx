import { fn } from "@storybook/test";

import { ImageUpload } from "@/components/ipod/image-upload";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Controls/Image Upload",
	component: ImageUpload,
	tags: ["autodocs"],
	parameters: compatParameters("exclude"),
	args: {
		currentImage: "",
		onImageChange: fn(),
		className: "w-32 h-32 border border-neutral-200 rounded",
	},
} satisfies Meta<typeof ImageUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};
