import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZES } from '@/shared/api/table'
import { cn } from '@/shared/lib/cn'
import { getPageItems } from './helpers'
import { Select } from './Select'

type PaginationProps = {
  page: number
  size: number
  total: number
  sizes?: number[]
  onChange: (next: { page: number; size: number }) => void
}

export function Pagination({ page, size, total, sizes = PAGE_SIZES, onChange }: PaginationProps) {
  const { t } = useTranslation()
  const pageCount = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, total)
  const go = (p: number) => onChange({ page: p, size })
  const btn =
    'inline-grid h-8 min-w-8 place-items-center rounded-md border px-2 disabled:opacity-40'
  const idle =
    'border-line bg-surface enabled:hover:border-primary enabled:hover:text-primary-strong'
  const current = 'border-primary bg-primary font-medium text-primary-fg'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
      <div className="flex items-center gap-3.5">
        <span className="tabular-nums">{t('pagination.shown', { from, to, total })}</span>
        <label className="flex items-center gap-2">
          {t('pagination.per_page')}
          <Select
            value={size}
            onChange={(e) => onChange({ page: 1, size: Number(e.target.value) })}
            className="h-8 w-auto"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {pageCount > 1 && (
        <nav aria-label={t('pagination.label')} className="flex gap-1">
          <button
            type="button"
            className={cn(btn, idle)}
            disabled={page <= 1}
            onClick={() => go(page - 1)}
            aria-label={t('pagination.prev')}
          >
            <ChevronLeft size={16} />
          </button>
          {getPageItems(page, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="grid min-w-5 place-items-center text-faint">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={t('pagination.page', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => go(item)}
                className={cn(btn, 'tabular-nums', item === page ? current : idle)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(btn, idle)}
            disabled={page >= pageCount}
            onClick={() => go(page + 1)}
            aria-label={t('pagination.next')}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  )
}
