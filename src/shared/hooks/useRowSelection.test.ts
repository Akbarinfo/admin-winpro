import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRowSelection } from './useRowSelection'

const ROWS = [
  { id: 1, open: true },
  { id: 2, open: false },
  { id: 3, open: true },
]

describe('useRowSelection', () => {
  it('chooses the selectable rows one by one or all at once', () => {
    const { result } = renderHook(() => useRowSelection(ROWS, 'p1', (r) => r.open))
    act(() => result.current.toggle(1))
    expect(result.current.selected.map((r) => r.id)).toEqual([1])
    expect(result.current.someSelected).toBe(true)
    act(() => result.current.toggleAll())
    expect(result.current.selected.map((r) => r.id)).toEqual([1, 3])
    expect(result.current.allSelected).toBe(true)
    act(() => result.current.toggleAll())
    expect(result.current.selected).toEqual([])
  })

  it('drops the choice when the view changes', () => {
    const { result, rerender } = renderHook(({ view }) => useRowSelection(ROWS, view), {
      initialProps: { view: 'p1' },
    })
    act(() => result.current.toggle(2))
    expect(result.current.isChosen(2)).toBe(true)
    rerender({ view: 'p2' })
    expect(result.current.selected).toEqual([])
  })
})
