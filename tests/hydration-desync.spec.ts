import { test, expect, type Page } from "@playwright/test";

/**
 * Regression guard for the hydration-race desync, exercised under degraded conditions.
 *
 * The bug: a *post-paint* `useEffect` did the whole-model RESTORE that hydrates localStorage
 * on mount. On a slow CPU / low network the effect flush trails first paint, leaving a window
 * where the device is painted-and-interactive with defaults; persisted state arrived late and
 * a tap/drag landing in that window was wiped. The fix hydrates in a pre-paint layout effect,
 * so the first interactive client frame already carries the saved model.
 *
 * These run under heavy CPU + network throttling to widen that window. The shell's inline
 * `--skin-color` is the observable — it is driven directly by the live model.
 */

const SHELL = '[data-export-layer="shell"]';
const PERSISTED_SKIN = "#3366CC";

async function throttle(page: Page): Promise<void> {
	const client = await page.context().newCDPSession(page);
	await client.send("Emulation.setCPUThrottlingRate", { rate: 6 });
	await client.send("Network.enable");
	await client.send("Network.emulateNetworkConditions", {
		offline: false,
		downloadThroughput: (500 * 1024) / 8,
		uploadThroughput: (500 * 1024) / 8,
		latency: 400,
	});
}

async function seedSkin(page: Page, skin: string): Promise<void> {
	// Runs before any app script on every navigation in this context.
	await page.addInitScript((value) => {
		localStorage.setItem(
			"ipodSnapshotUiState",
			JSON.stringify({ skinColor: value, bgColor: "#FFFFFF", viewMode: "preview" }),
		);
	}, skin);
}

async function shellSkinColor(page: Page): Promise<string> {
	return page.$eval(SHELL, (el) =>
		getComputedStyle(el).getPropertyValue("--skin-color").trim(),
	);
}

test.describe("Hydration desync under low network", () => {
	test("persisted theme wins on a throttled first load (no clobber to default)", async ({
		page,
	}) => {
		await seedSkin(page, PERSISTED_SKIN);
		await throttle(page);
		await page.goto("/");
		await page.waitForSelector(SHELL);

		// The hydrated model must win — and stay won (no late RESTORE/persist reverting it).
		await expect.poll(() => shellSkinColor(page), { timeout: 15_000 }).toBe(PERSISTED_SKIN);
		await page.waitForTimeout(1_000);
		expect(await shellSkinColor(page)).toBe(PERSISTED_SKIN);
	});

	test("persisted theme is stable across repeated throttled reloads", async ({ page }) => {
		await seedSkin(page, PERSISTED_SKIN);
		await throttle(page);

		for (let i = 0; i < 2; i++) {
			await page.goto("/");
			await page.waitForSelector(SHELL);
			// On every reload the on-mount RESTORE must re-apply the persisted finish, and the
			// post-hydration persist must not write a default back over it.
			await expect.poll(() => shellSkinColor(page), { timeout: 15_000 }).toBe(PERSISTED_SKIN);
		}
	});
});
