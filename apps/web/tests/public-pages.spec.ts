// D4: E2E Playwright tests for public pages
// Requires: npx playwright install && npx playwright test
//
// These tests verify the public-facing pages of the Pare Engine web app.
// They are designed to run against a dev server (next dev) at localhost:3000.
//
// To run: npx playwright test apps/web/tests/public-pages.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

test.describe('Homepage', () => {
  test('should load and display brand name', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/pare/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /services/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('should have a CTA to start audit', async ({ page }) => {
    await page.goto(BASE_URL);
    const ctaLink = page.getByRole('link', { name: /audit|get started|analyze/i });
    await expect(ctaLink).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Audit Form
// ---------------------------------------------------------------------------

test.describe('Audit Form (/audit)', () => {
  test('should load the audit form', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await expect(page.getByLabel(/business name/i)).toBeVisible();
    await expect(page.getByLabel(/domain|website/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    const submitButton = page.getByRole('button', { name: /submit|start|run/i });
    await submitButton.click();
    // Form should show validation errors (not navigate)
    await expect(page).toHaveURL(new RegExp('/audit'));
  });

  test('should submit with valid data and redirect to success', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);

    await page.getByLabel(/business name/i).fill('Test Business');
    await page.getByLabel(/domain|website/i).fill('testbusiness.com');
    await page.getByLabel(/email/i).fill('test@testbusiness.com');

    // Select a vertical if the field exists
    const verticalSelect = page.getByLabel(/vertical|industry/i);
    if (await verticalSelect.isVisible()) {
      await verticalSelect.selectOption({ index: 1 });
    }

    const submitButton = page.getByRole('button', { name: /submit|start|run/i });
    await submitButton.click();

    // Should redirect to success page or show confirmation
    await page.waitForURL(/success|thank|confirm/i, { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// About Page
// ---------------------------------------------------------------------------

test.describe('About Page (/about)', () => {
  test('should load the about page', async ({ page }) => {
    await page.goto(`${BASE_URL}/about`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Services Page
// ---------------------------------------------------------------------------

test.describe('Services Page (/services)', () => {
  test('should load the services page', async ({ page }) => {
    await page.goto(`${BASE_URL}/services`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Contact Page
// ---------------------------------------------------------------------------

test.describe('Contact Page (/contact)', () => {
  test('should load the contact page', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
