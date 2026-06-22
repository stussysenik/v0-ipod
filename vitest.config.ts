import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Mirror the workspace path aliases from tsconfig.base.json so Vitest resolves
// cross-package imports the same way Next/tsc do.
const alias = {
	"@ipod/types": path.join(dirname, "packages/types"),
	"@ipod/tokens": path.join(dirname, "packages/tokens"),
	"@ipod/hooks": path.join(dirname, "packages/hooks"),
	"@ipod/lib": path.join(dirname, "packages/lib"),
	"@ipod/components": path.join(dirname, "packages/components"),
	"@scripts": path.join(dirname, "tools/scripts"),
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	resolve: {
		alias,
	},
	test: {
		projects: [
			{
				test: {
					name: "unit",
					environment: "node",
					include: ["packages/lib/**/*.test.ts"],
				},
				resolve: { alias },
			},
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({
						configDir: path.join(dirname, ".storybook"),
					}),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright({}),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
