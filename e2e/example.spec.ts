import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/KHS CRM/);
});

test('navigate to KHS Info page', async ({ page }) => {
  await page.goto('/');

  // Click the KHS Info link
  await page.click('text=KHS Info');

  // Expects page to have a heading with the name KHS Info.
  await expect(page.locator('h1')).toContainText('KHS Info');
});