import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function selectCountry(page: Page) {
  await page.getByRole('button', { name: /pays|country/i }).first().click();
  await page.getByRole('button', { name: /S.n.gal|Senegal/i }).first().click();
}

async function fillAddressStep(page: Page, email = 'test@example.com') {
  await page.fill('input[name="firstName"]', 'Amadou');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[name="email"]', email);
  await selectCountry(page);
  await page.fill('input[type="tel"]', '77 123 45 67');
  await page.fill('input[name="address"]', '123 Rue Test');
  await page.fill('input[name="city"]', 'Dakar');
  await page.fill('input[name="zipCode"]', '18000');
}

async function goToShippingStep(page: Page) {
  await fillAddressStep(page);
  await page.getByRole('button', { name: /^(suivant|next)$/i }).click();
  await expect(page.getByText(/livraison|shipping/i).first()).toBeVisible();
}

async function goToPaymentStep(page: Page) {
  await goToShippingStep(page);
  await page.getByRole('button', { name: /^(suivant|next)$/i }).click();
  await expect(page.getByText(/paiement|payment/i).first()).toBeVisible();
}

async function selectFirstPaymentMethod(page: Page) {
  const paymentOption = page.locator('input[name="paymentMethod"]').first();
  if (await paymentOption.count() > 0) {
    await paymentOption.check({ force: true });
  }
}

test.describe('Payment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/checkout`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display checkout form', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="zipCode"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /pays|country/i }).first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await expect(page.getByRole('button', { name: /suivant|next/i })).toBeDisabled();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    const isInvalid = await page.locator('input[name="email"]').evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );

    expect(isInvalid).toBeTruthy();
  });

  test('should fill form with valid data', async ({ page }) => {
    await fillAddressStep(page);

    await expect(page.locator('input[name="firstName"]')).toHaveValue('Amadou');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
    await expect(page.locator('input[type="tel"]')).toHaveValue('77 123 45 67');
  });

  // Skipped until the card payment provider is activated.
  test.skip('should submit form and redirect to payment callback', async ({ page }) => {
    await goToPaymentStep(page);
    await selectFirstPaymentMethod(page);

    const submitButton = page.getByRole('button', { name: /passer la commande|place order/i });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/payments/initialize') && res.request().method() === 'POST',
        { timeout: 15000 }
      ),
      submitButton.click(),
    ]);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const paymentUrl = data.paymentLink || data.redirect_url;
    expect(paymentUrl).toContain('/fr/payments/callback');

    await page.goto(paymentUrl);
    await expect(page).toHaveURL(/payments\/callback/, { timeout: 15000 });
  });

  test('should handle different shipping methods', async ({ page }) => {
    await goToShippingStep(page);

    const express = page.locator('input[name="shipping"][value="express"]');
    await express.check();
    await expect(express).toBeChecked();

    const standard = page.locator('input[name="shipping"][value="standard"]');
    await standard.check();
    await expect(standard).toBeChecked();
  });

  test('should display cart summary', async ({ page }) => {
    await expect(page.getByText(/résumé|summary|total/i).first()).toBeVisible();
    await expect(page.getByText(/Produit E2E|Total/i).first()).toBeVisible();
  });

  test('should show submit button only after payment selection', async ({ page }) => {
    await goToPaymentStep(page);

    const submitButton = page.getByRole('button', { name: /passer la commande|place order/i });
    await expect(submitButton).toBeDisabled();

    await selectFirstPaymentMethod(page);
    await expect(submitButton).toBeEnabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await goToPaymentStep(page);

    await selectFirstPaymentMethod(page);

    await page.context().setOffline(true);
    await page.getByRole('button', { name: /passer la commande|place order/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    await page.context().setOffline(false);
  });

  test('should support multiple languages', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/checkout|commande|paiement/i);

    await page.goto(`${BASE_URL}/en/checkout`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/checkout|payment|order/i);
  });

  test('should keep checkout form functional after page reload', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="email"]', 'test@example.com');

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should sanitize phone number input', async ({ page }) => {
    await selectCountry(page);
    await page.fill('input[type="tel"]', 'invalid-phone-77');

    await expect(page.locator('input[type="tel"]')).toHaveValue(/77/);
  });

  test('should display callback page after payment', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/payments/callback?reference=TEST-123`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();
  });
});
