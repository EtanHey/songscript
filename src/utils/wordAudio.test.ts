import { describe, it, expect } from 'vitest'
import { encodeWordFilename, getWordAudioUrl } from './wordAudio'

describe('wordAudio utilities', () => {
  describe('encodeWordFilename', () => {
    it('encodes Persian text to URL-safe base64', () => {
      const persian = 'برای'
      const encoded = encodeWordFilename(persian)
      // Should be URL-safe base64 (no +, /, or = characters)
      expect(encoded).not.toMatch(/[+/=]/)
    })

    it('produces consistent encoding for same input', () => {
      const persian = 'کوچه'
      const first = encodeWordFilename(persian)
      const second = encodeWordFilename(persian)
      expect(first).toBe(second)
    })

    it('produces different encoding for different inputs', () => {
      const word1 = encodeWordFilename('برای')
      const word2 = encodeWordFilename('کوچه')
      expect(word1).not.toBe(word2)
    })

    it('handles single characters', () => {
      const encoded = encodeWordFilename('ب')
      expect(encoded).toBeTruthy()
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('handles words with spaces', () => {
      const encoded = encodeWordFilename('برای نخبه')
      expect(encoded).toBeTruthy()
      expect(encoded).not.toMatch(/[+/=]/)
    })
  })

  describe('getWordAudioUrl', () => {
    it('returns path under /audio/words/', () => {
      const url = getWordAudioUrl('برای')
      expect(url).toMatch(/^\/audio\/words\//)
    })

    it('returns .mp3 extension', () => {
      const url = getWordAudioUrl('کوچه')
      expect(url).toMatch(/\.mp3$/)
    })

    it('uses encoded filename', () => {
      const persian = 'برای'
      const url = getWordAudioUrl(persian)
      const encoded = encodeWordFilename(persian)
      expect(url).toBe(`/audio/words/${encoded}.mp3`)
    })
  })
})
