import { describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import { formatDate, formatDateTime, formatNumber, formatRelative, todayIso } from './format'

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

describe('formatDateTime', () => {
  it('keeps the time as written, without seconds', () => {
    expect(formatDateTime('2026-10-19T14:05:33.123')).toBe('19.10.2026 14:05')
    expect(formatDateTime('2026-10-19 09:00:00')).toBe('19.10.2026 09:00')
  })
  it('falls back to the date, and to empty', () => {
    expect(formatDateTime('2026-10-19')).toBe('19.10.2026')
    expect(formatDateTime(null)).toBe('')
  })
})

describe('formatRelative', () => {
  const now = Date.UTC(2026, 10, 14, 12, 0, 0)
  it('says how long ago, in the interface language', () => {
    expect(formatRelative(now - 20_000, now)).toBe('только что')
    expect(formatRelative(now - 5 * 60_000, now)).toBe('5 минут назад')
    expect(formatRelative(now - 3 * 3600_000, now)).toBe('3 часа назад')
    expect(formatRelative(now - 26 * 3600_000, now)).toBe('вчера')
  })

  it('says «hozir» in Uzbek under a minute', async () => {
    await i18n.changeLanguage('uz')
    try {
      expect(formatRelative(now - 5_000, now)).toBe('hozir')
    } finally {
      await i18n.changeLanguage('ru')
    }
  })
})
