import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * The chosen variant and specification row, in the URL (?typeId=&specId=), so a reload or
 * a shared link opens the same panels. Choosing another variant drops the specification and
 * the inner tables' pages, which belong to the previous one.
 */
export function useSelection() {
  const [params, setParams] = useSearchParams()
  const read = (key: string) => {
    const n = Number(params.get(key))
    return Number.isInteger(n) && n > 0 ? n : null
  }

  /** Sets (or with null removes) `key`, dropping the params of what belonged to the previous one. */
  const choose = useCallback(
    (key: 'typeId' | 'specId', id: number | null, reset: string[]) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const k of [...next.keys()])
            if (reset.some((r) => k === r || k.startsWith(`${r}.`))) next.delete(k)
          if (id === null) next.delete(key)
          else next.set(key, String(id))
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const typeId = read('typeId')
  const specId = read('specId')
  const TYPE_CHILDREN = ['specId', 'specs', 'tparam', 'sparam']

  return {
    typeId,
    specId,
    // the chosen variant clicked again keeps its specification row (as before)
    chooseType: (id: number) => id !== typeId && choose('typeId', id, TYPE_CHILDREN),
    chooseSpec: (id: number) => id !== specId && choose('specId', id, ['sparam']),
    /** A deleted variant or row: its panels go back to «choose one». */
    dropType: (id: number) => id === typeId && choose('typeId', null, TYPE_CHILDREN),
    dropSpec: (id: number) => id === specId && choose('specId', null, ['sparam']),
  }
}
