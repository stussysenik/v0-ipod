import path from "node:path";

import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
	framework: {
		name: "@storybook/nextjs",
		options: {
			nextConfigPath: path.resolve(__dirname, "../next.config.mjs"),
		},
	},
	stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx|mdx)"],
	addons: [
		"@storybook/addon-essentials",
		"@storybook/addon-a11y",
		"@storybook/addon-interactions",
		"@storybook/addon-themes",
		"@storybook/addon-designs",
		"storybook-dark-mode",
	],
	staticDirs: ["../public"],
	typescript: {
		check: false,
		reactDocgen: "react-docgen-typescript",
		reactDocgenTypescriptOptions: {
			shouldExtractLiteralValuesFromEnum: true,
			propFilter: (prop) =>
				prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
		},
	},
	docs: {
		autodocs: "tag",
	},
	features: {
		experimentalRSC: true,
	},
	webpackFinal: async (config) => {
		if (config.resolve) {
			config.resolve.alias = {
				...config.resolve.alias,
				"@": path.resolve(__dirname, ".."),
			};
		}
		return config;
	},
};

export default config;
