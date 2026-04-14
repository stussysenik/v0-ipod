import IPodClassic from "@/components/ipod/ipod-classic";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Classic",
	component: IPodClassic,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
		...compatParameters("raster"),
		docs: {
			description: {
				component: "Top-level interactive iPod surface. Rendered as Phase 1 raster only — the interactive shell wraps the full state machine, settings sidebar, and 3D iframe which cannot be vector-serialized.",
			},
		},
	},
} satisfies Meta<typeof IPodClassic>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
