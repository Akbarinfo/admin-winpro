import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useAnchoredPosition } from '@/shared/hooks/useAnchoredPosition'
import { cn } from '@/shared/lib/cn'
import { detectPhoneCountry, formatPhone, phoneDigits, type PhoneFormat } from './helpers'

/** A country as the phone field needs it (from /v1/country/list or DEFAULT_COUNTRIES). */
export type PhoneCountryOption = PhoneFormat & {
  code: string
  name: string
  flagUrl?: string | null
}

type PhoneInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  /** The number in its country's format: «+998 (90) 123 45 67». '' when empty. */
  value: string | null | undefined
  onChange: (value: string) => void
  /** Countries to choose from, default first (usePhoneCountries()). */
  countries: PhoneCountryOption[]
  invalid?: boolean
}

function Flag({ country }: { country: PhoneCountryOption }) {
  return country.flagUrl ? (
    <img
      src={country.flagUrl}
      alt=""
      width={24}
      height={18}
      className="h-[18px] w-6 rounded-[3px] object-cover"
    />
  ) : (
    <span className="w-6 text-xs font-semibold text-muted uppercase">{country.code}</span>
  )
}

/**
 * Phone number with a country picker in one field frame:  [🇺🇿 ▾ | +998 (90) 123 45 67].
 * The picker shows the flag; the code is part of the number's mask. Only digits are typed.
 * A saved number shows its own country (detected by the code). Same look as the my-winpro app.
 */
export function PhoneInput({
  value,
  onChange,
  countries,
  invalid,
  id,
  className,
  ...rest
}: PhoneInputProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const listStyle = useAnchoredPosition(rootRef, open, { matchWidth: false })
  const [code, setCode] = useState(() => detectPhoneCountry(value, countries).code)
  const country = countries.find((c) => c.code === code) ?? countries[0]

  // Values this component produced itself. Anything else came from outside (a record was loaded):
  // then the country follows its code. Typed values never switch the country.
  const [own, setOwn] = useState(value)
  if (value !== own) {
    setOwn(value)
    if (value) setCode(detectPhoneCountry(value, countries).code)
  }
  const emit = (next: string) => {
    setOwn(next)
    onChange(next)
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault() // don't close a surrounding dialog
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const choose = (next: PhoneCountryOption) => {
    setOpen(false)
    setCode(next.code)
    // Keep the digits already typed, re-masked for the new country.
    emit(formatPhone(phoneDigits(value, country), next))
    inputRef.current?.focus()
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'flex h-9 w-full min-w-0 items-stretch rounded-md border border-line-strong bg-surface transition-[border-color,box-shadow]',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]',
          invalid &&
            'border-danger focus-within:border-danger focus-within:shadow-[0_0_0_3px_var(--danger-soft)]',
          className,
        )}
      >
        <button
          type="button"
          aria-label={`${t('phone.country')}: ${country.name}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-l-md border-r border-line pr-2 pl-3 hover:bg-surface-2"
        >
          <Flag country={country} />
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={cn('text-faint transition-transform', open && 'rotate-180')}
          />
        </button>
        <input
          {...rest}
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={invalid || undefined}
          placeholder={country.phoneFormat.replace(/#/g, '_')}
          value={value ?? ''}
          onChange={(e) => emit(formatPhone(e.target.value, country))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-faint"
        />
      </div>

      {open && (
        <ul
          role="listbox"
          aria-label={t('phone.country')}
          className="z-50 w-64 overflow-auto rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(19_38_42/.12)]"
          style={listStyle}
        >
          {countries.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === country.code}>
              <button
                type="button"
                onClick={() => choose(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left hover:bg-primary-soft',
                  c.code === country.code && 'text-primary-strong',
                )}
              >
                <Flag country={c} />
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                <span className="text-muted tabular-nums">{c.phoneCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
