import { describe, expect, it } from 'vitest'
import {
  caretAfter,
  formatNumberText,
  getPageItems,
  nextSort,
  numberToText,
  parseNumber,
} from './helpers'

describe('formatNumberText', () => {
  it('groups thousands and uses a comma for decimals', () => {
    expect(formatNumberText('15253')).toBe('15 253')
    expect(formatNumberText('1234567.891')).toBe('1 234 567,891')
    expect(formatNumberText('-10000')).toBe('-10 000')
  })

  it('keeps unfinished input', () => {
    expect(formatNumberText('1000,')).toBe('1 000,')
    expect(formatNumberText(',5')).toBe(',5')
    expect(formatNumberText('-')).toBe('-')
  })
})

describe('numberToText', () => {
  it('pads decimals up to the minimum but never cuts them', () => {
    expect(numberToText(1.5, 2)).toBe('1,50')
    expect(numberToText(10000, 2)).toBe('10 000,00')
    expect(numberToText(0.0000721, 2)).toBe('0,0000721')
    expect(numberToText(12648.5)).toBe('12 648,5')
  })
})

describe('caretAfter', () => {
  it('skips group spaces', () => {
    expect(caretAfter('15 000', 2)).toBe(2)
    expect(caretAfter('1 525 300', 4)).toBe(5)
    expect(caretAfter('12', 5)).toBe(2)
  })
})

describe('nextSort', () => {
  it('sorts a new column ascending', () => {
    expect(nextSort('date')).toEqual({ column: 'date', dir: 'asc' })
    expect(nextSort('date', { column: 'rate', dir: 'asc' })).toEqual({ column: 'date', dir: 'asc' })
  })

  it('flips the direction on the same column', () => {
    expect(nextSort('date', { column: 'date', dir: 'asc' })).toEqual({
      column: 'date',
      dir: 'desc',
    })
    expect(nextSort('date', { column: 'date', dir: 'desc' })).toEqual({
      column: 'date',
      dir: 'asc',
    })
  })
})

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows first, last and neighbours with gaps in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
  })

  it('shows more pages near the edges instead of a one-page gap', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 'gap', 20])
    expect(getPageItems(20, 20)).toEqual([1, 'gap', 17, 18, 19, 20])
  })
})

describe('parseNumber', () => {
  it('parses dots, commas and spaces', () => {
    expect(parseNumber('12.5')).toBe(12.5)
    expect(parseNumber('12,5')).toBe(12.5)
    expect(parseNumber('12 648,50')).toBe(12648.5)
    expect(parseNumber('-3')).toBe(-3)
  })

  it('treats unfinished input as no value yet', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('-')).toBeNull()
    expect(parseNumber(',')).toBeNull()
  })
})
