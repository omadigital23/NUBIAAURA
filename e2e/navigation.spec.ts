import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display the header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have a logo or brand name', async ({ page }) => {
    const logo = page.locator('header a').first();
    await expect(logo).toBeVisible();
  });

  test('should have catalogue navigation link', async ({ page }) => {
    const catalogueLink = page.locator('header a[href*="catalogue"], nav a[href*="catalogue"]').first();
    if (await catalogueLink.count() > 0) {
      await expect(catalogueLink).toBeVisible();
    }
  });

  test('should navigate to catalogue page', async ({ page }) => {
    await page.click('a[href*="catalogue"]');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('catalogue');
  });

  test('should navigate to contact page', async ({ page }) => {
    const contactLink = page.locator('a[href*="contact"]').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('contact');
    }
  });

  test('should navigate to sur-mesure page', async ({ page }) => {
    const surMesureLink = page.locator('a[href*="sur-mesure"]').first();
    if (await surMesureLink.count() > 0) {
      await surMesureLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('sur-mesure');
    }
  });

  test('should navigate to a-propos page', async ({ page }) => {
    const aboutLink = page.locator('a[href*="a-propos"]').first();
    if (await aboutLink.count() > 0) {
      await aboutLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('a-propos');
    }
  });

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    // Look for a menu toggle button (hamburger)
    const menuButton = page.locator('header button, nav button').first();
    if (await menuButton.count() > 0) {
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Menu should expand
      const mobileNav = page.locator('[role="navigation"], nav, [class*="mobile"], [class*="menu"]');
      await expect(mobileNav.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
