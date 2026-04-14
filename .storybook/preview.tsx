import type { Preview } from "@storybook/react";

import { withThemeByDataAttribute } from "@storybook/addon-themes";

import "../app/globals.css";
import React from "react";

import { FixedEditorProvider } from "../components/ipod/fixed-editor";
import { IPodThemeProvider } from "../hooks/use-ipod-theme";

const preview: Preview = {
	parameters: {
		layout: "centered",
		backgrounds: {
			default: "app",
			values: [
				{ name: "app", value: "#F5F5F3" },
				{ name: "dark", value: "#0B0B0C" },
				{ name: "figma", value: "#1E1E1E" },
			],
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /date$/i,
			},
		},
		a11y: {
			config: {
				rules: [
					{ id: "color-contrast", enabled: true },
					{ id: "region", enabled: false },
				],
			},
		},
		darkMode: {
			classTarget: "html",
			stylePreview: true,
		},
		nextjs: {
			appDirectory: true,
		},
	},
	decorators: [
		withThemeByDataAttribute({
			themes: { light: "light", dark: "dark" },
			defaultTheme: "light",
			attributeName: "data-theme",
		}),
		(Story) => (
			<IPodThemeProvider>
				<FixedEditorProvider>
					<div className="bg-background text-foreground p-6 min-h-[240px] flex items-center justify-center">
						<Story />
					</div>
				</FixedEditorProvider>
			</IPodThemeProvider>
		),
	],
	tags: ["autodocs"],
};

export default preview;
