import { describe, it, expect } from 'vitest'
import { formatTime, parseTime, calculateDuration } from './time'

describe('formatTime', () => {
  it('formats seconds less than a minute', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(59)).toBe('0:59')
  })

  it('formats seconds with minutes', () => {
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(90)).toBe('1:30')
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(599)).toBe('9:59')
  })

  it('formats seconds with hours', () => {
    expect(formatTime(3600)).toBe('1:00:00')
    expect(formatTime(3661)).toBe('1:01:01')
    expect(formatTime(7200)).toBe('2:00:00')
  })

  it('handles edge cases', () => {
    expect(formatTime(-1)).toBe('0:00')
    expect(formatTime(NaN)).toBe('0:00')
    expect(formatTime(Infinity)).toBe('0:00')
  })

  it('formats fractional seconds (truncates)', () => {
    expect(formatTime(14.81)).toBe('0:14')
    expect(formatTime(113.43)).toBe('1:53')
  })
})

describe('parseTime', () => {
  it('parses MM:SS format', () => {
    expect(parseTime('0:00')).toBe(0)
    expect(parseTime('0:05')).toBe(5)
    expect(parseTime('1:30')).toBe(90)
    expect(parseTime('9:59')).toBe(599)
  })

  it('parses H:MM:SS format', () => {
    expect(parseTime('1:00:00')).toBe(3600)
    expect(parseTime('1:01:01')).toBe(3661)
    expect(parseTime('2:30:45')).toBe(9045)
  })

  it('handles invalid input', () => {
    expect(parseTime('')).toBe(0)
    expect(parseTime('invalid')).toBe(0)
    expect(parseTime('1:2:3:4')).toBe(0)
    expect(parseTime('-1:30')).toBe(0)
  })
})

describe('calculateDuration', () => {
  it('calculates duration between two times', () => {
    expect(calculateDuration(0, 10)).toBe(10)
    expect(calculateDuration(14.81, 17.46)).toBeCloseTo(2.65)
    expect(calculateDuration(113.43, 123.56)).toBeCloseTo(10.13)
  })

  it('returns 0 for negative duration', () => {
    expect(calculateDuration(10, 5)).toBe(0)
  })

  it('handles edge cases', () => {
    expect(calculateDuration(-1, 5)).toBe(0)
    expect(calculateDuration(5, -1)).toBe(0)
    expect(calculateDuration(NaN, 5)).toBe(0)
    expect(calculateDuration(5, Infinity)).toBe(0)
  })
})
