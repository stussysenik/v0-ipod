import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 4101);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const useProductionServer = process.env.PLAYWRIGHT_USE_PROD_SERVER === "1";

export default defineConfig({
	testDir: "./tests",
	timeout: 120_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		baseURL,
		headless: true,
		channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		viewport: {
			width: 1440,
			height: 1100,
		},
	},
	webServer: {
		command: useProductionServer
			? `PORT=${port} PORT_STRICT=1 npm run start`
			: `PORT=${port} PORT_STRICT=1 npm run dev`,
		reuseExistingServer: useProductionServer ? false : !process.env.CI,
		timeout: 120_000,
		url: baseURL,
	},
});
