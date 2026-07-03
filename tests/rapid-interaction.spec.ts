import { expect, test, type Page } from "@playwright/test";

/**
 * Rapid-interaction stability (spec: interaction-robustness).
 *
 * Deterministic input storms against the 2D customizer, asserting the app never
 * enters a stale or erroneous state: zero page errors, the error-boundary
 * fallback never mounts, and the surface stays interactive afterwards. Anchored
 * on `/` because the /3d WebGL canvas is environmentally untestable in CI.
 */

function collectPageErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(String(error)));
	return errors;
}

async function expectHealthy(page: Page, errors: string[]) {
	expect(errors).toEqual([]);
	await expect(page.getByTestId("app-error-fallback")).toHaveCount(0);
	await expect(page.getByTestId("ipod-screen")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
	// networkidle so late-hydrating chrome (panel system, palette listener) is live
	// before the storm starts — same pattern floating-panels.spec relies on.
	await page.goto("/", { waitUntil: "networkidle" });
	await page.waitForSelector('[data-testid="ipod-screen"]');
});

test("click-wheel spam leaves the app healthy and responsive", async ({ page }) => {
	const errors = collectPageErrors(page);
	const menu = page.getByTestId("click-wheel-menu-button");
	const center = page.getByTestId("click-wheel-center");
	const playPause = page.getByTestId("click-wheel-playpause-button");

	for (let i = 0; i < 15; i++) {
		await menu.click({ delay: 0 });
		await center.click({ delay: 0 });
		await playPause.click({ delay: 0 });
	}

	await expectHealthy(page, errors);
	// Liveness: a normal interaction still lands after the storm.
	await menu.click();
	await expect(page.getByTestId("ipod-screen")).toBeVisible();
});

test("settings-panel toggle storm never wedges the chrome", async ({ page }) => {
	const errors = collectPageErrors(page);
	const themeButton = page.getByTestId("theme-button");

	for (let i = 0; i < 20; i++) {
		await themeButton.click({ delay: 0 });
	}

	await expectHealthy(page, errors);
	// The toggle still works: an even storm leaves it closed, so one more opens it.
	await themeButton.click();
	await expect(page.getByTestId("theme-panel")).toBeVisible();
});

test("floating-panel drag storm stays clamped and error-free", async ({ page }) => {
	const errors = collectPageErrors(page);

	// Summon the view panel through the palette (same path as floating-panels.spec);
	// retried because the ⌘K listener registers in a post-paint effect.
	const paletteInput = page.getByPlaceholder("Type a command or search…");
	await expect(async () => {
		// ⌘K toggles — only press when the palette isn't already up.
		if (!(await paletteInput.isVisible())) {
			await page.keyboard.press("ControlOrMeta+k");
		}
		await expect(paletteInput).toBeVisible({ timeout: 1500 });
	}).toPass({ timeout: 15000 });
	await page.getByPlaceholder("Type a command or search…").fill("Summon View");
	await page.keyboard.press("Enter");
	const panel = page.locator('[data-panel-id="view"]');
	await expect(panel).toBeVisible();

	const titlebar = page.locator('[data-panel-id="view"] [data-panel-titlebar]');
	// Deterministic pseudo-random fling sequence, including far out-of-bounds points.
	const targets = [
		[40, 40],
		[5000, 60],
		[60, 5000],
		[-500, -500],
		[900, 300],
		[5000, 5000],
		[120, 500],
		[700, 80],
	] as const;

	for (const [x, y] of targets) {
		const box = await titlebar.boundingBox();
		expect(box).not.toBeNull();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.move(x, y, { steps: 3 });
		await page.mouse.up();
	}

	// The panel must remain fully inside the viewport after the storm.
	const viewport = page.viewportSize()!;
	const finalBox = await panel.boundingBox();
	expect(finalBox).not.toBeNull();
	expect(finalBox!.x).toBeGreaterThanOrEqual(0);
	expect(finalBox!.y).toBeGreaterThanOrEqual(0);
	expect(finalBox!.x + finalBox!.width).toBeLessThanOrEqual(viewport.width + 1);
	expect(finalBox!.y + finalBox!.height).toBeLessThanOrEqual(viewport.height + 1);

	await expectHealthy(page, errors);
});

test("view-mode switch storm settles into a working stage", async ({ page }) => {
	const errors = collectPageErrors(page);

	// Flip between flat and preview rapidly via the toolbox.
	const flat = page.getByRole("button", { name: "Flat", exact: true });
	const preview = page.getByRole("button", { name: "Preview", exact: true });
	if ((await flat.count()) === 0 || (await preview.count()) === 0) {
		test.skip(true, "view-mode buttons not exposed as named buttons in this layout");
	}

	for (let i = 0; i < 10; i++) {
		await flat.click({ delay: 0 });
		await preview.click({ delay: 0 });
	}

	await expectHealthy(page, errors);
});
