import { test, expect } from '@playwright/test';

test.describe('KHS Tools Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to KHS Info page
    await page.goto('/');
    await page.click('text=KHS Info');
    await expect(page.locator('h1')).toContainText('KHS Info');
  });

  test('should show Tools List tab by default', async ({ page }) => {
    // Check that Tools List tab is active
    const activeTab = page.locator('button[style*="border-bottom: 2px solid #3B82F6"]');
    await expect(activeTab).toContainText('Tools List');
  });

  test('should track unsaved changes', async ({ page }) => {
    // Toggle a demo category
    await page.check('input[type="checkbox"]:near(:text("Demo"))');
    
    // Check for unsaved indicator
    await expect(page.locator('text=Unsaved')).toBeVisible();
    
    // Save Changes button should appear
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test('should warn before navigating away with unsaved changes', async ({ page }) => {
    // Make a change
    await page.check('input[type="checkbox"]:near(:text("Demo"))');
    
    // Try to switch tabs
    await page.click('text=Debug');
    
    // Modal should appear
    await expect(page.locator('h2:has-text("Unsaved Changes")')).toBeVisible();
    await expect(page.locator('text=You have unsaved changes. What would you like to do?')).toBeVisible();
    
    // Cancel should keep us on the same tab
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('button[style*="border-bottom: 2px solid #3B82F6"]')).toContainText('Tools List');
  });

  test('should access Debug tab', async ({ page }) => {
    // Click Debug tab
    await page.click('text=Debug');
    
    // Check for debug console
    await expect(page.locator('text=Debug Console Output')).toBeVisible();
    await expect(page.locator('text=Sync Status')).toBeVisible();
    await expect(page.locator('text=Debug Controls')).toBeVisible();
  });

  test('should show sync status indicators', async ({ page }) => {
    // Check for version indicator
    await expect(page.locator('text=/v\\d+/')).toBeVisible();
  });

  test('should handle tool selection', async ({ page }) => {
    // Enable demo mode
    await page.check('input[type="checkbox"]:near(:text("Demo"))');
    
    // Select Kitchen category
    await page.check('input[type="checkbox"]:near(:text("Kitchen"))');
    
    // Kitchen tools should be visible
    await expect(page.locator('text=Sledgehammer (20lb)')).toBeVisible();
    
    // Check a tool
    await page.check('input[type="checkbox"]:near(:text("Sledgehammer (20lb)"))');
  });
});