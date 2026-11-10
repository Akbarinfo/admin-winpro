import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAnchoredPosition } from '@/shared/hooks/useAnchoredPosition'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

export type MenuItem = { key: string; label: string; icon?: ReactNode; onSelect: () => void }

type MenuProps = {
  label: string
  icon?: ReactNode
  items: MenuItem[]
  variant?: 'primary' | 'outline'
  disabled?: boolean
}

/**
 * A button that opens a short list of actions (Excel: «Товары», «Цены», «Переводы»).
 * ↑ ↓ move between items, Enter picks, Escape and a click outside close it.
 */
export function Menu({ label, icon, items, variant = 'outline', disabled }: MenuProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [open, setOpen] = useState(false)
  const style = useAnchoredPosition(rootRef, open, { matchWidth: false, maxHeight: 320 })

  useEffect(() => {
    if (!open) return
    itemRefs.current[0]?.focus()
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      itemRefs.current[(current + step + items.length) % items.length]?.focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      itemRefs.current[e.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={open ? onKeyDown : undefined}>
      <Button
        variant={variant}
        icon={icon}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown size={15} aria-hidden="true" className="-mr-1 text-faint" />
      </Button>
      {open && (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          style={style}
          className="z-50 min-w-44 rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
        >
          {items.map((item, i) => (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                // Back to the button first: a dialog the item opens returns focus there when it closes.
                rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left outline-none',
                'hover:bg-primary-soft focus-visible:bg-primary-soft',
              )}
            >
              {item.icon && <span className="text-muted">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
