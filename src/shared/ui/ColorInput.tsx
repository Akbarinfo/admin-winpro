import type { Ref } from 'react'
import { cn } from '@/shared/lib/cn'
import { Input } from './Input'

type ColorInputProps = {
  id?: string
  /** «#a8743d» */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

/** Colour picker plus the hex code as text, so a colour can be both picked and pasted. */
export function ColorInput({ id, value, onChange, onBlur, invalid, ref }: ColorInputProps) {
  const valid = /^#[0-9a-f]{6}$/i.test(value)
  return (
    <div className="flex gap-2">
      <input
        type="color"
        aria-hidden="true"
        tabIndex={-1}
        value={valid ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-11 shrink-0 cursor-pointer rounded-md border border-line-strong bg-surface p-0.5',
          invalid && 'border-danger',
        )}
      />
      <Input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        onBlur={onBlur}
        placeholder="#a8743d"
        maxLength={7}
        invalid={invalid}
        className="uppercase"
      />
    </div>
  )
}
