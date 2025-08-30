import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, context }) => {
  // Mock the auth check endpoint to always return success
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

  // For local development, we'll bypass auth by setting localStorage directly
  await page.goto('/');
  
  // Set auth tokens in localStorage to bypass authentication
  await page.evaluate(() => {
    // Set the token that AuthGuard expects
    localStorage.setItem('khs-crm-token', 'test-auth-token-12345');
    localStorage.setItem('khs-crm-refresh-token', 'test-refresh-token-12345');
    
    // Set user data
    const testUser = {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    };
    
    localStorage.setItem('khs-crm-user', JSON.stringify(testUser));
  });
  
  // Also set cookies if the app uses them
  await context.addCookies([
    {
      name: 'auth-token',
      value: 'test-auth-token-12345',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'session',
      value: 'test-session-12345',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
  
  // Ensure auth directory exists BEFORE saving
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Save the storage state
  await page.context().storageState({ path: authFile });
});