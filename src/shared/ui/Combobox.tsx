import { useEffect, useId, useMemo, useRef, useState, type Key, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

type ComboboxProps<T> = {
  id?: string
  name?: string
  options: T[]
  value: T | null
  onChange: (value: T | null) => void
  getKey: (option: T) => Key
  getLabel: (option: T) => string
  onBlur?: () => void
  placeholder?: string
  clearable?: boolean
  loading?: boolean
  disabled?: boolean
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

/** Searchable single select. Typing filters the options; ↑ ↓ Enter Escape work as in a native select. */
export function Combobox<T>({
  id: idProp,
  name,
  options,
  value,
  onChange,
  getKey,
  getLabel,
  onBlur,
  placeholder,
  clearable,
  loading,
  disabled,
  invalid,
  ref,
}: ComboboxProps<T>) {
  const { t } = useTranslation()
  const autoId = useId()
  const id = idProp ?? autoId
  const listId = `${id}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => getLabel(o).toLowerCase().includes(q)) : options
  }, [options, query, getLabel])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const openList = () => {
    if (disabled) return
    const selected = value ? filtered.findIndex((o) => getKey(o) === getKey(value)) : -1
    setActive(Math.max(0, selected))
    setOpen(true)
  }

  const select = (option: T) => {
    onChange(option)
    close()
  }

  // Close on a click outside.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  // Keep the highlighted option visible while moving with the keyboard.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (filtered.length ? (i + step + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (filtered[active]) select(filtered[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation() // don't close a surrounding dialog
      close()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={ref}
        id={id}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={value ? getLabel(value) : (placeholder ?? t('common.select_placeholder'))}
        value={open ? query : value ? getLabel(value) : ''}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          if (!open) setOpen(true)
        }}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          'h-9 w-full min-w-0 cursor-pointer rounded-md border border-line-strong bg-surface pr-16 pl-3 outline-none transition-[border-color,box-shadow] placeholder:text-faint',
          'focus:cursor-text focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]',
          'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint',
          open && value && 'placeholder:text-fg/60',
          invalid &&
            'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-soft)]',
        )}
      />

      <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-0.5 text-faint">
        {loading && <Spinner className="mr-1" />}
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label={t('common.clear')}
            onClick={() => onChange(null)}
            className="pointer-events-auto grid size-7 place-items-center rounded-md hover:bg-surface-2 hover:text-fg"
          >
            <X size={15} />
          </button>
        )}
        <ChevronDown size={16} aria-hidden="true" className="mr-1.5" />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-30 max-h-64 overflow-auto rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-2 text-[13px] text-faint">
              {loading ? t('common.loading') : t('common.nothing_found')}
            </li>
          ) : (
            filtered.map((option, i) => {
              const selected = value !== null && getKey(option) === getKey(value)
              return (
                <li
                  key={getKey(option)}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => select(option)}
                  onPointerMove={() => setActive(i)}
                  className={cn(
                    'flex min-h-[34px] cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5',
                    i === active && 'bg-surface-2',
                    selected && 'font-medium text-primary-strong',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{getLabel(option)}</span>
                  {selected && <Check size={16} aria-hidden="true" className="text-primary" />}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
