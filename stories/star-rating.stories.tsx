import { fn } from "@storybook/test";

import { StarRating } from "@/components/ipod/star-rating";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "iPod/Fields/Star Rating",
	component: StarRating,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		rating: 4,
		onChange: fn(),
	},
	argTypes: {
		rating: { control: { type: "range", min: 0, max: 5, step: 1 } },
	},
} satisfies Meta<typeof StarRating>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FiveStars: Story = { args: { rating: 5 } };
export const FourStars: Story = {};
export const Unrated: Story = { args: { rating: 0 } };
