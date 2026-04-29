import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";
import { IpodStatusBar } from "./ipod-status-bar";

const classic2007 = getIpodClassicPreset("classic-2007");

const meta = {
	title: "components/ipod/display/IpodStatusBar",
	component: IpodStatusBar,
	args: {
		screenTokens: classic2007.screen,
		showOsMenu: true,
	},
	argTypes: {
		screenTokens: {
			control: false,
		},
	},
	render: (args) => (
		<div className="w-[308px] overflow-hidden rounded-[6px] border border-black/10 bg-white shadow-[0_10px_22px_rgba(0,0,0,0.1)]">
			<IpodStatusBar {...args} />
		</div>
	),
} satisfies Meta<typeof IpodStatusBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MenuMode: Story = {};

export const NowPlayingMode: Story = {
	args: {
		showOsMenu: false,
	},
};
