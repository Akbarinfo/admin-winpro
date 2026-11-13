import { useRef, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type TabItem<T extends string> = {
  value: T
  label: ReactNode
  /** A number beside the label (rows in the tab); null or undefined — none. */
  count?: number | null
}

type TabsProps<T extends string> = {
  /** Base for the tab and panel ids. */
  id: string
  /** The tab list's accessible name. */
  label: string
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** The chosen tab's content. */
  children: ReactNode
  className?: string
  /** The panel's layout; by default it scrolls itself. A page whose table scrolls inside gives its own. */
  panelClassName?: string
  /** On the right of the tab row (buttons that act on all the tabs), outside the tab list. */
  aside?: ReactNode
}

/**
 * Tabs with their panel (replaces MUI Tabs). One Tab stop: the chosen tab; ← → Home End move
 * and choose at once, as the WAI-ARIA tabs pattern with automatic activation.
 */
export function Tabs<T extends string>({
  id,
  label,
  items,
  value,
  onChange,
  children,
  className,
  panelClassName,
  aside,
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const tabId = (v: T) => `${id}-tab-${v}`

  const go = (i: number) => {
    const next = (i + items.length) % items.length
    onChange(items[next].value)
    refs.current[next]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: items.length - 1,
    }
    if (!(e.key in keys)) return
    e.preventDefault()
    go(keys[e.key])
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* the line under the row is a shadow inside it, so the chosen tab's underline sits on it */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 shadow-[inset_0_-1px_0_var(--line)]">
        <div
          role="tablist"
          aria-label={label}
          // Scrolls sideways when the tabs don't fit, never up and down.
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden px-3"
        >
          {items.map((item, i) => {
            const selected = item.value === value
            return (
              <button
                key={item.value}
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                role="tab"
                id={tabId(item.value)}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(item.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-semibold transition-colors outline-none',
                  'focus-visible:shadow-[inset_0_0_0_2px_var(--primary)]',
                  selected
                    ? 'border-primary text-fg'
                    : 'border-transparent text-muted hover:text-fg',
                )}
              >
                {item.label}
                {/* a space, so the name reads «Спецификация 8» */}
                {item.count != null && ' '}
                {item.count != null && (
                  <span
                    className={cn(
                      'inline-grid h-5 min-w-[22px] place-items-center rounded-full px-1.5 text-xs tabular-nums',
                      selected ? 'bg-primary text-primary-fg' : 'bg-line text-muted',
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {aside && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 py-1.5 pr-1">{aside}</div>
        )}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={tabId(value)}
        className={cn('min-h-0 flex-1', panelClassName ?? 'overflow-y-auto')}
      >
        {children}
      </div>
    </div>
  )
}
