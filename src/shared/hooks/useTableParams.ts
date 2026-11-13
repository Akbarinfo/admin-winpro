import { useCallback, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { PAGE_SIZES, type TableParams, type TableSort } from '@/shared/api/table'
import { useTablePrefs } from '@/shared/store/tablePrefs'
import { readTableParams, writeTableParams } from './tableParams'

/**
 * Page, size, sort and search of one table, stored in the URL under `key`.
 * Links can be shared and the Back button returns to the same page of the table.
 * «На странице» is remembered for the table (its section + key): it opens with the last one chosen.
 */
export function useTableParams(key: string, defaultSize: number, sort?: TableSort) {
  const [searchParams, setSearchParams] = useSearchParams()
  const table = `${useLocation().pathname.split('/')[1]}.${key}`
  const saved = useTablePrefs((s) => s.sizes[table])
  const setSize = useTablePrefs((s) => s.setSize)
  const size = saved !== undefined && PAGE_SIZES.includes(saved) ? saved : defaultSize
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
    (patch: Partial<TableParams>) => {
      if (patch.size !== undefined && patch.size !== defaults.size) setSize(table, patch.size)
      setSearchParams(
        (prev) =>
          writeTableParams(
            prev,
            key,
            { ...readTableParams(prev, key, defaults), ...patch },
            defaults,
          ),
        { replace: true },
      )
    },
    [setSearchParams, key, defaults, setSize, table],
  )

  return [params, setParams] as const
}
