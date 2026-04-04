import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "4001";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [
        "**/web-vitals.spec.ts",
        "**/performance-budget.spec.ts",
        "**/mobile-usability.spec.ts",
      ],
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        isMobile: true,
        hasTouch: true,
      },
      testMatch: ["**/mobile-usability.spec.ts"],
    },
    {
      name: "perf",
      use: { ...devices["Desktop Chrome"] },
      testMatch: [
        "**/web-vitals.spec.ts",
        "**/performance-budget.spec.ts",
      ],
      fullyParallel: false,
      timeout: 60_000,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
  },
});
