import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { TableParams, TableSort } from '@/shared/api/table'
import { readTableParams, writeTableParams } from './tableParams'

/**
 * Page, size, sort and search of one table, stored in the URL under `key`.
 * Links can be shared and the Back button returns to the same page of the table.
 */
export function useTableParams(key: string, size: number, sort?: TableSort) {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortColumn = sort?.column
  const sortDir = sort?.dir

  const defaults = useMemo(
    () => ({
      size,
      sort: sortColumn && sortDir ? { column: sortColumn, dir: sortDir } : undefined,
    }),
    [size, sortColumn, sortDir],
  )

  const params = useMemo(
    () => readTableParams(searchParams, key, defaults),
    [searchParams, key, defaults],
  )

  const setParams = useCallback(
    (patch: Partial<TableParams>) =>
      setSearchParams(
        (prev) =>
          writeTableParams(
            prev,
            key,
            { ...readTableParams(prev, key, defaults), ...patch },
            defaults,
          ),
        { replace: true },
      ),
    [setSearchParams, key, defaults],
  )

  return [params, setParams] as const
}
