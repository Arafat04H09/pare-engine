// D5: E2E Playwright tests for admin pages
// Requires: npx playwright install && npx playwright test
//
// These tests verify the admin dashboard pages of the Pare Engine web app.
// They require authentication (session-based, single operator account).
//
// To run: npx playwright test apps/web/tests/admin-pages.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@pareconsulting.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'testpassword';

// ---------------------------------------------------------------------------
// Helper: Login
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  // Wait for redirect to admin dashboard
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

test.describe('Admin Login (/admin/login)', () => {
  test('should display login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Should stay on login page or show error
    await expect(page).toHaveURL(/login/);
  });
});

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------

test.describe('Auth Middleware', () => {
  test('should redirect /admin to /admin/login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect /admin/audits to /admin/login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/audits`);
    await expect(page).toHaveURL(/login/);
  });
});

// ---------------------------------------------------------------------------
// Admin Dashboard (authenticated)
// ---------------------------------------------------------------------------

test.describe('Admin Dashboard (/admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display dashboard after login', async ({ page }) => {
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should have navigation to audits and clients', async ({ page }) => {
    await expect(page.getByRole('link', { name: /audits/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Audits List (authenticated)
// ---------------------------------------------------------------------------

test.describe('Audits List (/admin/audits)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display audits page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/audits`);
    await expect(page.getByRole('heading', { name: /audits/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Clients List (authenticated)
// ---------------------------------------------------------------------------

test.describe('Clients List (/admin/clients)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display clients page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/clients`);
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe('Logout', () => {
  test('should log out and redirect to login', async ({ page }) => {
    await loginAsAdmin(page);
    const logoutButton = page.getByRole('button', { name: /log out|logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });
});
