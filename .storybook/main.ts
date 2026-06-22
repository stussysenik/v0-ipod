import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/nextjs-vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");

const config: StorybookConfig = {
	stories: [
		"../stories/**/*.mdx",
		"../packages/components/**/*.stories.@(ts|tsx)",
	],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
	],
	framework: {
		name: "@storybook/nextjs-vite",
		options: {
			nextConfigPath: path.resolve(root, "apps/web/next.config.mjs"),
		},
	},
	staticDirs: ["../apps/web/public"],
	docs: {
		defaultName: "Overview",
	},
	viteFinal: async (cfg) => {
		cfg.resolve = cfg.resolve ?? {};
		cfg.resolve.alias = {
			...(cfg.resolve.alias ?? {}),
			"@ipod/types": path.resolve(root, "packages/types"),
			"@ipod/tokens": path.resolve(root, "packages/tokens"),
			"@ipod/hooks": path.resolve(root, "packages/hooks"),
			"@ipod/lib": path.resolve(root, "packages/lib"),
			"@ipod/components": path.resolve(root, "packages/components"),
			"@scripts": path.resolve(root, "scripts"),
		};
		return cfg;
	},
};

export default config;
