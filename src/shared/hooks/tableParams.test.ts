import { describe, expect, it } from 'vitest'
import { readTableParams, writeTableParams } from './tableParams'

const defaults = { size: 20, sort: { column: 'id', dir: 'desc' as const } }

describe('readTableParams', () => {
  it('falls back to defaults on an empty URL', () => {
    expect(readTableParams(new URLSearchParams(), 'units', defaults)).toEqual({
      page: 1,
      size: 20,
      sort: defaults.sort,
      search: undefined,
    })
  })

  it('reads only its own prefix', () => {
    const url = new URLSearchParams(
      'units.page=3&units.size=50&units.sort=name.asc&units.q=рама&other.page=9',
    )
    expect(readTableParams(url, 'units', defaults)).toEqual({
      page: 3,
      size: 50,
      sort: { column: 'name', dir: 'asc' },
      search: 'рама',
    })
  })

  it('ignores invalid values instead of breaking the table', () => {
    const url = new URLSearchParams('units.page=-2&units.size=7&units.sort=name.sideways')
    expect(readTableParams(url, 'units', defaults)).toMatchObject({
      page: 1,
      size: 20,
      sort: defaults.sort,
    })
  })
})

describe('writeTableParams', () => {
  it('omits values equal to the defaults', () => {
    const next = writeTableParams(
      new URLSearchParams(),
      'units',
      { page: 1, size: 20, sort: defaults.sort },
      defaults,
    )
    expect(next.toString()).toBe('')
  })

  it('writes changed values and keeps other tables untouched', () => {
    const next = writeTableParams(
      new URLSearchParams('other.page=9'),
      'units',
      { page: 2, size: 50, sort: { column: 'name', dir: 'asc' }, search: ' usd ' },
      defaults,
    )
    expect(Object.fromEntries(next)).toEqual({
      'other.page': '9',
      'units.page': '2',
      'units.size': '50',
      'units.sort': 'name.asc',
      'units.q': 'usd',
    })
  })

  it('round-trips through readTableParams', () => {
    const params = {
      page: 4,
      size: 100,
      sort: { column: 'date', dir: 'asc' as const },
      search: 'eur',
    }
    const url = writeTableParams(new URLSearchParams(), 'fx', params, defaults)
    expect(readTableParams(url, 'fx', defaults)).toEqual(params)
  })
})
