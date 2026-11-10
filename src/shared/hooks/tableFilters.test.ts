import { describe, expect, it } from 'vitest'
import { readTableFilters, writeTableFilters } from './tableFilters'

const SCHEMA = { searchTxt: 'string', supplierId: 'number', hasPriceWarning: 'boolean' } as const

describe('readTableFilters', () => {
  it('reads typed values under the table key', () => {
    const url = new URLSearchParams(
      'p.searchTxt=ram&p.supplierId=3&p.hasPriceWarning=1&q.supplierId=9',
    )
    expect(readTableFilters(url, 'p', SCHEMA)).toEqual({
      searchTxt: 'ram',
      supplierId: 3,
      hasPriceWarning: true,
    })
  })

  it('gives null for missing or broken values', () => {
    const url = new URLSearchParams('p.supplierId=abc&p.hasPriceWarning=0')
    expect(readTableFilters(url, 'p', SCHEMA)).toEqual({
      searchTxt: null,
      supplierId: null,
      hasPriceWarning: null,
    })
  })
})

describe('writeTableFilters', () => {
  it('sets values, drops empty ones and resets the page', () => {
    const url = new URLSearchParams('p.page=4&p.size=50&p.searchTxt=old&other=1')
    const next = writeTableFilters(url, 'p', SCHEMA, {
      searchTxt: '  ',
      supplierId: 7,
      hasPriceWarning: true,
    })
    expect(next.toString()).toBe('p.size=50&other=1&p.supplierId=7&p.hasPriceWarning=1')
  })

  it('leaves filters that are not in the patch alone', () => {
    const url = new URLSearchParams('p.supplierId=7')
    const next = writeTableFilters(url, 'p', SCHEMA, { searchTxt: 'x' })
    expect(readTableFilters(next, 'p', SCHEMA)).toEqual({
      searchTxt: 'x',
      supplierId: 7,
      hasPriceWarning: null,
    })
  })
})
