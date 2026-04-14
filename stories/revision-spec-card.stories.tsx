import { RevisionSpecCard } from "@/components/ipod/revision-spec-card";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";

const meta = {
	title: "iPod/Docs/Revision Spec Card",
	component: RevisionSpecCard,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		presetId: "classic-2008-black",
	},
	decorators: [
		(Story: ComponentType) => (
			<div style={{ width: 320 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof RevisionSpecCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Black2008: Story = {};

export const Silver2008: Story = {
	args: { presetId: "classic-2008-silver" },
};

export const Classic2007: Story = {
	args: { presetId: "classic-2007" },
};
