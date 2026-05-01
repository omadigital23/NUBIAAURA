import { test, expect, type Page } from '@playwright/test';

async function openFirstProduct(page: Page) {
  await page.goto('/fr/catalogue');
  await page.waitForLoadState('domcontentloaded');

  const productLink = page.locator('a[href*="/produit/"], a[href*="produit"]').first();
  await expect(productLink).toBeVisible({ timeout: 20000 });

  const href = await productLink.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).toContain('produit');

  await page.goto(href!);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/produit/);
}

test.describe('Product Detail Page', () => {
  test('should load a product detail page from catalogue', async ({ page }) => {
    await openFirstProduct(page);
  });

  test('should display product name', async ({ page }) => {
    await openFirstProduct(page);

    const productName = page.locator('h1');
    await expect(productName).toBeVisible({ timeout: 10000 });
    await expect(productName).not.toHaveText('');
  });

  test('should display product price', async ({ page }) => {
    await openFirstProduct(page);

    await expect(page.getByText(/FCFA/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display product image', async ({ page }) => {
    await openFirstProduct(page);

    const image = page.locator('main img').first();
    await expect(image).toBeVisible({ timeout: 10000 });
  });

  test('should have an add-to-cart or order button', async ({ page }) => {
    await openFirstProduct(page);

    const addToCartBtn = page.getByRole('button', { name: /panier|ajouter|commander|cart|login/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  });

  test('should display header and footer on product page', async ({ page }) => {
    await openFirstProduct(page);

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible({ timeout: 15000 });
  });
});
