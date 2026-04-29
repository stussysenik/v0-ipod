import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { IPOD_CLASSIC_PRESETS } from "@/lib/ipod-classic-presets";
import { IpodClickWheel } from "./ipod-click-wheel";

const meta = {
  title: "components/ipod/controls/IpodClickWheel",
  component: IpodClickWheel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Hardware-specific showcase story. This remains product-owned and is intentionally separate from reusable design-system primitives.",
      },
    },
  },
  args: {
    preset: IPOD_CLASSIC_PRESETS[0],
    playClick: fn(),
    onSeek: fn(),
    onCenterClick: fn(),
    onMenuPress: fn(),
    onPreviousPress: fn(),
    onNextPress: fn(),
    onPlayPausePress: fn(),
  },
  argTypes: {
    preset: {
      control: false,
    },
    playClick: {
      control: false,
    },
    onSeek: {
      control: false,
    },
    onCenterClick: {
      control: false,
    },
    onMenuPress: {
      control: false,
    },
    onPreviousPress: {
      control: false,
    },
    onNextPress: {
      control: false,
    },
    onPlayPausePress: {
      control: false,
    },
  },
} satisfies Meta<typeof IpodClickWheel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightFinish: Story = {};

export const BlackFinish: Story = {
  args: {
    skinColor: "#2E333A",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
