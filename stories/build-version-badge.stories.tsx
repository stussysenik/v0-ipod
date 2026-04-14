import { BuildVersionBadge } from "@/components/build-version-badge";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";

const meta = {
	title: "App/Build Version Badge",
	component: BuildVersionBadge,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		initialVersion: "dev",
	},
	decorators: [
		(Story: ComponentType) => (
			<div style={{ position: "relative", width: 320, height: 80 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof BuildVersionBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dev: Story = {};

export const Hashed: Story = {
	args: { initialVersion: "a1b2c3d4e5f6" },
};
