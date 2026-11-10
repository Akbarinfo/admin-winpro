import { describe, expect, it } from 'vitest'
import { buildTableBody } from './table'

describe('buildTableBody', () => {
  it('turns a 1-based page into a row offset', () => {
    expect(buildTableBody({ page: 1, size: 20 })).toMatchObject({ start: 0, length: 20 })
    expect(buildTableBody({ page: 3, size: 50 })).toMatchObject({ start: 100, length: 50 })
  })

  it('sends the sort in upper case, as the old panel did', () => {
    const body = buildTableBody({ page: 1, size: 10, sort: { column: 'date', dir: 'asc' } })
    expect(body.order).toEqual([{ column: 'date', dir: 'ASC' }])
  })

  it('defaults to newest first when no sort is chosen', () => {
    expect(buildTableBody({ page: 1, size: 10 }).order).toEqual([{ column: 'id', dir: 'DESC' }])
  })

  it('sends an empty order for tables the old panel requested unsorted', () => {
    expect(buildTableBody({ page: 1, size: 10 }, {}, false).order).toEqual([])
  })

  it('passes search and filter through', () => {
    const body = buildTableBody({ page: 1, size: 10, search: 'рама' }, { supplierId: 3 })
    expect(body.search).toEqual({ value: 'рама', regex: true })
    expect(body.filter).toEqual({ supplierId: 3 })
  })
})
