import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'
import { caretAfter, formatNumberText, numberToText, parseNumber } from './helpers'
import { Input } from './Input'

type NumberInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined
  onChange: (value: number | null) => void
  invalid?: boolean
  /** Shown inside the field on the right: «мм», «сум», «%». */
  unit?: string
  /** Disallow the minus sign. */
  nonNegative?: boolean
  /** Pad to at least this many decimals when the field loses focus: 2 → «1,50». Never cuts digits. */
  minDecimals?: number
}

const ALLOWED = /^-?\d*[.,]?\d*$/

/**
 * Text field that edits a number, formatted while typing: «15 253», «1 250,5».
 * Reports the parsed value, or null while the field is empty. Accepts both «.» and «,» as decimal separator.
 */
export function NumberInput({
  value,
  onChange,
  onBlur,
  invalid,
  unit,
  nonNegative,
  minDecimals = 0,
  className,
  ref,
  ...rest
}: NumberInputProps) {
  const toText = (v: number | null | undefined) => (v == null ? '' : numberToText(v, minDecimals))
  const [text, setText] = useState(() => toText(value))
  // If the value changed from outside (form reset, loaded record), show it instead of the stale text.
  const shown = parseNumber(text) === (value ?? null) ? text : toText(value)

  // Re-grouping moves characters around; put the caret back after the same digit.
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current === document.activeElement) {
      inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current)
    }
    pendingCaret.current = null
  })

  const setRefs = (el: HTMLInputElement | null) => {
    inputRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  return (
    <div className="relative">
      <Input
        {...rest}
        ref={setRefs}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        invalid={invalid}
        value={shown}
        onChange={(e) => {
          const raw = e.target.value
          let plain = raw.replace(/\s/g, '')
          let before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\s/g, '').length

          // Backspace/Delete on a group space would change nothing — remove the neighbouring digit instead.
          if (plain === shown.replace(/\s/g, '') && raw.length < shown.length) {
            const forward = (e.nativeEvent as InputEvent).inputType === 'deleteContentForward'
            const at = forward ? before : before - 1
            if (at < 0 || at >= plain.length) return
            plain = plain.slice(0, at) + plain.slice(at + 1)
            before = at
          }

          if (!ALLOWED.test(plain) || (nonNegative && plain.includes('-'))) return
          const next = formatNumberText(plain)
          pendingCaret.current = caretAfter(next, before)
          setText(next)
          onChange(parseNumber(next))
        }}
        onBlur={(e) => {
          if (value != null) setText(toText(value)) // «1,5» → «1,50», «12,» → «12»
          onBlur?.(e)
        }}
        className={cn(unit && 'pr-11', className)}
      />
      {unit && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">
          {unit}
        </span>
      )}
    </div>
  )
}
