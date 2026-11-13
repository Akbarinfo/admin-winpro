import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import type { SpecTab } from './api'

export type SpecLevel = 'main' | 'depend' | 'inner'

const positive = (raw: string | null) => {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * What is chosen on the specification page, in the URL (one update at a time, so two changes
 * from one click can't overwrite each other):
 * - ?tab — main | track (the old SPEC_TABS);
 * - ?mainId — a main/track row: its dependent specification shows;
 * - ?dependId — a dependent row: its inner specification shows;
 * - ?target=level:id — the last row clicked on any level: the side limits and parameters follow it,
 *   as the old page did.
 * Choosing on a level drops what hung on the level below, and the inner tables' pages.
 */
const parseTarget = (raw: string): { level: SpecLevel; id: number } | null => {
  const [level, id] = raw.split(':')
  const n = positive(id)
  return (level === 'main' || level === 'depend' || level === 'inner') && n !== null
    ? { level, id: n }
    : null
}

export function useSpecSelection() {
  const [params, setParams] = useSearchParams()
  const tab: SpecTab = params.get('tab') === 'track' ? 'track' : 'main'
  const mainId = positive(params.get('mainId'))
  const dependId = mainId === null ? null : positive(params.get('dependId'))
  const targetParam = params.get('target') ?? ''
  const target = parseTarget(targetParam)

  const update = useCallback(
    (set: Record<string, string | null>, resetTables: string[]) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const k of [...next.keys()])
            if (resetTables.some((p) => k.startsWith(`${p}.`))) next.delete(k)
          for (const [k, v] of Object.entries(set)) {
            if (v === null) next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const choose = useCallback(
    (level: SpecLevel, id: number) => {
      const targetValue = `${level}:${id}`
      if (level === 'main')
        update({ mainId: String(id), dependId: null, target: targetValue }, [
          'depend',
          'inner',
          'limit',
          'param',
        ])
      else if (level === 'depend')
        update({ dependId: String(id), target: targetValue }, ['inner', 'limit', 'param'])
      else update({ target: targetValue }, ['limit', 'param'])
    },
    [update],
  )

  /** A deleted row: whatever hung on it goes back to «choose one». */
  const drop = useCallback(
    (level: SpecLevel, id: number) => {
      const target = parseTarget(targetParam)
      const set: Record<string, string | null> = {}
      if (level === 'main' && id === mainId) Object.assign(set, { mainId: null, dependId: null })
      if (level === 'depend' && id === dependId) set.dependId = null
      if (target && target.level === level && target.id === id) set.target = null
      // a target hanging on a dropped parent goes too
      if (set.mainId === null && target && target.level !== 'main') set.target = null
      if (set.dependId === null && target?.level === 'inner') set.target = null
      if (Object.keys(set).length) update(set, ['limit', 'param'])
    },
    [update, mainId, dependId, targetParam],
  )

  const setTab = useCallback(
    (next: SpecTab) =>
      update({ tab: next === 'main' ? null : next, mainId: null, dependId: null, target: null }, [
        'main',
        'depend',
        'inner',
        'limit',
        'param',
      ]),
    [update],
  )

  return { tab, mainId, dependId, target, choose, drop, setTab }
}
