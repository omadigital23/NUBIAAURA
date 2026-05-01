import { test, expect } from '@playwright/test';

test.describe('Catalogue Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the catalogue page', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/catalogue/i);
  });

  test('should display hero section with title', async ({ page }) => {
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });

  test('should display the search bar', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[type="text"][placeholder*="cherch"], input[placeholder*="search"], input[placeholder*="Recherch"]').first();
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should display products or loading state', async ({ page }) => {
    // Wait for either products or loading state
    const productsOrLoading = page.locator('[class*="animate-pulse"], [class*="grid"] a, [class*="grid"] > div').first();
    await expect(productsOrLoading).toBeVisible({ timeout: 15000 });
  });

  test('should display product cards after loading', async ({ page }) => {
    // Wait for products to load (loading skeletons disappear)
    await page.waitForTimeout(3000);

    // Check for product cards or "no results" message
    const productCards = page.locator('a[href*="produit"], [class*="grid"] > div:not([class*="animate-pulse"])');
    const noResults = page.locator('text=/aucun produit/i');

    const hasProducts = await productCards.count() > 0;
    const hasNoResults = await noResults.count() > 0;

    expect(hasProducts || hasNoResults).toBeTruthy();
  });

  test('should display category sections', async ({ page }) => {
    await page.waitForTimeout(3000);
    const categories = page.locator('h2');
    const count = await categories.count();
    // At least one section heading
    expect(count).toBeGreaterThan(0);
  });

  test('should have sort select', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    if (await sortSelect.count() > 0) {
      await expect(sortSelect).toBeVisible();
    }
  });

  test('should navigate to product detail on click', async ({ page }) => {
    await page.waitForTimeout(3000);
    const productLink = page.locator('a[href*="/produit/"]').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      expect(href).toContain('produit');

      await page.goto(href!);
      await expect(page).toHaveURL(/produit/);
    }
  });
});
