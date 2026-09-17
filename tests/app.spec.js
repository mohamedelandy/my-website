const { test, expect } = require('@playwright/test');

test.describe('App functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local server
    await page.goto('http://localhost:3000');
  });

  test('Theme Toggle', async ({ page }) => {
    const htmlElement = page.locator('html');
    const themeToggle = page.locator('[data-theme-toggle]');

    // Get initial theme (data-theme attribute)
    const initialTheme = await htmlElement.getAttribute('data-theme');

    // In app.js:
    // dark mode removes data-theme attribute (so it is null)
    // light mode adds data-theme='light'
    const isInitiallyLight = initialTheme === 'light';

    // Click to toggle
    await themeToggle.click();

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('data-theme');
    if (isInitiallyLight) {
      expect(newTheme).toBeNull(); // changed to dark
    } else {
      expect(newTheme).toBe('light'); // changed to light
    }

    // Check localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    if (isInitiallyLight) {
      expect(storedTheme).toBe('dark');
    } else {
      expect(storedTheme).toBe('light');
    }

    // Toggle back
    await themeToggle.click();
    const finalTheme = await htmlElement.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });

  test('Mobile Menu', async ({ page }) => {
    // Since menu is for mobile, let's pretend we are a mobile device or resize viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const menuToggle = page.locator('#menuToggle');
    const mobileMenu = page.locator('#mobileMenu');

    // Should be hidden initially
    await expect(mobileMenu).toBeHidden();

    // Click to open
    await menuToggle.click();
    await expect(mobileMenu).toBeVisible();

    // Click to close
    await menuToggle.click();
    await expect(mobileMenu).toBeHidden();
  });

  test('Project Filtering', async ({ page }) => {
    const allBtn = page.locator('.filter-btn[data-filter="all"]');
    const ossBtn = page.locator('.filter-btn[data-filter="oss"]');
    const workBtn = page.locator('.filter-btn[data-filter="work"]');

    // Cards by default (all)
    const cards = page.locator('.proj-card');
    await expect(cards).toHaveCount(6); // 6 projects total

    // Click Open Source
    await ossBtn.click();
    // filtered-out class means it is hidden
    const ossCards = page.locator('.proj-card:not(.filtered-out)');
    const countOSS = await ossCards.count();
    expect(countOSS).toBeGreaterThan(0);
    expect(countOSS).toBeLessThan(6);

    // Click Work
    await workBtn.click();
    const workCards = page.locator('.proj-card:not(.filtered-out)');
    const countWork = await workCards.count();
    expect(countWork).toBeGreaterThan(0);
    expect(countWork).toBeLessThan(6);
  });

  test('Project Dialog', async ({ page }) => {
    const firstProjectViewBtn = page.locator('[data-project-view]').first();
    const dialog = page.locator('#projectDialog');

    await expect(dialog).not.toBeVisible();

    await firstProjectViewBtn.click();

    // Check if dialog opens
    await expect(dialog).toBeVisible();

    // The dialog has a close button [data-dialog-close]
    const closeBtn = dialog.locator('[data-dialog-close]').first();
    await closeBtn.click();

    // Should be closed
    await expect(dialog).not.toBeVisible();
  });
});
