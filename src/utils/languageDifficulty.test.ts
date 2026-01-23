import { describe, it, expect } from 'vitest';
import { getLanguageMultiplier } from '../../convex/languageDifficulty';

describe('languageDifficulty', () => {
  it('should return 1.5x for Hebrew', () => {
    expect(getLanguageMultiplier('hebrew')).toBe(1.5);
    expect(getLanguageMultiplier('he')).toBe(1.5);
    expect(getLanguageMultiplier('Hebrew')).toBe(1.5);
  });

  it('should return 1.5x for Persian/fa', () => {
    expect(getLanguageMultiplier('persian')).toBe(1.5);
    expect(getLanguageMultiplier('fa')).toBe(1.5);
    expect(getLanguageMultiplier('Persian')).toBe(1.5);
  });

  it('should return 2.0x for Arabic', () => {
    expect(getLanguageMultiplier('arabic')).toBe(2.0);
    expect(getLanguageMultiplier('ar')).toBe(2.0);
    expect(getLanguageMultiplier('Arabic')).toBe(2.0);
  });

  it('should return 2.0x for Japanese', () => {
    expect(getLanguageMultiplier('japanese')).toBe(2.0);
    expect(getLanguageMultiplier('ja')).toBe(2.0);
    expect(getLanguageMultiplier('Japanese')).toBe(2.0);
  });

  it('should return 1.0x for Spanish', () => {
    expect(getLanguageMultiplier('spanish')).toBe(1.0);
    expect(getLanguageMultiplier('es')).toBe(1.0);
    expect(getLanguageMultiplier('Spanish')).toBe(1.0);
  });

  it('should return 1.0x for unknown language', () => {
    expect(getLanguageMultiplier('unknown')).toBe(1.0);
    expect(getLanguageMultiplier('xyz')).toBe(1.0);
    expect(getLanguageMultiplier('')).toBe(1.0);
  });
});
