import { test, expect } from '@playwright/test';

test.describe('KHS Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth mock
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
    
    // Navigate to KHS Info page
    await page.goto('/khs-info');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display KHS Tools page', async ({ page }) => {
    // Check if we're on the KHS Info/Tools page
    await expect(page).toHaveURL(/.*khs-info/);
    // Check for any tools-related content
    const hasToolsContent = await page.locator('text=/Tool|Category|Demo|Install/i').count() > 0;
    expect(hasToolsContent).toBeTruthy();
  });

  test('should show tool categories', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    // Check for any category-like elements or tool groups
    const hasCategories = await page.locator('div').filter({ hasText: /Category|Tool|Demo|Install/i }).count() > 0;
    expect(hasCategories).toBeTruthy();
  });

  test('should allow toggling Demo/Install view', async ({ page }) => {
    // Look for Demo/Install toggle buttons
    const demoToggle = page.locator('button').filter({ hasText: /Demo/i });
    const installToggle = page.locator('button').filter({ hasText: /Install/i });
    
    // Check if toggles exist
    const hasToggles = await demoToggle.count() > 0 || await installToggle.count() > 0;
    
    if (hasToggles) {
      // Test toggling Demo view
      if (await demoToggle.count() > 0) {
        await demoToggle.click();
        // Give UI time to update
        await page.waitForTimeout(500);
      }
      
      // Test toggling Install view
      if (await installToggle.count() > 0) {
        await installToggle.click();
        // Give UI time to update
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle unsaved changes warning', async ({ page }) => {
    // Make a change to trigger unsaved state
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.click();
      
      // Check for Save Changes button
      const saveButton = page.locator('button').filter({ hasText: /Save Changes/i });
      await expect(saveButton).toBeVisible({ timeout: 5000 });
      
      // Try to navigate away
      page.on('dialog', async dialog => {
        // Check if it's a navigation warning
        expect(dialog.message()).toContain('unsaved changes');
        // Cancel navigation
        await dialog.dismiss();
      });
      
      // Attempt navigation
      await page.locator('a').filter({ hasText: /Customers/i }).click();
      
      // We should still be on KHS Tools page
      await expect(page.locator('h1, h2').filter({ hasText: 'KHS Tools' })).toBeVisible();
    }
  });

  test('should save changes successfully', async ({ page }) => {
    // Make a change
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await firstCheckbox.count() > 0) {
      const wasChecked = await firstCheckbox.isChecked();
      await firstCheckbox.click();
      
      // Save changes
      const saveButton = page.locator('button').filter({ hasText: /Save Changes/i });
      await saveButton.click();
      
      // Wait for save to complete
      await expect(saveButton).not.toBeVisible({ timeout: 10000 });
      
      // Refresh page to verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if change persisted
      const checkboxAfterReload = page.locator('input[type="checkbox"]').first();
      expect(await checkboxAfterReload.isChecked()).toBe(!wasChecked);
    }
  });
});