import { fn } from "@storybook/test";

import { EditableTrackNumber } from "@/components/ipod/editable-track-number";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Fields/Editable Track Number",
	component: EditableTrackNumber,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		trackNumber: 3,
		totalTracks: 10,
		onTrackNumberChange: fn(),
		onTotalTracksChange: fn(),
	},
} satisfies Meta<typeof EditableTrackNumber>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Finale: Story = {
	args: { trackNumber: 12, totalTracks: 12 },
};

export const Disabled: Story = {
	args: { disabled: true },
};
