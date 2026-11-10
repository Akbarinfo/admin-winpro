import { useEffect, useId, useMemo, useRef, useState, type Key } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronRight, Minus, X } from 'lucide-react'
import { useAnchoredPosition } from '@/shared/hooks/useAnchoredPosition'
import { cn } from '@/shared/lib/cn'
import {
  ancestorKeys,
  indexTree,
  leafKeys,
  toLeafKeys,
  topCheckedNodes,
  treeCheckStates,
  visibleTreeRows,
} from './helpers'
import { Spinner } from './Spinner'

type TreeSelectProps<T, K extends Key> = {
  id?: string
  /** Root nodes */
  options: T[]
  /** Keys of the chosen leaves (nodes without children). A parent key counts as all its leaves. */
  value: K[]
  onChange: (value: K[]) => void
  getKey: (node: T) => K
  getLabel: (node: T) => string
  getChildren: (node: T) => T[] | null | undefined
  onBlur?: () => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  invalid?: boolean
}

/**
 * Several items from a tree with cascading checkboxes. Checking a parent checks everything under it;
 * a parent is checked only while all of its leaves are, and shows «−» when some are.
 * The value holds leaf keys only — parents are never sent. A fully checked branch is one chip.
 * Typing filters the tree and opens the branches with matches. ↑ ↓ move, → ← open and close
 * a branch, Enter toggles.
 */
