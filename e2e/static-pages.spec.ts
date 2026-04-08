import { test, expect } from '@playwright/test';

const staticPages = [
  { path: '/fr/a-propos', name: 'À Propos', expectedText: /nubia|mode|afri/i },
  { path: '/fr/mentions-legales', name: 'Mentions Légales', expectedText: /mention|légal|éditeur/i },
  { path: '/fr/politique-de-confidentialite', name: 'Politique de Confidentialité', expectedText: /confidentialit|données|privacy/i },
  { path: '/fr/conditions-generales', name: 'Conditions Générales', expectedText: /condition|général|vente/i },
];

test.describe('Static Pages', () => {
  for (const page_ of staticPages) {
    test(`should load ${page_.name} page`, async ({ page }) => {
      await page.goto(page_.path);
      await page.waitForLoadState('domcontentloaded');

      // Page should load without error
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test(`${page_.name} should have relevant content`, async ({ page }) => {
      await page.goto(page_.path);
      await page.waitForLoadState('domcontentloaded');

      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(page_.expectedText);
    });

    test(`${page_.name} should display header and footer`, async ({ page }) => {
      await page.goto(page_.path);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible({ timeout: 15000 });
    });
  }

  test('merci page should display confirmation content', async ({ page }) => {
    await page.goto('/fr/merci');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
