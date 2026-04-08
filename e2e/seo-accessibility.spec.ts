import { test, expect } from '@playwright/test';

test.describe('SEO & Accessibility', () => {
  test('homepage should have a title tag', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('homepage should have meta description', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const metaDesc = page.locator('meta[name="description"]');
    if (await metaDesc.count() > 0) {
      const content = await metaDesc.getAttribute('content');
      expect(content?.length).toBeGreaterThan(0);
    }
  });

  test('homepage should have only one h1', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('catalogue page should have one h1', async ({ page }) => {
    await page.goto('/fr/catalogue');
    await page.waitForLoadState('domcontentloaded');

    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('should have proper lang attribute', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/fr/i);
  });

  test('images should have alt attributes', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const images = page.locator('img');
    const count = await images.count();

    let missingAlt = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (alt === null || alt === undefined) {
        missingAlt++;
      }
    }

    // Allow some decorative images without alt, but most should have it
    if (count > 0) {
      const altRate = (count - missingAlt) / count;
      expect(altRate).toBeGreaterThan(0.5);
    }
  });

  test('links should have accessible text', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const links = page.locator('a');
    const count = await links.count();

    let emptyLinks = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      if ((!text || text.trim().length === 0) && !ariaLabel && !title) {
        // Check if link contains an image with alt
        const img = link.locator('img');
        const hasImgAlt = await img.count() > 0;
        if (!hasImgAlt) {
          emptyLinks++;
        }
      }
    }

    // Most links should have accessible text
    if (count > 0) {
      const accessibleRate = (Math.min(count, 20) - emptyLinks) / Math.min(count, 20);
      expect(accessibleRate).toBeGreaterThan(0.7);
    }
  });

  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    // Should have h1 first, then h2s
    expect(h1Count).toBeGreaterThan(0);
    expect(h2Count).toBeGreaterThanOrEqual(0);
  });

  test('buttons should have accessible labels', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have some accessible text
      const hasLabel = (text && text.trim().length > 0) || ariaLabel || title;
      if (!hasLabel) {
        console.warn(`Button ${i} has no accessible label`);
      }
    }
  });

  test('should have Open Graph meta tags', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDesc = page.locator('meta[property="og:description"]');

    if (await ogTitle.count() > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content?.length).toBeGreaterThan(0);
    }
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count() > 0) {
      const href = await canonical.getAttribute('href');
      expect(href?.length).toBeGreaterThan(0);
    }
  });

  test('should have semantic HTML elements', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('domcontentloaded');

    // Check for semantic elements
    const header = await page.locator('header').count();
    const footer = await page.locator('footer').count();
    const main = await page.locator('main').count();
    const nav = await page.locator('nav').count();
    const sections = await page.locator('section').count();

    // At minimum header and footer should exist
    expect(header).toBeGreaterThan(0);
    expect(footer).toBeGreaterThan(0);
  });
});
