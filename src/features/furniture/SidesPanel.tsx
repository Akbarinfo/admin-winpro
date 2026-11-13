import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { isClientError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { Alert, Panel, Select, Spinner } from '@/shared/ui'
import { furnitureApi, furnitureKeys } from './api'
import type { AccessorySide } from './types'

type Edge = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'

/** Where a side sits on the sash, from its code (LEFT_SIDE, BOTTOM_SIDE…). */
const edgeOf = (side: AccessorySide): Edge | null => {
  const code = String(side.hangleSide ?? '').toUpperCase()
  return (['LEFT', 'RIGHT', 'TOP', 'BOTTOM'] as const).find((e) => code.includes(e)) ?? null
}

/** Each function its own colour, darker as it does more; hinges are drawn on a hinged axis. */
const FN_COLOR: Record<string, string> = {
  STANDARD: 'bg-line-strong',
  PIVOT: 'bg-primary',
  PIVOT_WITH_HINGES: 'bg-primary-strong',
}
const FUNCTIONS = ['STANDARD', 'PIVOT', 'PIVOT_WITH_HINGES']

const EDGE_PLACE: Record<Edge, string> = {
  TOP: 'inset-x-0 top-0 h-2.5',
  BOTTOM: 'inset-x-0 bottom-0 h-2.5',
  LEFT: 'inset-y-3 left-0 w-2.5',
  RIGHT: 'inset-y-3 right-0 w-2.5',
}
const HINGES: Record<Edge, [string, string]> = {
  LEFT: ['-left-[3px] top-[20%] h-[9px] w-4', '-left-[3px] bottom-[20%] h-[9px] w-4'],
  RIGHT: ['-left-[3px] top-[20%] h-[9px] w-4', '-left-[3px] bottom-[20%] h-[9px] w-4'],
  TOP: ['-top-[3px] left-[20%] h-4 w-[9px]', '-top-[3px] right-[20%] h-4 w-[9px]'],
  BOTTOM: ['-top-[3px] left-[20%] h-4 w-[9px]', '-top-[3px] right-[20%] h-4 w-[9px]'],
}

/**
 * An accessory's sides (the old AccessoriesSideLayout and its edit modal): the sash drawn with
 * each side coloured by its function, and a choice per side saved as soon as it changes
 * (PUT /v1/accessories/side with the whole row, as before).
 */
export function SidesPanel({ accessoryId }: { accessoryId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // the side just saved shows «сохранено» until the next change
  const [saved, setSaved] = useState<number | null>(null)

  const sides = useQuery({
    queryKey: [...furnitureKeys.sides, accessoryId],
    queryFn: ({ signal }) => furnitureApi.sides(accessoryId, signal),
  })
  const functions = useQuery({
    queryKey: [...furnitureKeys.enums, 'hanglesidefunc'],
    queryFn: ({ signal }) => furnitureApi.sideFunctions(signal),
    staleTime: 10 * 60_000,
  })
  const options = functions.data?.map((f) => f.name) ?? FUNCTIONS

  const save = useMutation({
    mutationFn: ({ side, fn }: { side: AccessorySide; fn: string }) =>
      furnitureApi.saveSide(side, fn),
    onMutate: () => setSaved(null),
    onSuccess: async (_, { side }) => {
      await queryClient.invalidateQueries({ queryKey: [...furnitureKeys.sides, accessoryId] })
      setSaved(side.id)
    },
    onError: (error) => {
      // 420 and 5xx are shown by the API client
      if (isClientError(error) && error.status !== 420) toast.error(error.message)
    },
  })

  const sideName = (side: AccessorySide) => {
    const code = String(side.hangleSide ?? '')
    return t(`furniture.sides.names.${code}`, { defaultValue: code })
  }
  const fnName = (fn: string | null | undefined) => (fn ? t(`HangleSideFunc.${fn}`) : '')
  const rows = sides.data ?? []

  return (
    <Panel title={t('furniture.sides.title')} className="min-h-0">
      {sides.isPending ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : sides.error ? (
        <div className="p-4">
          <Alert>{t('common.load_error')}</Alert>
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-muted">{t('furniture.sides.empty')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-5 px-4 pt-3.5 pb-2.5">
            <div
              role="img"
              aria-label={`${t('furniture.sides.sash')}: ${rows
                .map((s) => `${sideName(s)} — ${fnName(s.hangleSideFunc)}`)
                .join(', ')}`}
              className="relative h-[140px] w-28 flex-none"
            >
              <div className="absolute inset-3 rounded-[2px] bg-primary-soft" />
              {rows.map((side) => {
                const edge = edgeOf(side)
                if (!edge) return null
                const fn = side.hangleSideFunc ?? 'STANDARD'
                return (
                  <span
                    key={side.id}
                    className={cn(
                      'absolute rounded-[2px]',
                      EDGE_PLACE[edge],
                      FN_COLOR[fn] ?? 'bg-line-strong',
                    )}
                  >
                    {fn === 'PIVOT_WITH_HINGES' &&
                      HINGES[edge].map((place) => (
                        <span key={place} className={cn('absolute rounded-[2px] bg-fg', place)} />
                      ))}
                  </span>
                )
              })}
            </div>

            <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
              {rows.map((side) => {
                const id = `side-${side.id}`
                const fn = side.hangleSideFunc ?? ''
                const busy = save.isPending && save.variables?.side.id === side.id
                return (
                  <div key={side.id} className="flex items-center gap-2.5">
                    <label htmlFor={id} className="w-40 flex-none whitespace-nowrap">
                      <span className="font-medium">{sideName(side)}</span>{' '}
                      <span className="text-xs text-muted">{String(side.hangleSide ?? '')}</span>
                    </label>
                    <Select
                      id={id}
                      value={fn}
                      disabled={busy}
                      onChange={(e) => save.mutate({ side, fn: e.target.value })}
                      className={cn(
                        'h-8 min-w-0 flex-1',
                        fn && fn !== 'STANDARD' && 'border-primary font-medium',
                      )}
                    >
                      {!fn && <option value="" />}
                      {options.map((name) => (
                        <option key={name} value={name}>
                          {fnName(name)}
                        </option>
                      ))}
                    </Select>
                    {busy ? (
                      <Spinner className="size-4 text-primary" />
                    ) : (
                      saved === side.id && (
                        <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-ok">
                          <Check size={14} aria-hidden="true" />
                          {t('furniture.sides.saved')}
                        </span>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pb-3 text-xs text-muted"
          >
            {FUNCTIONS.map((fn) => (
              <span key={fn} className="inline-flex items-center gap-1.5">
                <span className={cn('relative h-1.5 w-4 rounded-[2px]', FN_COLOR[fn])}>
                  {fn === 'PIVOT_WITH_HINGES' && (
                    <span className="absolute -top-[3px] left-[5px] h-3 w-1.5 rounded-[1px] bg-fg" />
                  )}
                </span>
                {fnName(fn)}
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}
