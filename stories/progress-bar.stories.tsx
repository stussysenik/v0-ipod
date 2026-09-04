import { ProgressBar } from '@ipod/components/ipod/progress-bar';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { compatParameters } from '../.storybook/shared';

const meta = {
	title: 'iPod/Fields/Progress Bar',
	component: ProgressBar,
	tags: ['autodocs'],
	parameters: compatParameters('satori'),
	args: {
		currentTime: 72,
		duration: 264,
		onSeek: fn(),
		trackHeight: 7,
	},
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const QuarterElapsed: Story = {};

export const Halfway: Story = {
	args: { currentTime: 132 },
};

export const AlmostDone: Story = {
	args: { currentTime: 250 },
};

export const Disabled: Story = {
	args: { disabled: true },
};
