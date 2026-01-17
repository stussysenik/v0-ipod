import { test, expect } from '@playwright/test';

test.describe('EditableTrackNumber Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('displays initial track number format', async ({ page }) => {
    // Initial state: 2 of 10
    // Look for text content containing the track number pattern
    await expect(page.getByText(/2\s*of\s*10/)).toBeVisible();
  });

  test('track number becomes editable on click', async ({ page }) => {
    // Find the clickable track number "2" (not the input)
    const trackNumberSpan = page.locator('span').filter({ hasText: /^2$/ }).first();
    await trackNumberSpan.click();

    // Should show input with value selected
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('2');
  });

  test('saves new track number on Enter', async ({ page }) => {
    // Click on the track number
    const trackNumberSpan = page.locator('span').filter({ hasText: /^2$/ }).first();
    await trackNumberSpan.click();

    const input = page.locator('input[type="text"]').first();
    await input.fill('5');
    await input.press('Enter');

    // Should now display 5 of 10
    await expect(page.getByText(/5\s*of\s*10/)).toBeVisible();
  });

  test('reverts on Escape', async ({ page }) => {
    const trackNumberSpan = page.locator('span').filter({ hasText: /^2$/ }).first();
    await trackNumberSpan.click();

    const input = page.locator('input[type="text"]').first();
    await input.fill('9');
    await input.press('Escape');

    // Should revert to original 2 of 10
    await expect(page.getByText(/2\s*of\s*10/)).toBeVisible();
  });

  test('validates track number cannot exceed total', async ({ page }) => {
    const trackNumberSpan = page.locator('span').filter({ hasText: /^2$/ }).first();
    await trackNumberSpan.click();

    const input = page.locator('input[type="text"]').first();
    await input.fill('15'); // exceeds totalTracks (10)
    await input.press('Enter');

    // Should revert to original 2 (invalid input rejected)
    await expect(page.getByText(/2\s*of\s*10/)).toBeVisible();
  });

  test('total tracks is also editable', async ({ page }) => {
    // Click on total tracks (the "10")
    const totalTracksSpan = page.locator('span').filter({ hasText: /^10$/ }).first();
    await totalTracksSpan.click();

    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeFocused();
    await input.fill('20');
    await input.press('Enter');

    // Should now display 2 of 20
    await expect(page.getByText(/2\s*of\s*20/)).toBeVisible();
  });

  test('saves on blur', async ({ page }) => {
    // Wait for the track number text to be visible
    await expect(page.getByText(/2\s*of\s*10/)).toBeVisible();

    // Use the track text container to find and click on the "2"
    const trackNumberSpan = page.locator('span').filter({ hasText: /^2$/ }).first();
    await expect(trackNumberSpan).toBeVisible();
    await trackNumberSpan.click();

    // Wait for input to appear with longer timeout
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('3');

    // Click on the status bar to trigger blur
    await page.getByText('Now Playing').click();

    // Should save the value
    await expect(page.getByText(/3\s*of\s*10/)).toBeVisible();
  });
});
