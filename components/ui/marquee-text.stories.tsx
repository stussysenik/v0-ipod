import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MarqueeText } from "./marquee-text";

const meta = {
	title: "components/ui/MarqueeText",
	component: MarqueeText,
	args: {
		text: "The Avalanches - Since I Left You",
	},
	argTypes: {
		className: {
			control: false,
		},
		dataTestId: {
			control: false,
		},
		onOverflowChange: {
			control: false,
		},
	},
	render: (args) => (
		<div className="w-[170px] rounded-[18px] border border-black/10 bg-white/80 px-3 py-2 text-[12px] font-medium text-[#111315] shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
			<MarqueeText {...args} />
		</div>
	),
} satisfies Meta<typeof MarqueeText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StaticFit: Story = {
	args: {
		text: "Boards of Canada",
	},
};

export const OverflowDetected: Story = {
	args: {
		text: "Sufjan Stevens - Chicago (Demo Version From The Avalanche Outtakes)",
	},
};

export const PreviewLoop: Story = {
	args: {
		text: "Daft Punk - Something About Us (Discovery Draft Sequence)",
		preview: true,
		captureReady: true,
	},
};
