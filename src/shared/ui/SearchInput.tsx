import { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type SearchInputProps = {
  /** Applied search (from the URL via useServerTable). */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Shorter text counts as empty — as in the old panel (2 characters). */
  minLength?: number
  /** Wait this long after the last keystroke before searching. */
  delay?: number
  className?: string
}

/**
 * Table search box. Typing is local; the search is applied after a pause,
 * so the server gets one request instead of one per keystroke.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  minLength = 2,
  delay = 300,
  className,
}: SearchInputProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(value)

  // The applied value changed from outside (Back button, link) — show it.
  const [applied, setApplied] = useState(value)
  if (value !== applied) {
    setApplied(value)
    setText(value)
  }

  const apply = useEffectEvent((next: string) => {
    if (next !== value) onChange(next)
  })

  useEffect(() => {
    const query = text.trim()
    const next = query.length >= minLength ? query : ''
    const timer = setTimeout(() => apply(next), delay)
    return () => clearTimeout(timer)
  }, [text, minLength, delay])

  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
      />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder ?? t('common.search')}
        placeholder={placeholder ?? t('common.search')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={cn(
          'h-9 w-full rounded-md border border-line bg-surface-2 pr-9 pl-9 outline-none transition-[border-color,box-shadow] placeholder:text-faint',
          'focus:border-primary focus:bg-surface focus:shadow-[0_0_0_3px_var(--primary-soft)]',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {text && (
        <button
          type="button"
          aria-label={t('common.clear')}
          onClick={() => setText('')}
          className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-surface hover:text-fg"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
