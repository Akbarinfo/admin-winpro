import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useAnchoredPosition } from '@/shared/hooks/useAnchoredPosition'
import { cn } from '@/shared/lib/cn'
import { translationKeyApi, translationKeyKeys } from './keys'
import { TranslationKeyDialog } from './TranslationKeyDialog'

type TranslationKeyInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
  'aria-label'?: string
}

/** As the old field: the search waits for a pause in typing. */
const SEARCH_DELAY = 500

/**
 * A translation key (the old TranslationKeySelect): typed freely, with existing keys suggested
 * as you type. The button beside it shows whether the key exists — and opens its texts, or a
 * form to create them.
 */
export function TranslationKeyInput({
  id: idProp,
  value,
  onChange,
  onBlur,
  invalid,
  ref,
  'aria-label': ariaLabel,
}: TranslationKeyInputProps) {
  const { t } = useTranslation()
  const autoId = useId()
  const id = idProp ?? autoId
  const listId = `${id}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)

  const trimmed = value.trim()
  const [query, setQuery] = useState(trimmed)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(trimmed), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [trimmed])
  const search = useQuery({
    queryKey: translationKeyKeys.search(query),
    queryFn: ({ signal }) => translationKeyApi.search(query, signal),
    enabled: query !== '',
    staleTime: 30_000,
  })
  const results = query === '' ? [] : (search.data ?? [])
  // Known only once the search has caught up with the text.
  const exists = query === trimmed && results.some((r) => r.key === trimmed)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listStyle = useAnchoredPosition(rootRef, open)
  const showList = open && results.length > 0
  const [dialog, setDialog] = useState(false)

  const pick = (key: string) => {
    onChange(key)
    setOpen(false)
  }

  // Close on a click outside.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!showList) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length) % results.length)
    } else if (e.key === 'Enter' && showList) {
      e.preventDefault() // choose, don't submit the form
      if (results[active]) pick(results[active].key)
    } else if (e.key === 'Escape' && showList) {
      e.preventDefault()
      e.stopPropagation() // don't close a surrounding dialog
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const buttonLabel = t(exists ? 'translations.key_view' : 'translations.key_create')

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'flex h-9 items-stretch rounded-md border bg-surface transition-[border-color,box-shadow]',
          invalid
            ? 'border-danger focus-within:shadow-[0_0_0_3px_var(--danger-soft)]'
            : 'border-line-strong focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]',
        )}
      >
        <input
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          placeholder={t('translations.key_placeholder')}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 rounded-l-md bg-transparent pl-3 outline-none placeholder:text-faint"
        />
        <button
          type="button"
          aria-label={buttonLabel}
          title={buttonLabel}
          disabled={trimmed === ''}
          onClick={() => setDialog(true)}
          className={cn(
            'grid w-9 shrink-0 place-items-center rounded-r-md border-l border-line transition-colors',
            // as the old field: green — the key exists, red — it has no texts yet
            trimmed === ''
              ? 'cursor-not-allowed text-faint'
              : exists
                ? 'text-ok hover:bg-ok-soft'
                : 'text-danger hover:bg-danger-soft',
          )}
        >
          <Languages size={16} />
        </button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="z-50 overflow-auto rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
          style={listStyle}
        >
          {results.map((r, i) => {
            const uz = r.translations?.find((x) => x.code === 'uz')?.value
            return (
              <li
                key={r.key}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()} // keep focus in the input
                onClick={() => pick(r.key)}
                onPointerMove={() => setActive(i)}
                className={cn(
                  'grid cursor-pointer rounded-[6px] px-2.5 py-1.5',
                  i === active && 'bg-primary-soft',
                )}
              >
                <span className="truncate font-medium">{r.key}</span>
                {/* the old field showed the Uzbek text under the key */}
                {uz && <span className="truncate text-xs text-muted">{uz}</span>}
              </li>
            )
          })}
        </ul>
      )}

      {dialog && (
        <TranslationKeyDialog
          translationKey={trimmed}
          onClose={() => setDialog(false)}
          onCreated={() => onChange(trimmed)}
        />
      )}
    </div>
  )
}
