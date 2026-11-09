import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

type Options = {
  /** Wanted height of the popup; it shrinks to the space available. */
  maxHeight?: number
  /** Same width as the anchor (selects) or the popup's own width (country list). */
  matchWidth?: boolean
  gap?: number
}

/**
 * Position for a dropdown opened from `anchor`, as `position: fixed` styles.
 * Fixed, not absolute: inside a dialog (overflow: auto) an absolute list is clipped and adds a second
 * scrollbar. Opens upwards when there's more room above. Follows scrolling and resizing.
 */
export function useAnchoredPosition(
  anchor: RefObject<HTMLElement | null>,
  open: boolean,
  { maxHeight = 256, matchWidth = true, gap = 4 }: Options = {},
) {
  const [style, setStyle] = useState<CSSProperties>()

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = anchor.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const margin = 8
      const below = window.innerHeight - r.bottom - gap - margin
      const above = r.top - gap - margin
      const up = below < Math.min(maxHeight, 160) && above > below
      setStyle({
        position: 'fixed',
        left: r.left,
        ...(matchWidth && { width: r.width }),
        maxHeight: Math.max(120, Math.min(maxHeight, up ? above : below)),
        ...(up ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchor, open, maxHeight, matchWidth, gap])

  if (!open) return undefined
  // Before the first measurement the list must still be fixed and invisible: rendered in the normal
  // flow it would grow the dialog, the dialog would re-centre, and the anchor would be measured
  // at the shifted place — the list then opened in the wrong spot the first time.
  return style ?? HIDDEN
}

const HIDDEN: CSSProperties = { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }
