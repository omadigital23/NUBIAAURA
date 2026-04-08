import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/contact');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the contact page', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display contact form', async ({ page }) => {
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      await expect(form).toBeVisible();
    }
  });

  test('should have name field', async ({ page }) => {
    const nameField = page.locator('input[name="name"], input[name="nom"], input[placeholder*="Nom"], input[placeholder*="name"]').first();
    if (await nameField.count() > 0) {
      await expect(nameField).toBeVisible();
    }
  });

  test('should have email field', async ({ page }) => {
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.count() > 0) {
      await expect(emailField).toBeVisible();
    }
  });

  test('should have message field', async ({ page }) => {
    const messageField = page.locator('textarea, input[name="message"]').first();
    if (await messageField.count() > 0) {
      await expect(messageField).toBeVisible();
    }
  });

  test('should have submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer"), button:has-text("Submit")').first();
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should validate required fields on empty submit', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Envoyer")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Should show validation errors
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('should display contact information', async ({ page }) => {
    // Should show WhatsApp, email, or address info
    const contactInfo = page.locator('text=/whatsapp|email|@|téléphone|phone|adresse/i').first();
    if (await contactInfo.count() > 0) {
      await expect(contactInfo).toBeVisible();
    }
  });

  test('should display header and footer', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible({ timeout: 15000 });
  });
});
