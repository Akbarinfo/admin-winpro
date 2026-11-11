import { useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { ProfileSystemNode } from '@/shared/lookups/profileSystems'
import { visibleRows } from './tree'

type SystemTreeProps = {
  label: string
  nodes: ProfileSystemNode[]
  selectedId: number | null
  onSelect: (id: number) => void
  expanded: ReadonlySet<number>
  onToggle: (id: number, open: boolean) => void
}

/**
 * Profile systems as a tree (the old MUI TreeView): click or Enter chooses a system, the chevron or
 * ← → open and close it, ↑ ↓ Home End move. One Tab stop: the chosen node, or the first.
 */
export function SystemTree({
  label,
  nodes,
  selectedId,
  onSelect,
  expanded,
  onToggle,
}: SystemTreeProps) {
  const rows = visibleRows(nodes, expanded)
  const refs = useRef<(HTMLLIElement | null)[]>([])
  const selectedIndex = rows.findIndex((r) => r.node.id === selectedId)
  // The Tab stop follows the keyboard (roving tabindex); until then it's the chosen node, or the first.
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const focusedIndex = rows.findIndex((r) => r.node.id === focusedId)
  const stop = focusedIndex !== -1 ? focusedIndex : selectedIndex !== -1 ? selectedIndex : 0
  const tabIndexOf = (i: number) => (i === stop ? 0 : -1)

  const focus = (i: number) => refs.current[Math.max(0, Math.min(rows.length - 1, i))]?.focus()

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const row = rows[i]
    const keys: Record<string, () => void> = {
      ArrowDown: () => focus(i + 1),
      ArrowUp: () => focus(i - 1),
      Home: () => focus(0),
      End: () => focus(rows.length - 1),
      Enter: () => onSelect(row.node.id),
      ' ': () => onSelect(row.node.id),
      ArrowRight: () => {
        if (row.hasChildren && !row.open) onToggle(row.node.id, true)
        else if (row.open) focus(i + 1)
      },
      ArrowLeft: () => {
        if (row.open) return onToggle(row.node.id, false)
        // to the parent: the nearest row above with a smaller level
        for (let j = i - 1; j >= 0; j--) if (rows[j].level < row.level) return focus(j)
      },
    }
    const action = keys[e.key]
    if (!action) return
    e.preventDefault()
    action()
  }

  return (
    <ul role="tree" aria-label={label} className="grid gap-0.5">
      {rows.map((row, i) => {
        const selected = row.node.id === selectedId
        return (
          <li
            key={row.node.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="treeitem"
            aria-level={row.level}
            aria-expanded={row.hasChildren ? row.open : undefined}
            aria-selected={selected}
            tabIndex={tabIndexOf(i)}
            onClick={() => onSelect(row.node.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => setFocusedId(row.node.id)}
            style={{ paddingLeft: 4 + (row.level - 1) * 18 }}
            className={cn(
              'flex min-h-8 cursor-pointer items-center gap-1 rounded-md py-1 pr-2 outline-none',
              'focus-visible:shadow-[inset_0_0_0_2px_var(--primary)]',
              row.hasChildren && 'font-semibold',
              selected
                ? 'bg-surface font-semibold text-primary-strong shadow-[inset_3px_0_0_var(--primary),0_1px_2px_var(--line-strong)]'
                : 'hover:bg-primary-soft/60',
            )}
          >
            {row.hasChildren ? (
              <span
                aria-hidden="true"
                data-testid="tree-branch"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(row.node.id, !row.open)
                }}
                className="grid size-6 shrink-0 place-items-center rounded text-muted hover:bg-line"
              >
                <ChevronRight
                  size={15}
                  className={cn('transition-transform', row.open && 'rotate-90')}
                />
              </span>
            ) : (
              <span className="size-6 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">{row.node.name}</span>
            {row.hasChildren && (
              // not part of the node's name for screen readers: aria-expanded already says it's a branch
              <span aria-hidden="true" className="text-xs font-medium text-muted tabular-nums">
                {row.node.children!.length}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
