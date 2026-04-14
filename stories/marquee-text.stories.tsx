import { MarqueeText } from "@/components/ui/marquee-text";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";

const meta = {
	title: "UI/Marquee Text",
	component: MarqueeText,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		text: "Such Great Heights — The Postal Service",
	},
	decorators: [
		(Story: ComponentType) => (
			<div style={{ width: 200, border: "1px dashed #C8C9CB", padding: 4 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof MarqueeText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverflowPreview: Story = {
	args: {
		text: "An exceptionally long track title designed to exceed the viewport width",
		preview: true,
		captureReady: true,
	},
};
