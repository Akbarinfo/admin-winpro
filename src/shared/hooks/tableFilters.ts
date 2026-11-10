// Table filters live in the URL next to the table's other params, under the same prefix:
//   ?profile.supplierId=3&profile.type=FRAME&profile.hasPriceWarning=1
// Empty values are left out. A boolean filter is either on (true) or off (null), as in the old panel.

export type FilterKind = 'string' | 'number' | 'boolean'
export type FilterSchema = Record<string, FilterKind>

type ValueOf<K extends FilterKind> = K extends 'number'
  ? number
  : K extends 'boolean'
    ? true
    : string

export type FilterValues<S extends FilterSchema> = { [N in keyof S]: ValueOf<S[N]> | null }

function parse(kind: FilterKind, raw: string | null) {
  if (raw === null || raw === '') return null
  if (kind === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  if (kind === 'boolean') return raw === '1' ? true : null
  return raw
}

export function readTableFilters<S extends FilterSchema>(
  search: URLSearchParams,
  key: string,
  schema: S,
): FilterValues<S> {
  const out: Record<string, unknown> = {}
  for (const [name, kind] of Object.entries(schema))
    out[name] = parse(kind, search.get(`${key}.${name}`))
  return out as FilterValues<S>
}

/** Writes the filters and goes back to the first page — the old page may not exist under new filters. */
export function writeTableFilters<S extends FilterSchema>(
  search: URLSearchParams,
  key: string,
  schema: S,
  values: Partial<FilterValues<S>>,
): URLSearchParams {
  const next = new URLSearchParams(search)
  for (const [name, kind] of Object.entries(schema)) {
    if (!(name in values)) continue
    const value: unknown = values[name]
    const raw =
      value === null || value === undefined || value === '' || value === false
        ? null
        : kind === 'boolean'
          ? '1'
          : String(value).trim() || null
    if (raw === null) next.delete(`${key}.${name}`)
    else next.set(`${key}.${name}`, raw)
  }
  next.delete(`${key}.page`)
  return next
}
