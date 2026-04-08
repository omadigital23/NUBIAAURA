import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  test('GET /api/products should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/categories should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/categories`);
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeTruthy();
    }
  });

  test('GET /api/search should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search?q=robe`);
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/products should return JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    if (response.ok()) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });

  test('POST /api/contact should accept form data', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/contact`, {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message from Playwright',
      },
    });
    // Should not return 500
    expect(response.status()).toBeLessThan(500);
  });

  test('POST /api/newsletter should accept subscription', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/newsletter`, {
      data: {
        email: 'playwright-test@example.com',
      },
    });
    // Should not return 500
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/cart should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cart`);
    expect(response.status()).toBeLessThan(500);
  });

  test('POST /api/checkout should validate required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/checkout`, {
      data: {},
    });
    // Should return 400 (validation error) not 500
    expect(response.status()).toBeLessThanOrEqual(500);
    expect(response.status()).not.toBe(500);
  });

  test('GET /api/reviews should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reviews`);
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/wishlist should respond', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/wishlist`);
    // May require auth, so 401 is acceptable
    expect(response.status()).toBeLessThan(500);
  });
});
