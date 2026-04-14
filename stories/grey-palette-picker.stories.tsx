import { fn } from "@storybook/test";

import { GreyPalettePicker } from "@/components/ipod/grey-palette-picker";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

function srgbOklchStub(l: number, _c: number, _h: number): string {
	const v = Math.max(0, Math.min(255, Math.round(l * 255)));
	return `#${v.toString(16).padStart(2, "0").repeat(3)}`.toUpperCase();
}

const meta = {
	title: "iPod/Controls/Grey Palette Picker",
	component: GreyPalettePicker,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		target: "case",
		currentColor: "#888888",
		onColorSelect: fn(),
		onColorCommit: fn(),
		oklchToHex: srgbOklchStub,
		oklchReady: true,
	},
} satisfies Meta<typeof GreyPalettePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CaseTarget: Story = {};

export const BackgroundTarget: Story = {
	args: { target: "bg", currentColor: "#F5F5F3" },
};

export const OklchUnready: Story = {
	args: { oklchReady: false },
};
