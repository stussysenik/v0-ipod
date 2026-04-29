import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "../app/globals.css";

const preview: Preview = {
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
				<div className="min-h-screen bg-[radial-gradient(circle_at_top,#fffaf0_0%,#f4efe2_48%,#ebe4d5_100%)] px-6 py-8 text-foreground">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
	parameters: {
		layout: "centered",
		nextjs: {
			appDirectory: true,
		},
		options: {
			storySort: {
				order: [
					"Foundations",
					["Start Here"],
					"tokens",
					["shared-ui", "Manifest"],
					"components",
					[
						"ipod",
						["device", "PhysicalIpod", "display", "controls"],
						"ui",
					],
					"scripts",
				],
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
	},
};

export default preview;
