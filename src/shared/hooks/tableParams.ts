import { PAGE_SIZES, type TableParams, type TableSort } from '@/shared/api/table'

// Table state lives in the URL, prefixed per table so two tables on one page don't clash:
//   ?exchange.page=2&exchange.size=50&exchange.sort=date.asc&exchange.q=usd
// Values equal to the defaults are left out to keep links short.

export type TableDefaults = { size: number; sort?: TableSort }

const parseSort = (raw: string | null): TableSort | undefined => {
  const match = raw ? /^(.+)\.(asc|desc)$/.exec(raw) : null
  return match ? { column: match[1], dir: match[2] as TableSort['dir'] } : undefined
}

const sameSort = (a?: TableSort, b?: TableSort) => a?.column === b?.column && a?.dir === b?.dir

export function readTableParams(
  search: URLSearchParams,
  key: string,
  defaults: TableDefaults,
): TableParams {
  const page = Number(search.get(`${key}.page`))
  const size = Number(search.get(`${key}.size`))
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    size: PAGE_SIZES.includes(size) ? size : defaults.size,
    sort: parseSort(search.get(`${key}.sort`)) ?? defaults.sort,
    search: search.get(`${key}.q`) || undefined,
  }
}

export function writeTableParams(
  search: URLSearchParams,
  key: string,
  params: TableParams,
  defaults: TableDefaults,
): URLSearchParams {
  const next = new URLSearchParams(search)
  const set = (name: string, value: string | undefined) =>
    value === undefined ? next.delete(`${key}.${name}`) : next.set(`${key}.${name}`, value)

  set('page', params.page > 1 ? String(params.page) : undefined)
  set('size', params.size !== defaults.size ? String(params.size) : undefined)
  set(
    'sort',
    params.sort && !sameSort(params.sort, defaults.sort)
      ? `${params.sort.column}.${params.sort.dir}`
      : undefined,
  )
  set('q', params.search?.trim() || undefined)
  return next
}
