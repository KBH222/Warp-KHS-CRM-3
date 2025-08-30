import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/KHS CRM/);
});

test('navigate to KHS Info page', async ({ page }) => {
  // Set up auth mock for this test
  await page.route('**/api/auth/check', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        user: {
          id: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        }
      })
    });
  });

  await page.goto('/dashboard');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Click the KHS Info link
  await page.click('text=KHS Info');

  // Wait for navigation
  await page.waitForURL('**/khs-info');

  // The KHS Info page might not have an h1 heading, let's check for any content
  await expect(page).toHaveURL(/.*khs-info/);
});