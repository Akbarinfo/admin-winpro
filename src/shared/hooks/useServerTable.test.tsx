import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TableBody, TablePage } from '@/shared/api/table'
import { renderWithProviders } from '@/test/render'
import { useServerTable } from './useServerTable'

type Row = { id: number }
type Table = ReturnType<typeof useServerTable<Row>>

/** Fake backend with `total` rows: ids 1…total. */
function makeFetch(total: number) {
  return vi.fn(async (body: TableBody): Promise<TablePage<Row>> => {
    const count = Math.max(0, Math.min(body.length, total - body.start))
    const data = Array.from({ length: count }, (_, i) => ({ id: body.start + i + 1 }))
    return { data, recordsTotal: total, recordsFiltered: total }
  })
}

function Probe({
  fetchPage,
  onRender,
}: {
  fetchPage: ReturnType<typeof makeFetch>
  onRender: (t: Table) => void
}) {
  const table = useServerTable<Row>({
    key: 'units',
    queryKey: ['units'],
    fetchPage,
    defaultSize: 10,
  })
  onRender(table)
  return <div data-testid="rows">{table.rows.map((r) => r.id).join(',')}</div>
}

/** Renders the hook; `table()` returns its latest result so tests can call its handlers. */
function setup(fetchPage: ReturnType<typeof makeFetch>, url = '/') {
  let latest: Table | undefined
  const result = renderWithProviders(
    <Probe fetchPage={fetchPage} onRender={(t) => (latest = t)} />,
    { url },
  )
  return { ...result, table: () => latest! }
}

describe('useServerTable', () => {
  it('loads the page described by the URL', async () => {
    const fetchPage = makeFetch(57)
    const { table } = setup(fetchPage, '/?units.page=2&units.sort=name.asc')

    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('11,12'))
    expect(fetchPage.mock.calls[0][0]).toMatchObject({
      start: 10,
      length: 10,
      order: [{ column: 'name', dir: 'ASC' }],
    })
    expect(table().pagination).toMatchObject({ page: 2, size: 10, total: 57 })
  })

  it('writes page changes to the URL and fetches the new page', async () => {
    const { table, router } = setup(makeFetch(57))
    await waitFor(() => expect(table().rows).toHaveLength(10))

    act(() => table().pagination.onChange({ page: 3, size: 10 }))
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent(/^21,/))
    expect(router.state.location.search).toBe('?units.page=3')
  })

  it('returns to page 1 when the sort changes', async () => {
    const { table, router } = setup(makeFetch(57), '/?units.page=4')
    await waitFor(() => expect(table().rows).toHaveLength(10))

    act(() => table().onSortChange({ column: 'date', dir: 'desc' }))
    await waitFor(() => expect(router.state.location.search).toBe('?units.sort=date.desc'))
  })

  it('steps back to the last page when the current one no longer exists', async () => {
    // e.g. the last row of the last page was deleted
    const { router } = setup(makeFetch(25), '/?units.page=4')
    await waitFor(() => expect(router.state.location.search).toBe('?units.page=3'))
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('21,22,23,24,25'))
  })

  it('opens with the page size last chosen for the table', async () => {
    const fetchPage = makeFetch(500)
    const first = setup(fetchPage)
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('1,2'))
    act(() => first.table().pagination.onChange({ page: 1, size: 100 }))
    await waitFor(() => expect(fetchPage.mock.calls.at(-1)![0]).toMatchObject({ length: 100 }))
    first.unmount()

    // coming back without it in the URL: still 100
    const second = setup(fetchPage)
    await waitFor(() => expect(second.table().pagination.size).toBe(100))
    expect(fetchPage.mock.calls.at(-1)![0]).toMatchObject({ start: 0, length: 100 })
  })
})
