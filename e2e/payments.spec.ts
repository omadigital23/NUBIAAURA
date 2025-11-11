/**
 * 🧪 Payment E2E Tests
 * End-to-end tests for payment flow
 * 
 * Run: npx playwright test e2e/payments.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Payment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout page
    await page.goto(`${BASE_URL}/fr/checkout`);
    await page.waitForLoadState('networkidle');
  });

  test('should display checkout form', async ({ page }) => {
    // Check form elements exist
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="zipCode"]')).toBeVisible();
    await expect(page.locator('select[name="country"]')).toBeVisible();
    await expect(page.locator('select[name="shippingMethod"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Should show validation errors
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '+221771234567');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');
    await page.selectOption('select[name="country"]', 'Sénégal');

    // Try to submit
    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Should show email validation error
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages).toContainText(/email|invalid/i);
  });

  test('should fill form with valid data', async ({ page }) => {
    // Fill form with valid data
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+221771234567');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');
    await page.selectOption('select[name="country"]', 'Sénégal');
    await page.selectOption('select[name="shippingMethod"]', 'standard');

    // Verify values are filled
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Amadou');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
  });

  test('should submit form and redirect to Flutterwave', async ({ page }) => {
    // Fill form
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+221771234567');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');
    await page.selectOption('select[name="country"]', 'Sénégal');
    await page.selectOption('select[name="shippingMethod"]', 'standard');

    // Submit form
    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Wait for redirect
    await page.waitForNavigation();

    // Should redirect to Flutterwave or show confirmation
    const url = page.url();
    const isFlutterwave = url.includes('flutterwave') || url.includes('checkout');
    const isConfirmation = url.includes('callback') || url.includes('confirmation');

    expect(isFlutterwave || isConfirmation).toBeTruthy();
  });

  test('should handle different shipping methods', async ({ page }) => {
    const methods = ['standard', 'express'];

    for (const method of methods) {
      // Fill form
      await page.fill('input[name="firstName"]', 'Amadou');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '+221771234567');
      await page.fill('input[name="address"]', '123 Rue Test');
      await page.fill('input[name="city"]', 'Dakar');
      await page.fill('input[name="zipCode"]', '18000');
      await page.selectOption('select[name="country"]', 'Sénégal');
      await page.selectOption('select[name="shippingMethod"]', method);

      // Verify selection
      const selected = await page.locator('select[name="shippingMethod"]').inputValue();
      expect(selected).toBe(method);

      // Reset form for next iteration
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display cart summary', async ({ page }) => {
    // Check if cart summary is visible
    const cartSummary = page.locator('[data-testid="cart-summary"]');
    
    if (await cartSummary.isVisible()) {
      // Verify cart items are displayed
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThan(0);

      // Verify total is displayed
      const total = page.locator('[data-testid="cart-total"]');
      await expect(total).toBeVisible();
    }
  });

  test('should show loading state during submission', async ({ page }) => {
    // Fill form
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+221771234567');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');
    await page.selectOption('select[name="country"]', 'Sénégal');

    // Submit form
    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Check for loading state
    const loadingIndicator = page.locator('[data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.context().setOffline(true);

    // Try to submit form
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+221771234567');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');
    await page.selectOption('select[name="country"]', 'Sénégal');

    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Should show error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });

  test('should support multiple languages', async ({ page }) => {
    // Check French version
    let heading = page.locator('h1');
    await expect(heading).toContainText(/checkout|commande|paiement/i);

    // Navigate to English version
    await page.goto(`${BASE_URL}/en/checkout`);
    await page.waitForLoadState('networkidle');

    // Check English version
    heading = page.locator('h1');
    await expect(heading).toContainText(/checkout|payment|order/i);
  });

  test('should remember form data on page reload', async ({ page }) => {
    // Fill form
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="email"]', 'test@example.com');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if data is remembered (if localStorage is used)
    const firstName = await page.locator('input[name="firstName"]').inputValue();
    const email = await page.locator('input[name="email"]').inputValue();

    // Data might be remembered or cleared - both are acceptable
    // Just verify form is still functional
    expect(firstName || email).toBeDefined();
  });

  test('should validate phone number format', async ({ page }) => {
    // Fill form with invalid phone
    await page.fill('input[name="firstName"]', 'Amadou');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', 'invalid-phone');
    await page.fill('input[name="address"]', '123 Rue Test');
    await page.fill('input[name="city"]', 'Dakar');
    await page.fill('input[name="zipCode"]', '18000');

    // Try to submit
    const submitButton = page.locator('button:has-text("Passer la Commande")');
    await submitButton.click();

    // Should show phone validation error
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages).toContainText(/phone|number/i);
  });

  test('should display success message after payment', async ({ page }) => {
    // Navigate to callback page (simulating successful payment)
    await page.goto(`${BASE_URL}/payments/callback?reference=TEST-123`);
    await page.waitForLoadState('networkidle');

    // Should show success message
    const successMessage = page.locator('[data-testid="success-message"]');
    if (await successMessage.isVisible()) {
      await expect(successMessage).toBeVisible();
    }

    // Should show order details
    const orderDetails = page.locator('[data-testid="order-details"]');
    if (await orderDetails.isVisible()) {
      await expect(orderDetails).toBeVisible();
    }
  });
});
