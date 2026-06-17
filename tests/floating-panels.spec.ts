import { expect, test, type Page } from "@playwright/test";

/**
 * Floating tool panels & command palette (specs: floating-panel-system, command-palette).
 *
 * Real-browser proof for the MVP slice: the ⌘K palette summons a panel, the panel drags
 * within bounds, resizes no smaller than its minimum, collapses to its ideal-minimal form
 * and restores, keeps an independent arrangement per view mode, survives a reload, and
 * reclamps into the viewport after a window shrink.
 */

const PANEL = '[data-panel-id="view"]';
const TITLEBAR = `${PANEL} [data-panel-titlebar]`;

async function openPalette(page: Page) {
	await page.keyboard.press("ControlOrMeta+k");
	await expect(page.getByPlaceholder("Type a command or search…")).toBeVisible();
}

async function runCommand(page: Page, query: string) {
	await openPalette(page);
	await page.getByPlaceholder("Type a command or search…").fill(query);
	await page.keyboard.press("Enter");
}

async function summonViewPanel(page: Page) {
	await runCommand(page, "Summon View");
	await expect(page.locator(PANEL)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	// Start from a clean layout so prior runs don't leak state.
	await page.evaluate(() => localStorage.removeItem("ipodSnapshotPanelLayout"));
	await page.reload({ waitUntil: "networkidle" });
});

test.describe("command palette", () => {
	test("opens with ⌘K and closes with Escape", async ({ page }) => {
		await openPalette(page);
		await page.keyboard.press("Escape");
		await expect(page.getByPlaceholder("Type a command or search…")).toBeHidden();
	});

	test("summons a panel via fuzzy search + Enter", async ({ page }) => {
		await summonViewPanel(page);
	});
});

test.describe("floating panel interaction", () => {
	test("drags within the viewport and cannot leave it", async ({ page }) => {
		await summonViewPanel(page);
		const titlebar = page.locator(TITLEBAR);
		const box = await titlebar.boundingBox();
		expect(box).not.toBeNull();

		// Grab the title bar and fling it far past the bottom-right corner.
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.mouse.move(9000, 9000, { steps: 12 });
		await page.mouse.up();

		const panelBox = (await page.locator(PANEL).boundingBox())!;
		const vw = page.viewportSize()!.width;
		const vh = page.viewportSize()!.height;
		// The title bar must stay reachable: the panel's top-left is clamped inside the
		// viewport (minus the 48px reachable strip).
		expect(panelBox.x).toBeLessThanOrEqual(vw - 48 + 1);
		expect(panelBox.y).toBeLessThanOrEqual(vh - 48 + 1);
		expect(panelBox.x).toBeGreaterThanOrEqual(-1);
	});

	test("resizes no smaller than its declared minimum", async ({ page }) => {
		await summonViewPanel(page);
		const handle = page.locator(`${PANEL} [data-panel-resize="se"]`);
		const hb = (await handle.boundingBox())!;
		await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
		await page.mouse.down();
		// Drag the corner far up-left, well past the minimum size.
		await page.mouse.move(hb.x - 600, hb.y - 600, { steps: 12 });
		await page.mouse.up();

		const panelBox = (await page.locator(PANEL).boundingBox())!;
		expect(panelBox.width).toBeGreaterThanOrEqual(180 - 1);
		expect(panelBox.height).toBeGreaterThanOrEqual(150 - 1);
	});

	test("collapses to its ideal-minimal form and restores", async ({ page }) => {
		await summonViewPanel(page);
		const expanded = (await page.locator(PANEL).boundingBox())!;
		expect(expanded.height).toBeGreaterThan(150);

		await page.locator(`${PANEL} [data-panel-collapse]`).click();
		const collapsed = (await page.locator(PANEL).boundingBox())!;
		// Collapsed = title bar / nub only.
		expect(collapsed.height).toBeLessThan(60);
		// The body controls are gone while collapsed.
		await expect(page.locator(`${PANEL} [data-testid="panel-view-flat"]`)).toHaveCount(0);

		await page.locator(`${PANEL} [data-panel-collapse]`).click();
		const restored = (await page.locator(PANEL).boundingBox())!;
		expect(Math.abs(restored.height - expanded.height)).toBeLessThan(4);
	});
});

test.describe("per-mode layout + persistence", () => {
	test("each view mode keeps its own arrangement", async ({ page }) => {
		await summonViewPanel(page);
		// Switch to Preview from inside the panel — Preview has no summoned panels yet.
		await page.locator(`${PANEL} [data-testid="panel-view-preview"]`).click();
		await expect(page.locator(PANEL)).toBeHidden();
		// Back to Flat restores the panel we summoned there.
		await runCommand(page, "Switch to Flat");
		await expect(page.locator(PANEL)).toBeVisible();
	});

	test("a moved panel survives a reload", async ({ page }) => {
		await summonViewPanel(page);
		const titlebar = page.locator(TITLEBAR);
		const box = (await titlebar.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + 240, box.y + 160, { steps: 8 });
		await page.mouse.up();
		const moved = (await page.locator(PANEL).boundingBox())!;

		await page.reload({ waitUntil: "networkidle" });
		await expect(page.locator(PANEL)).toBeVisible();
		const after = (await page.locator(PANEL).boundingBox())!;
		expect(Math.abs(after.x - moved.x)).toBeLessThan(4);
		expect(Math.abs(after.y - moved.y)).toBeLessThan(4);
	});

	test("a panel reclamps into the viewport after a window shrink", async ({ page }) => {
		await summonViewPanel(page);
		// Push the panel toward the right edge first.
		const titlebar = page.locator(TITLEBAR);
		const box = (await titlebar.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(1200, 600, { steps: 8 });
		await page.mouse.up();

		await page.setViewportSize({ width: 820, height: 700 });
		await page.waitForTimeout(300);
		const panelBox = (await page.locator(PANEL).boundingBox())!;
		expect(panelBox.x).toBeLessThanOrEqual(820 - 48 + 1);
	});
});
