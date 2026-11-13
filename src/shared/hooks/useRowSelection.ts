import { useState } from 'react'

/**
 * Rows chosen with checkboxes on the page shown (bulk actions). `view` names what's shown — page,
 * size, filters, search: when it changes the choice is dropped, as the old pages did.
 * Only `selectable` rows can be chosen (e.g. pending requests).
 */
export function useRowSelection<T extends { id: number }>(
  rows: T[],
  view: string,
  selectable: (row: T) => boolean = () => true,
) {
  const [chosenIn, setChosenIn] = useState(view)
  const [chosen, setChosen] = useState<ReadonlySet<number>>(new Set())
  if (chosenIn !== view) {
    setChosenIn(view)
    setChosen(new Set())
  }
  const choosable = rows.filter(selectable)
  const selected = choosable.filter((r) => chosen.has(r.id))
  const allSelected = choosable.length > 0 && selected.length === choosable.length

  return {
    /** The chosen rows of this page, in its order. */
    selected,
    allSelected,
    /** For the header checkbox's «indeterminate». */
    someSelected: selected.length > 0 && !allSelected,
    /** Nothing on the page can be chosen. */
    none: choosable.length === 0,
    isChosen: (id: number) => chosen.has(id),
    toggle: (id: number) =>
      setChosen((prev) => {
        const next = new Set(prev)
        if (!next.delete(id)) next.add(id)
        return next
      }),
    toggleAll: () => setChosen(allSelected ? new Set() : new Set(choosable.map((r) => r.id))),
    clear: () => setChosen(new Set()),
  }
}
