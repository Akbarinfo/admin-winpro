import { useEffect, useId, useMemo, useRef, useState, type Key } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, X } from 'lucide-react'
import { useAnchoredPosition } from '@/shared/hooks/useAnchoredPosition'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

type MultiSelectProps<T> = {
  id?: string
  options: T[]
  value: T[]
  onChange: (value: T[]) => void
  getKey: (option: T) => Key
  getLabel: (option: T) => string
  onBlur?: () => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  invalid?: boolean
}

/**
 * Several values from a list: chosen ones are chips, typing filters the list,
 * ↑ ↓ move, Enter toggles, Backspace in an empty field removes the last chip.
 */
export function MultiSelect<T>({
  id: idProp,
  options,
  value,
  onChange,
  getKey,
  getLabel,
  onBlur,
  placeholder,
  loading,
  disabled,
  invalid,
}: MultiSelectProps<T>) {
  const { t } = useTranslation()
  const autoId = useId()
  const id = idProp ?? autoId
  const listId = `${id}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  // Fixed position: the list isn't clipped by a dialog's scroll area.
  const listStyle = useAnchoredPosition(rootRef, open)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const selectedKeys = useMemo(() => new Set(value.map(getKey)), [value, getKey])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => getLabel(o).toLowerCase().includes(q)) : options
  }, [options, query, getLabel])

  const toggle = (option: T) => {
    const key = getKey(option)
    onChange(selectedKeys.has(key) ? value.filter((v) => getKey(v) !== key) : [...value, option])
    setQuery('')
  }

  const close = () => {
    setOpen(false)
    setQuery('')
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
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (filtered.length ? (i + step + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (filtered[active]) toggle(filtered[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === 'Backspace' && !query && value.length) {
      onChange(value.slice(0, -1))
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
          setOpen(true)
        }}
        className={cn(
          'flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded-md border border-line-strong bg-surface py-1 pr-8 pl-1.5 transition-[border-color,box-shadow]',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]',
          invalid && 'border-danger',
          disabled && 'cursor-not-allowed bg-surface-2 text-faint',
        )}
      >
        {value.map((v) => (
          <span
            key={getKey(v)}
            className="inline-flex h-6 items-center gap-1 rounded-[6px] bg-primary-soft pr-1 pl-2 text-xs font-medium text-primary-strong"
          >
            {getLabel(v)}
            {!disabled && (
              <button
                type="button"
                aria-label={`${t('common.clear')}: ${getLabel(v)}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(v)
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
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={value.length ? '' : (placeholder ?? t('common.select_placeholder'))}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
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
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="z-50 overflow-auto rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
          style={listStyle}
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-2 text-[13px] text-faint">
              {loading ? t('common.loading') : t('common.nothing_found')}
            </li>
          ) : (
            filtered.map((option, i) => {
              const selected = selectedKeys.has(getKey(option))
              return (
                <li
                  key={getKey(option)}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggle(option)}
                  onPointerMove={() => setActive(i)}
                  className={cn(
                    'flex min-h-[34px] cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5',
                    i === active && 'bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded border-[1.5px] border-line-strong',
                      selected && 'border-primary bg-primary text-primary-fg',
                    )}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{getLabel(option)}</span>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
