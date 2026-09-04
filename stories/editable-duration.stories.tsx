import { EditableDuration } from '@ipod/components/ipod/editable-duration';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { compatParameters } from '../.storybook/shared';

const meta = {
	title: 'iPod/Fields/Editable Duration',
	component: EditableDuration,
	tags: ['autodocs'],
	parameters: compatParameters('satori'),
	args: {
		value: 264,
		onChange: fn(),
	},
} satisfies Meta<typeof EditableDuration>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortTrack: Story = {
	args: { value: 42 },
};

export const LongTrack: Story = {
	args: { value: 3725 },
};
