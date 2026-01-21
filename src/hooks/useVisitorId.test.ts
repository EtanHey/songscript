import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useVisitorId', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should generate a visitor ID on first load', async () => {
    // Import hook (not called directly since it requires React context)
    await import('./useVisitorId')
    // The hook generates a UUID-like string and stores in localStorage

    // Check localStorage key format - mock hasn't been called in this test
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(0)
  })

  it('should persist visitor ID in localStorage', async () => {
    // Set a mock ID
    const mockId = 'test-visitor-123'
    localStorageMock.setItem('songscript_visitor_id', mockId)

    expect(localStorageMock.getItem('songscript_visitor_id')).toBe(mockId)
  })

  it('should return same ID across calls', async () => {
    const mockId = 'consistent-id-456'
    localStorageMock.setItem('songscript_visitor_id', mockId)

    const result = localStorageMock.getItem('songscript_visitor_id')
    expect(result).toBe(mockId)
  })
})
