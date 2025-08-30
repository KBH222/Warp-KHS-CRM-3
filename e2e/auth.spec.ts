import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should have authentication state persisted', async ({ page }) => {
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
    
    // Go to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should not see authentication screens
    await expect(page.locator('text=Checking authentication')).not.toBeVisible({ timeout: 5000 });
    // Check that we're not on the login page
    await expect(page).not.toHaveURL(/.*\/login/);
    // Check for dashboard or authenticated content
    await expect(page).toHaveURL(/.*\/(dashboard|customers|jobs|khs-info|profile)/);
  });
  
  test('should maintain auth state across page navigations', async ({ page }) => {
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
    
    // Navigate to different pages
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    // Should not require re-authentication
    await expect(page.locator('text=Checking authentication')).not.toBeVisible();
    
    // Navigate to another page
    await page.goto('/khs-info');
    await page.waitForLoadState('networkidle');
    
    // Should still be authenticated
    await expect(page.locator('text=Checking authentication')).not.toBeVisible();
  });
});