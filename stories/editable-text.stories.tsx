import { EditableText } from '@ipod/components/ipod/editable-text';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { compatParameters } from '../.storybook/shared';

const meta = {
	title: 'iPod/Fields/Editable Text',
	component: EditableText,
	tags: ['autodocs'],
	parameters: compatParameters('satori'),
	args: {
		value: 'Such Great Heights',
		onChange: fn(),
		editLabel: 'Edit title',
	},
} satisfies Meta<typeof EditableText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
	args: { disabled: true },
};

export const MarqueePreview: Story = {
	args: {
		value: 'An Exceptionally Long Title That Should Overflow',
		animate: true,
		preview: true,
	},
};
