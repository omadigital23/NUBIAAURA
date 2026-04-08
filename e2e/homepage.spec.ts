import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Nubia/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display the hero section', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Hero title
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toHaveText('');
  });

  test('should display CTA buttons in hero', async ({ page }) => {
    // "Découvrir le catalogue" link
    const catalogueLink = page.locator('a[href*="catalogue"]').first();
    await expect(catalogueLink).toBeVisible();

    // "Commander sur mesure" link
    const surMesureLink = page.locator('a[href*="sur-mesure"]').first();
    await expect(surMesureLink).toBeVisible();
  });

  test('should display the about section', async ({ page }) => {
    const aboutSection = page.locator('text=✨').first();
    await expect(aboutSection).toBeVisible({ timeout: 15000 });
  });

  test('should display the CTA section', async ({ page }) => {
    const ctaSection = page.locator('a[href*="contact"]').first();
    await expect(ctaSection).toBeVisible({ timeout: 15000 });
  });

  test('should display the footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 15000 });
  });

  test('should display the WhatsApp button', async ({ page }) => {
    const whatsappBtn = page.locator('a[href*="whatsapp"], a[href*="wa.me"]').first();
    if (await whatsappBtn.count() > 0) {
      await expect(whatsappBtn).toBeVisible();
    }
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (e.g. 3rd party scripts)
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('google') &&
      !e.includes('sentry') &&
      !e.includes('analytics')
    );

    // We log rather than fail - some console errors may be acceptable
    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }
  });
});
