import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('renders signup form correctly', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear (there's a 1.5s delay in the component)
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Display Name')).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });

  test('migration checkbox is checked by default', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear and check that the migration checkbox is checked by default
    await expect(page.getByRole('checkbox')).toBeChecked({ timeout: 5000 });
  });

  test('form validation works correctly', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    // Test JavaScript validation by removing HTML5 validation attributes
    // This tests the JS validation layer which shows our custom error message
    await emailInput.fill('test@example.com');
    const displayNameInput = page.locator('#displayName');
    await displayNameInput.fill('ab'); // Too short

    // Remove HTML5 minLength to let JS validation run
    await page.evaluate(() => {
      const field = document.getElementById('displayName');
      if (field) field.removeAttribute('minLength');
    });

    await page.click('button[type=submit]');

    // The JS validation message shows "Display name must be between 3 and 20 characters."
    await expect(page.getByText(/Display name must be between 3 and 20/i)).toBeVisible();

    // Test with display name too long - maxLength attribute prevents typing 21+ chars,
    // so we need to remove it and use JS to set the value
    await page.evaluate(() => {
      const field = document.getElementById('displayName') as HTMLInputElement;
      if (field) {
        field.removeAttribute('maxLength');
        field.value = 'a'.repeat(21);
        // Trigger React's onChange by dispatching an input event
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.click('button[type=submit]');
    await expect(page.getByText(/Display name must be between 3 and 20/i)).toBeVisible();
  });

  test('stores migration preference in localStorage when checked', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill('test-new@example.com');
    await page.locator('#displayName').fill('TestUser');

    // Ensure checkbox is checked (should be by default)
    await expect(page.getByRole('checkbox')).toBeChecked();

    await page.click('button[type=submit]');

    // Wait a bit for the form submission to process and set localStorage
    await page.waitForTimeout(1000);

    // Check localStorage values
    const migrateValue = await page.evaluate(() => localStorage.getItem('songscript_migrate_on_signup'));
    const displayNameValue = await page.evaluate(() => localStorage.getItem('songscript_signup_display_name'));

    expect(migrateValue).toBe('true');
    expect(displayNameValue).toBe('TestUser');
  });

  test('stores false in localStorage when migration checkbox is unchecked', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill('test-new2@example.com');
    await page.locator('#displayName').fill('TestUser');

    // Uncheck the migration checkbox
    await page.getByRole('checkbox').uncheck();
    await expect(page.getByRole('checkbox')).not.toBeChecked();

    await page.click('button[type=submit]');

    // Wait a bit for the form submission to process and set localStorage
    await page.waitForTimeout(1000);

    // Check localStorage values
    const migrateValue = await page.evaluate(() => localStorage.getItem('songscript_migrate_on_signup'));
    const displayNameValue = await page.evaluate(() => localStorage.getItem('songscript_signup_display_name'));

    expect(migrateValue).toBe('false');
    expect(displayNameValue).toBe('TestUser');
  });
});
