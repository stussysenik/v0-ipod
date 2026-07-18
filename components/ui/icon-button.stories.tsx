import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Download, Sparkles } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { IconButton, IconButtonChromeProvider } from "./icon-button";

const meta = {
	title: "components/ui/IconButton",
	component: IconButton,
	parameters: {
		docs: {
			description: {
				component: "Token-backed reusable icon control for shared UI surfaces. This is the first DS-ready visual primitive in the repository.",
			},
		},
	},
	args: {
		icon: <Download className="h-4 w-4" />,
		label: "Export",
		onClick: fn(),
	},
	argTypes: {
		icon: {
			control: false,
		},
		className: {
			control: false,
		},
		style: {
			control: false,
		},
	},
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Contrast: Story = {
	args: {
		contrast: true,
		label: "Contrast",
		icon: <Sparkles className="h-4 w-4" />,
	},
};

export const Active: Story = {
	args: {
		isActive: true,
		label: "Selected",
	},
};

export const WithBadge: Story = {
	args: {
		badge: "New",
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const Hovered: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.hover(canvas.getByRole("button", { name: "Export" }));
	},
};

export const Focused: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button", { name: "Export" });
		await userEvent.tab();
		await expect(button).toHaveFocus();
	},
};

// §7 wiring: a resting `default` button reads the dark-filled chrome when its
// subtree is wrapped for a dark device. Proves IconButtonChromeContext flows
// into resolveIconButtonVariant and out to the rendered style — the seam the
// pure `lib/shared-ui-tokens.test.ts` cannot cover.
export const OnDarkChrome: Story = {
	name: "Default (dark chrome)",
	decorators: [
		(Story) => (
			<IconButtonChromeProvider dark>
				<Story />
			</IconButtonChromeProvider>
		),
	],
	play: async ({ canvasElement }) => {
		const button = within(canvasElement).getByRole("button", { name: "Export" });
		// defaultDark.foreground (#F5F5F7) — light text, not the light default's #111315.
		await expect(getComputedStyle(button).color).toBe("rgb(245, 245, 247)");
	},
};