export function TreeSelect<T, K extends Key>({
  id: idProp,
  options,
  value,
  onChange,
  getKey,
  getLabel,
  getChildren,
  onBlur,
  placeholder,
  loading,
  disabled,
  invalid,
}: TreeSelectProps<T, K>) {
  const { t } = useTranslation()
  const autoId = useId()
  const id = idProp ?? autoId
  const treeId = `${id}-tree`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const popupStyle = useAnchoredPosition(rootRef, open, { maxHeight: 320 })
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<ReadonlySet<Key>>(new Set())

  const access = useMemo(() => ({ getKey, getLabel, getChildren }), [getKey, getLabel, getChildren])
  const byKey = useMemo(() => indexTree(options, access), [options, access])
  const rows = useMemo(
    () => visibleTreeRows(options, access, expanded, query),
    [options, access, expanded, query],
  )
  // Leaves only: parent ids from old records are spread into their leaves.
  const leaves = useMemo(() => toLeafKeys(byKey, access, value) as K[], [byKey, access, value])
  const states = useMemo(
    () => treeCheckStates(options, access, new Set<Key>(leaves)),
    [options, access, leaves],
  )
  // Chips: top-most fully checked nodes, plus keys the tree doesn't have (yet).
  const chips = useMemo(
    () => [
      ...topCheckedNodes(options, access, states).map((n) => ({
        key: getKey(n),
        label: getLabel(n),
        leaves: leafKeys(n, access),
      })),
      ...leaves
        .filter((k) => !byKey.has(k))
        .map((k) => ({ key: k, label: String(k), leaves: [k as Key] })),
    ],
    [options, access, states, leaves, byKey, getKey, getLabel],
  )

  const show = () => {
    if (open || disabled) return
    // Open the branches holding the chosen nodes, so they're visible.
    setExpanded(ancestorKeys(options, access, leaves))
    setActive(0)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const removeLeaves = (keys: Key[]) => {
    const drop = new Set(keys)
    onChange(leaves.filter((k) => !drop.has(k)))
  }

  /** A checked node unchecks with everything under it; otherwise all its leaves get checked. */
  const toggle = (node: T) => {
    const under = leafKeys(node, access) as K[]
    if (states.get(getKey(node)) === 'all') return removeLeaves(under)
    const have = new Set<Key>(leaves)
    onChange([...leaves, ...under.filter((k) => !have.has(k))])
  }

  const setBranch = (node: T, isOpen: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (isOpen) next.add(getKey(node))
      else next.delete(getKey(node))
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const row = rows[active]
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return show()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (rows.length ? (i + step + rows.length) % rows.length : 0))
    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && open && !query && row) {
      // While searching every branch with a match is open; the arrows move the caret instead.
      e.preventDefault()
      if (e.key === 'ArrowRight' && row.hasChildren && !row.expanded) setBranch(row.node, true)
      if (e.key === 'ArrowLeft' && row.expanded) setBranch(row.node, false)
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (row) toggle(row.node)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === 'Backspace' && !query && chips.length) {
      removeLeaves(chips[chips.length - 1].leaves)
    } else if (e.key === 'Tab') {
      close()
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => {
          if (disabled) return
          inputRef.current?.focus()
          show()
        }}
        className={cn(
          'flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded-md border border-line-strong bg-surface py-1 pr-8 pl-1.5 transition-[border-color,box-shadow]',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]',
          invalid && 'border-danger',
          disabled && 'cursor-not-allowed bg-surface-2 text-faint',
        )}
      >
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex h-6 items-center gap-1 rounded-[6px] bg-primary-soft pr-1 pl-2 text-xs font-medium text-primary-strong"
          >
            {chip.label}
            {!disabled && (
              <button
                type="button"
                aria-label={`${t('common.clear')}: ${chip.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removeLeaves(chip.leaves)
                }}
                className="grid size-4 place-items-center rounded hover:bg-primary hover:text-primary-fg"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={treeId}
          aria-haspopup="tree"
          aria-autocomplete="list"
          aria-activedescendant={open && rows[active] ? `${id}-node-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={chips.length ? '' : (placeholder ?? t('common.select_placeholder'))}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            show()
          }}
          onFocus={show}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="h-6 min-w-16 flex-1 bg-transparent px-1 outline-none placeholder:text-faint"
        />
        <span className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1 text-faint">
          {loading && <Spinner />}
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </div>

      {open && (
        <ul
          id={treeId}
          role="tree"
          aria-multiselectable="true"
          className="z-50 overflow-auto rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
          style={popupStyle}
        >
          {rows.length === 0 ? (
            <li className="px-2.5 py-2 text-[13px] text-faint">
              {loading ? t('common.loading') : t('common.nothing_found')}
            </li>
          ) : (
            rows.map((row, i) => {
              const key = getKey(row.node)
              const state = states.get(key) ?? 'none'
              return (
                <li
                  key={key}
                  id={`${id}-node-${i}`}
                  role="treeitem"
                  aria-level={row.level}
                  aria-expanded={row.hasChildren ? row.expanded : undefined}
                  aria-selected={state === 'all'}
                  aria-checked={state === 'some' ? 'mixed' : state === 'all'}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggle(row.node)}
                  onPointerMove={() => setActive(i)}
                  style={{ paddingLeft: 4 + (row.level - 1) * 20 }}
                  className={cn(
                    'flex min-h-8.5 cursor-pointer items-center gap-1.5 rounded-[6px] py-1.5 pr-2.5',
                    i === active && 'bg-primary-soft',
                  )}
                >
                  {row.hasChildren ? (
                    <span
                      aria-hidden="true"
                      data-testid="tree-branch"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!query) setBranch(row.node, !row.expanded)
                      }}
                      className="grid size-5 shrink-0 place-items-center rounded text-muted hover:bg-line"
                    >
                      <ChevronRight
                        size={14}
                        className={cn('transition-transform', row.expanded && 'rotate-90')}
                      />
                    </span>
                  ) : (
                    <span className="size-5 shrink-0" />
                  )}
                  <span
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded border-[1.5px]',
                      state === 'none'
                        ? 'border-line-strong'
                        : 'border-primary bg-primary text-primary-fg',
                    )}
                  >
                    {state === 'all' && <Check size={12} strokeWidth={3} />}
                    {state === 'some' && <Minus size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{getLabel(row.node)}</span>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
