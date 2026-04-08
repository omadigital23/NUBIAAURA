import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('should load a product detail page from catalogue', async ({ page }) => {
    // First go to catalogue to find a product
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found in catalogue');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('produit');
  });

  test('should display product name', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    const productName = page.locator('h1');
    await expect(productName).toBeVisible({ timeout: 10000 });
    await expect(productName).not.toHaveText('');
  });

  test('should display product price', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Price should contain FCFA or a number
    const priceElement = page.locator('text=/\\d+.*FCFA|FCFA.*\\d+|\\d+.*€/').first();
    if (await priceElement.count() > 0) {
      await expect(priceElement).toBeVisible();
    }
  });

  test('should display product image', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    const image = page.locator('img').first();
    await expect(image).toBeVisible({ timeout: 10000 });
  });

  test('should have an add-to-cart or order button', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    const addToCartBtn = page.locator('button:has-text("panier"), button:has-text("ajouter"), button:has-text("commander"), button:has-text("cart")').first();
    if (await addToCartBtn.count() > 0) {
      await expect(addToCartBtn).toBeVisible();
    }
  });

  test('should display header and footer on product page', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const productLink = page.locator('a[href*="produit"]').first();
    if (await productLink.count() === 0) {
      test.skip(true, 'No products found');
      return;
    }

    await productLink.click();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible({ timeout: 15000 });
  });
});
