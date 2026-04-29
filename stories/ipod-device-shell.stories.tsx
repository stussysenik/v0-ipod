import { IPodDeviceShell } from "@/components/ipod/ipod-device-shell";

import { compatParameters } from "../.storybook/shared";

import type { Meta, StoryObj } from "@storybook/react";

const placeholderScreen = (
	<div
		style={{
			width: 310,
			height: 228,
			borderRadius: 8,
			background: "linear-gradient(180deg,#F6F7F9 0%,#E8EAED 58%,#D8DCE1 100%)",
			border: "1px solid #C5C8CC",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			color: "#6B7280",
			fontSize: 12,
		}}
	>
		screen slot
	</div>
);

const placeholderWheel = (
	<div
		style={{
			width: 200,
			height: 200,
			borderRadius: "50%",
			background: "radial-gradient(circle at 38% 26%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg,#F0F1F2,#D8DADC)",
			border: "1px solid #AAB0B6",
		}}
	/>
);

const meta = {
	title: "iPod/Shell/Device Shell",
	component: IPodDeviceShell,
	tags: ["autodocs"],
	parameters: compatParameters("satori"),
	args: {
		skinColor: "#1A1A1A",
		screen: placeholderScreen,
		wheel: placeholderWheel,
		exportSafe: false,
		showShadowLayer: false,
	},
	argTypes: {
		skinColor: { control: "color" },
		exportSafe: { control: "boolean" },
		showShadowLayer: { control: "boolean" },
	},
} satisfies Meta<typeof IPodDeviceShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Black: Story = {};

export const Silver: Story = {
	args: { skinColor: "#C8C9CB" },
};

export const ExportSafe: Story = {
	args: { exportSafe: true, showShadowLayer: true },
};
