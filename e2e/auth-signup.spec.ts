import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('renders signup form correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Check that all form elements are visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Display Name')).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });

  test('migration checkbox is checked by default', async ({ page }) => {
    await page.goto('/signup');
    
    // Check that the migration checkbox is checked by default
    await expect(page.getByRole('checkbox')).toBeChecked();
  });

  test('form validation works correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Test email required
    await page.click('button[type=submit]');
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    
    // Test display name length validation
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=displayName]', 'ab'); // Too short
    await page.click('button[type=submit]');
    await expect(page.getByText(/display name.*3.*20/i)).toBeVisible();
    
    await page.fill('[name=displayName]', 'a'.repeat(21)); // Too long
    await page.click('button[type=submit]');
    await expect(page.getByText(/display name.*3.*20/i)).toBeVisible();
  });

  test('stores migration preference in localStorage when checked', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=displayName]', 'TestUser');
    
    // Ensure checkbox is checked (should be by default)
    await expect(page.getByRole('checkbox')).toBeChecked();
    
    await page.click('button[type=submit]');
    
    // Check localStorage values
    const migrateValue = await page.evaluate(() => localStorage.getItem('songscript_migrate_on_signup'));
    const displayNameValue = await page.evaluate(() => localStorage.getItem('songscript_signup_display_name'));
    
    expect(migrateValue).toBe('true');
    expect(displayNameValue).toBe('TestUser');
  });

  test('stores false in localStorage when migration checkbox is unchecked', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=displayName]', 'TestUser');
    
    // Uncheck the migration checkbox
    await page.getByRole('checkbox').uncheck();
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    
    await page.click('button[type=submit]');
    
    // Check localStorage values
    const migrateValue = await page.evaluate(() => localStorage.getItem('songscript_migrate_on_signup'));
    const displayNameValue = await page.evaluate(() => localStorage.getItem('songscript_signup_display_name'));
    
    expect(migrateValue).toBe('false');
    expect(displayNameValue).toBe('TestUser');
  });
});
