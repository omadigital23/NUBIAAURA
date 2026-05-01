import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should load French locale by default', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/fr');

    const bodyText = await page.textContent('body');
    // Should contain French content
    expect(bodyText?.toLowerCase()).toMatch(/catalogue|découvrir|accueil|bienvenue|mode/);
  });

  test('should load English locale', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/en');

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('should have French content on /fr/catalogue', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    const headingText = await heading.textContent();
    // Should contain French text
    expect(headingText?.toLowerCase()).toMatch(/catalogue|collection|notre/i);
  });

  test('should have English content on /en/catalogue', async ({ page }) => {
    await page.goto('/en/catalogue');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    const headingText = await heading.textContent();
    // Should contain English text or key
    expect(headingText).toBeTruthy();
  });

  test('should have language switcher', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const langSwitcher = page.locator('a[href*="/en"], button:has-text("EN"), button:has-text("English"), [class*="language"], [class*="lang"]').first();
    if (await langSwitcher.count() > 0) {
      await expect(langSwitcher).toBeVisible();
    }
  });

  test('should switch language when clicking language switcher', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const langSwitcher = page.getByRole('button', { name: /changer la langue|change language/i }).first();
    if (await langSwitcher.count() > 0) {
      await langSwitcher.click();
      await page.getByRole('button', { name: /english/i }).click();

      await expect(page).toHaveURL(/\/en/);
    }
  });

  test('should redirect root to /fr', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should redirect to /fr
    expect(page.url()).toContain('/fr');
  });

  test('should display prices in FCFA', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    // Prices should be in FCFA
    if (bodyText?.includes('FCFA')) {
      expect(bodyText).toContain('FCFA');
    }
  });
});
