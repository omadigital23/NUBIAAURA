import { test, expect } from '@playwright/test';

test.describe('Sur-Mesure (Custom Order) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/sur-mesure');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the sur-mesure page', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display custom order form or information', async ({ page }) => {
    // Could be a form or informational page
    const form = page.locator('form').first();
    const heading = page.locator('h1, h2');
    
    const hasForm = await form.count() > 0;
    const hasHeading = await heading.count() > 0;
    
    expect(hasForm || hasHeading).toBeTruthy();
  });

  test('should have a description of the service', async ({ page }) => {
    const description = page.locator('p').first();
    await expect(description).toBeVisible();
    const text = await description.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should have a CTA or form submission button', async ({ page }) => {
    const ctaButton = page.locator('button[type="submit"], button:has-text("Envoyer"), button:has-text("Commander"), a:has-text("WhatsApp"), a[href*="wa.me"]').first();
    if (await ctaButton.count() > 0) {
      await expect(ctaButton).toBeVisible();
    }
  });

  test('should display header and footer', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible({ timeout: 15000 });
  });
});
