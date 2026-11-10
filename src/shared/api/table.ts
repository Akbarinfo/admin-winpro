// Server-side tables. The backend expects the DataTables request format on POST /v1/<resource>/table.

export type SortDir = 'asc' | 'desc'
export type TableSort = { column: string; dir: SortDir }

export type TableParams = {
  /** 1-based */
  page: number
  size: number
  sort?: TableSort
  search?: string
}

export type TableBody = ReturnType<typeof buildTableBody>

export type TablePage<T> = {
  data: T[]
  recordsTotal: number
  /** Total after filters — use this for pagination. */
  recordsFiltered: number
}

export const PAGE_SIZES = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20
/** The old panel always sent an order; newest first. */
export const DEFAULT_SORT: TableSort = { column: 'id', dir: 'desc' }

/** `sorted: false` — a table the old panel requested with an empty `order` (e.g. product prices). */
export function buildTableBody(params: TableParams, filter: object = {}, sorted = true) {
  const sort = params.sort ?? DEFAULT_SORT
  return {
    id: null,
    draw: 1,
    start: (params.page - 1) * params.size,
    length: params.size,
    recordsTotal: 0,
    columns: [],
    order: sorted ? [{ column: sort.column, dir: sort.dir.toUpperCase() as 'ASC' | 'DESC' }] : [],
    search: { value: params.search ?? '', regex: true },
    filter,
  }
}
