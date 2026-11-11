import { useId, useRef } from 'react'
import { useController, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AccessoriesForm } from '../schema'

/** The old form's handle pictures, on the windowcc host (as there). The name is what gets saved. */
const HANDLE_BASE_URL = 'https://oss.windowcc.com/imge/hardware/'
const HANDLES = [
  'Handle',
  'Handle6',
  'Handle11',
  'Handle2',
  'Handle3',
  'Handle5',
  'Handle8',
  'Handle12',
  'Handle9',
  'Handle7',
  'Handle4',
  'Handle10',
  'CommercialHandle',
  'CommercialHandle2',
  'CommercialHandle3',
  'CommercialHandle4',
  'CommercialHandle5',
  'CommercialHandle6',
  'CommercialHandle7',
  'CommercialHandle8',
  'CommercialHandle9',
  'CommercialHandle10',
]

/**
 * Pick one handle by its picture: a row of radio cards that scrolls sideways.
 * One Tab stop (the chosen card, or the first); ← → ↑ ↓ Home End move and choose, as native radios.
 */
export function HandlePicker({ control }: { control: Control<AccessoriesForm> }) {
  const { t } = useTranslation()
  const legendId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const { field } = useController({ control, name: 'handleType' })
  const chosen = HANDLES.indexOf(field.value ?? '')

  const choose = (index: number) => {
    field.onChange(HANDLES[index])
    refs.current[index]?.focus()
    refs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = HANDLES.length - 1
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    choose(next)
  }

  return (
    <fieldset className="grid min-w-0 gap-1.5">
      <legend id={legendId} className="mb-1.5 text-[12.5px] font-medium text-muted">
        {t('product.handle')}
      </legend>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        className="flex gap-2.5 overflow-x-auto pb-2"
      >
        {HANDLES.map((name, i) => {
          const active = i === chosen
          return (
            <button
              key={name}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (chosen === -1 && i === 0) ? 0 : -1}
              onClick={() => field.onChange(name)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'relative grid w-24 shrink-0 justify-items-center gap-1 rounded-md border-2 bg-surface p-2',
                active ? 'border-primary' : 'border-line hover:border-line-strong',
              )}
            >
              <img
                src={`${HANDLE_BASE_URL}${name}.png`}
                alt=""
                loading="lazy"
                className="h-20 w-full object-contain"
              />
              <span className="w-full truncate text-center text-xs text-muted">{name}</span>
              {active && (
                <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-fg">
                  <Check size={11} strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
