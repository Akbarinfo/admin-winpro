import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  readTableFilters,
  writeTableFilters,
  type FilterSchema,
  type FilterValues,
} from './tableFilters'

/**
 * Filters of one table, kept in the URL under the table's key (the same key as useServerTable),
 * so a link or the Back button restores them. Changing a filter returns the table to page 1.
 * `schema` must be a module-level constant.
 */
export function useTableFilters<S extends FilterSchema>(key: string, schema: S) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(
    () => readTableFilters(searchParams, key, schema),
    [searchParams, key, schema],
  )

  const setFilters = useCallback(
    (patch: Partial<FilterValues<S>>) =>
      setSearchParams((prev) => writeTableFilters(prev, key, schema, patch), { replace: true }),
    [setSearchParams, key, schema],
  )

  const clear = useCallback(() => {
    const empty = Object.fromEntries(Object.keys(schema).map((n) => [n, null]))
    setFilters(empty as Partial<FilterValues<S>>)
  }, [schema, setFilters])

  const active = Object.values(filters).some((v) => v !== null)

  return { filters, setFilters, clear, active }
}
