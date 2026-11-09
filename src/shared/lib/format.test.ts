import { describe, expect, it } from 'vitest'
import { formatDate, formatNumber, todayIso } from './format'

describe('formatDate', () => {
  it('formats ISO dates and timestamps as dd.mm.yyyy', () => {
    expect(formatDate('2026-10-19')).toBe('19.10.2026')
    expect(formatDate('2026-10-19T00:00:00.000+05:00')).toBe('19.10.2026')
  })

  it('returns empty or unknown input unchanged', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('вчера')).toBe('вчера')
  })
})

describe('formatNumber', () => {
  it('uses the ru locale by default (space groups, comma decimals)', () => {
    expect(formatNumber(12648.5, 2).replace(/\s/g, ' ')).toBe('12 648,50')
  })

  it('returns an empty string for missing values', () => {
    expect(formatNumber(null)).toBe('')
    expect(formatNumber(Number.NaN)).toBe('')
  })
})

describe('todayIso', () => {
  it('matches the <input type="date"> format', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
