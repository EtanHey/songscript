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
    // The checkbox is a custom div implementation, look for the "Bring my learning progress" text
    await expect(page.getByText('Bring my learning progress to this account')).toBeVisible();
  });

  test('migration checkbox is checked by default', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to appear and check that the checkbox container is in checked state
    // Look for the container with the border styling - it has the text inside
    const checkboxContainer = page.locator('[class*="border-emerald-500"]').filter({ hasText: 'Bring my learning progress' });
    await expect(checkboxContainer).toBeVisible({ timeout: 5000 });
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

    // The checkbox is checked by default, just submit
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

    // Click the checkbox container to toggle it (it's a custom div)
    const checkboxContainer = page.locator('div').filter({ hasText: 'Bring my learning progress to this account' }).first();
    await checkboxContainer.click();

    await page.click('button[type=submit]');

    // Wait a bit for the form submission to process and set localStorage
    await page.waitForTimeout(1000);

    // Check localStorage values
    const migrateValue = await page.evaluate(() => localStorage.getItem('songscript_migrate_on_signup'));
    const displayNameValue = await page.evaluate(() => localStorage.getItem('songscript_signup_display_name'));

    expect(migrateValue).toBe('false');
    expect(displayNameValue).toBe('TestUser');
  });

  test('checkbox toggles visually on repeated clicks', async ({ page }) => {
    await page.goto('/signup');

    // The checkbox is a custom div implementation at src/routes/signup.tsx:169
    // It has dynamic class binding - "border-emerald-500" when checked, else "border-slate-700"
    // The main container div is at index 3 when filtered by text
    const checkboxContainer = page.locator('div')
      .filter({ hasText: 'Bring my learning progress to this account' })
      .nth(3); // The div with p-4 rounded-lg border-2 classes

    await expect(checkboxContainer).toBeVisible({ timeout: 5000 });

    // Initially checked - the emerald-500 border indicates checked state
    await expect(checkboxContainer).toHaveClass(/border-emerald-500/);

    // Toggle off
    await checkboxContainer.click();
    await page.waitForTimeout(100);
    // After toggle, should have border-slate-700 (unchecked state)
    await expect(checkboxContainer).not.toHaveClass(/border-emerald-500/);
    await expect(checkboxContainer).toHaveClass(/border-slate-700/);

    // Toggle back on
    await checkboxContainer.click();
    await page.waitForTimeout(100);
    await expect(checkboxContainer).toHaveClass(/border-emerald-500/);

    // Toggle off again
    await checkboxContainer.click();
    await page.waitForTimeout(100);
    await expect(checkboxContainer).not.toHaveClass(/border-emerald-500/);
  });

  test('no console errors during checkbox interaction', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/signup');

    // Wait for form to appear
    const checkboxContainer = page.locator('div').filter({ hasText: 'Bring my learning progress to this account' }).first();
    await expect(checkboxContainer).toBeVisible({ timeout: 5000 });

    // Perform multiple toggle operations
    for (let i = 0; i < 5; i++) {
      await checkboxContainer.click();
      await page.waitForTimeout(100);
    }

    // Verify no console errors occurred
    expect(consoleErrors).toEqual([]);
  });
});
