import { Fragment, useContext, useLayoutEffect, useRef, type Key, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { UNSAFE_LocationContext } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'
import type { TableSort } from '@/shared/api/table'
import { cn } from '@/shared/lib/cn'
import { scrollMemory } from '@/shared/lib/scrollMemory'
import { Highlight } from './Highlight'
import { nextSort } from './helpers'

export type Column<T> = {
  /** Field name; also the sort column sent to the backend. */
  key: string
  title: ReactNode
  sortable?: boolean
  /**
   * Column name sent to the backend in `order`, when it differs from `key`.
   * Copy it from the old panel's headerTable: some pages sorted by an i18n key («table.exchange.date»).
   */
  sortKey?: string
  align?: 'left' | 'right'
  className?: string
  /** Custom cell. Without it the raw field value is shown. */
  /** `index` — position on the current page, from 0. */
  render?: (row: T, index: number) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => Key
  /** First load: shows skeleton rows. */
  loading?: boolean
  /** A newer page is loading: current rows are dimmed. */
  fetching?: boolean
  sort?: TableSort
  onSortChange?: (sort: TableSort) => void
  /** Buttons in the last column (edit, delete…). */
  actions?: (row: T) => ReactNode
  /** Highlights a row, e.g. the one opened in a side panel. */
  selectedKey?: Key | null
  onRowClick?: (row: T) => void
  empty?: ReactNode
  /** Loading failed: shown instead of `empty`, with a retry link when `onRetry` is given. */
  error?: unknown
  onRetry?: () => void
  /** Current search: matches are marked in plain cells. Custom cells use <Highlight>. */
  highlight?: string
  skeletonRows?: number
  /** Rows that open a panel right under them; a column with a ▸ toggle is added in front. */
  expandable?: {
    isExpanded: (row: T) => boolean
    onToggle: (row: T) => void
    /** Content of the opened panel. */
    render: (row: T) => ReactNode
    /** Accessible name of the toggle: «Показать соответствия: Белый». */
    label: (row: T, expanded: boolean) => string
  }
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading,
  fetching,
  sort,
  onSortChange,
  actions,
  selectedKey,
  onRowClick,
  empty,
  error,
  onRetry,
  highlight,
  skeletonRows = 5,
  expandable,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const colCount = columns.length + (actions ? 1 : 0) + (expandable ? 1 : 0)

  // Back on the same page and query: the list opens where it was left. (The context is read
  // directly so the table works outside a router too, e.g. in unit tests.)
  const location = useContext(UNSAFE_LocationContext)?.location
  const scrollKey = location ? location.pathname + location.search : null
  const scroller = useRef<HTMLDivElement>(null)
  const restoredFor = useRef<string | null>(null)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !scrollKey || loading || rows.length === 0 || restoredFor.current === scrollKey)
      return
    restoredFor.current = scrollKey
    el.scrollTop = scrollMemory.get(scrollKey)
  }, [scrollKey, loading, rows.length])
  const cell = (align?: 'left' | 'right') =>
    cn('px-3.5 py-2.5 whitespace-nowrap', align === 'right' && 'text-right')

  return (
    // Scrolls inside itself; in a flex column (list pages) it takes the remaining height and the header stays put.
    <div
      ref={scroller}
      onScroll={(e) => scrollKey && scrollMemory.set(scrollKey, e.currentTarget.scrollTop)}
      className="min-h-0 flex-1 overflow-auto"
    >
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {expandable && (
              <th
                scope="col"
                className="sticky top-0 z-10 w-11 bg-surface-2 shadow-[inset_0_-1px_0_var(--line)]"
              >
                <span className="sr-only">{t('common.expand')}</span>
              </th>
            )}
            {columns.map((col) => {
              const sortKey = col.sortKey ?? col.key
              const active = sort?.column === sortKey
              const SortIcon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'sticky top-0 z-10 bg-surface-2 px-3.5 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted shadow-[inset_0_-1px_0_var(--line)]',
                    col.align === 'right' && 'text-right',
                    col.className,
                  )}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(nextSort(sortKey, sort))}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-fg',
                        active && 'text-fg',
                      )}
                    >
                      {col.title}
                      <SortIcon
                        size={13}
                        aria-hidden="true"
                        className={cn(!active && 'text-faint')}
                      />
                    </button>
                  ) : (
                    col.title
                  )}
                </th>
              )
            })}
            {actions && (
              <th
                scope="col"
                className="sticky top-0 z-10 bg-surface-2 px-3.5 py-2.5 shadow-[inset_0_-1px_0_var(--line)]"
              >
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody
          aria-busy={loading || fetching || undefined}
          className={cn('transition-opacity', fetching && !loading && 'opacity-60')}
        >
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                {Array.from({ length: colCount }, (_, j) => (
                  <td key={j} className="px-3.5 py-3.5">
                    <div className="h-3 animate-pulse rounded-full bg-line" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-3.5 py-12 text-center text-muted">
                {error ? (
                  <>
                    {t('common.load_error')}{' '}
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="font-medium text-primary-strong hover:underline"
                      >
                        {t('common.retry')}
                      </button>
                    )}
                  </>
                ) : (
                  (empty ?? t('common.no_data'))
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = getRowKey(row)
              const expanded = expandable?.isExpanded(row) ?? false
              const selected = (selectedKey !== undefined && selectedKey === key) || expanded
              return (
                <Fragment key={key}>
                  <tr
                    aria-selected={selected || undefined}
                    onClick={onRowClick && (() => onRowClick(row))}
                    className={cn(
                      'border-b border-line transition-colors last:border-0',
                      onRowClick && 'cursor-pointer',
                      // hover is a lighter tint of the selected row's colour
                      selected
                        ? 'bg-primary-soft shadow-[inset_3px_0_0_var(--primary)]'
                        : 'hover:bg-primary-soft/60',
                    )}
                  >
                    {expandable && (
                      <td className="w-11 py-2 pl-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={expandable.label(row, expanded)}
                          title={expandable.label(row, expanded)}
                          onClick={() => expandable.onToggle(row)}
                          className="grid size-7 place-items-center rounded-md text-muted hover:bg-line hover:text-fg"
                        >
                          <ChevronRight
                            size={16}
                            aria-hidden="true"
                            className={cn('transition-transform', expanded && 'rotate-90')}
                          />
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn(cell(col.align), col.className)}>
                        {col.render ? (
                          col.render(row, index)
                        ) : (
                          <Highlight
                            text={String((row as Record<string, unknown>)[col.key] ?? '')}
                            query={highlight}
                          />
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className={cell('right')} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-0.5">{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                  {expanded && expandable && (
                    <tr className="border-b border-line">
                      <td
                        colSpan={colCount}
                        className="bg-surface-2 py-3 pr-3.5 pl-12 shadow-[inset_3px_0_0_var(--primary)]"
                      >
                        {expandable.render(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
