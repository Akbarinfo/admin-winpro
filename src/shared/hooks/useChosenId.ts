import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * A row chosen in one panel of a page with linked panels, kept in the URL (?param=id) so a
 * reload or a shared link opens the same panels. Choosing another row (or dropping it) also
 * removes `dependents`: params, or table param prefixes, of the panels that belonged to it.
 *
 *   const type = useChosenId('typeId', ['specId', 'specs', 'tparam'])
 *   <DataTable selectedKey={type.id} onRowClick={(row) => type.choose(row.id)} />
 */
export function useChosenId(param: string, dependents: string[] = []) {
  const [params, setParams] = useSearchParams()
  const raw = Number(params.get(param))
  const id = Number.isInteger(raw) && raw > 0 ? raw : null

  // A string, so a list literal at the call site doesn't make a new callback every render.
  const reset = dependents.join(' ')

  const set = useCallback(
    (next: number | null) =>
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev)
          const gone = reset.split(' ').filter(Boolean)
          for (const k of [...out.keys()])
            if (gone.some((d) => k === d || k.startsWith(`${d}.`))) out.delete(k)
          if (next === null) out.delete(param)
          else out.set(param, String(next))
          return out
        },
        { replace: true },
      ),
    [setParams, param, reset],
  )

  /** The chosen row clicked again keeps what depends on it. */
  const choose = useCallback((next: number) => next !== id && set(next), [id, set])
  /** A deleted row: if it was the chosen one, its panels go back to «choose one». */
  const drop = useCallback((deleted: number) => deleted === id && set(null), [id, set])

  return { id, choose, drop }
}
