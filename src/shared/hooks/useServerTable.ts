import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  buildTableBody,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  type TableBody,
  type TablePage,
  type TableSort,
} from '@/shared/api/table'
import { useTableParams } from './useTableParams'

type ServerTableOptions<T> = {
  /** URL prefix for this table's params, e.g. 'exchange'. */
  key: string
  /** Base query key of the resource; invalidating it refreshes the table. */
  queryKey: QueryKey
  /** Calls POST /v1/<resource>/table — defined in the feature's api.ts. */
  fetchPage: (body: TableBody, signal: AbortSignal) => Promise<TablePage<T>>
  filter?: object
  defaultSort?: TableSort
  defaultSize?: number
  /** false — send an empty `order`, as the old panel did for some tables. */
  sorted?: boolean
}

/** Everything a server-side table needs: rows, loading state, sort and pagination wired to the URL. */
export function useServerTable<T>({
  key,
  queryKey,
  fetchPage,
  filter,
  defaultSort = DEFAULT_SORT,
  defaultSize = DEFAULT_PAGE_SIZE,
  sorted = true,
}: ServerTableOptions<T>) {
  const [params, setParams] = useTableParams(key, defaultSize, defaultSort)

  const query = useQuery({
    queryKey: [...queryKey, 'table', params, filter ?? null],
    queryFn: ({ signal }) => fetchPage(buildTableBody(params, filter, sorted), signal),
    // Keep showing the current page while the next one loads, so the table doesn't jump.
    placeholderData: keepPreviousData,
  })

  const total = query.data?.recordsFiltered ?? 0
  const pageCount = Math.max(1, Math.ceil(total / params.size))

  // Deleting the last row of the last page leaves us past the end — step back.
  const pastEnd = !query.isFetching && total > 0 && params.page > pageCount
  useEffect(() => {
    if (pastEnd) setParams({ page: pageCount })
  }, [pastEnd, pageCount, setParams])

  return {
    rows: query.data?.data ?? [],
    /** First load: no data yet. */
    isLoading: query.isPending,
    /** Any request in flight, including page changes. */
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    sort: params.sort,
    onSortChange: (sort: TableSort) => setParams({ sort, page: 1 }),
    search: params.search ?? '',
    onSearchChange: (search: string) => setParams({ search, page: 1 }),
    /** «№» column: number of the row across pages (index is its position on this page). */
    rowNumber: (index: number) => (params.page - 1) * params.size + index + 1,
    pagination: {
      page: params.page,
      size: params.size,
      total,
      onChange: (next: { page: number; size: number }) => setParams(next),
    },
  }
}
