import { test, expect } from '@playwright/test'

test.describe('Sample e2e tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SongScript/i)
  })

  test('page has content', async ({ page }) => {
    await page.goto('/')
    // Check that the page loaded (body exists)
    await expect(page.locator('body')).toBeVisible()
  })
})
