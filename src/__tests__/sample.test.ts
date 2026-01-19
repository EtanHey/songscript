import { describe, it, expect } from 'vitest'

describe('Sample tests', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should work with objects', () => {
    const obj = { name: 'SongScript', version: 1 }
    expect(obj).toHaveProperty('name')
    expect(obj.name).toBe('SongScript')
  })
})
