import { test, expect } from '@playwright/test'

// Test song ID - Baraye song from the database
const TEST_SONG_ID = 'j972m34dzqgx6a0r5a00n9k6pd7zekfa'

test.describe('Route Loading Tests', () => {
  test('homepage (/) loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await expect(page).toHaveTitle(/SongScript/i)

    // Check that the page content loaded
    await expect(page.locator('h1')).toContainText('SongScript')

    // Check for the "Failed to fetch dynamically imported module" error
    const hasDynamicImportError = errors.some((e) =>
      e.includes('Failed to fetch dynamically imported module')
    )
    expect(hasDynamicImportError).toBe(false)
  })

  test('login page (/login) loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/login')

    // Check that the login form is visible
    await expect(page.locator('h1')).toContainText('SongScript Admin')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText(
      'Send Magic Link'
    )

    // Check for the "Failed to fetch dynamically imported module" error
    const hasDynamicImportError = errors.some((e) =>
      e.includes('Failed to fetch dynamically imported module')
    )
    expect(hasDynamicImportError).toBe(false)
  })

  test('song page (/song/{songId}) loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto(`/song/${TEST_SONG_ID}`)

    // Check that the song page content loaded
    // The song title should be visible (Baraye)
    await expect(page.locator('text=Baraye')).toBeVisible({ timeout: 10000 })

    // Check for the "Failed to fetch dynamically imported module" error
    const hasDynamicImportError = errors.some((e) =>
      e.includes('Failed to fetch dynamically imported module')
    )
    expect(hasDynamicImportError).toBe(false)
  })

  test('navigation between routes works', async ({ page }) => {
    // Start at homepage
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('SongScript')

    // Navigate to login via direct URL
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('SongScript Admin')

    // Navigate back to home by clicking logo
    await page.click('a[href="/"]')
    await expect(page.locator('h1')).toContainText('SongScript')
  })
})
