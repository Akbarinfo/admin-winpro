import { keepPreviousData, useQuery, useQueries } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useSeriesList } from '@/shared/lookups/series'
import { cn } from '@/shared/lib/cn'
import { Input, Select, Spinner } from '@/shared/ui'
import { ARTICLE_GROUP_TYPES, akfaApi, akfaKeys } from './api'
import { formatPrice } from './helpers'
import type { AkfaPosition } from './types'

const keyOf = (p: { productId: number; textureId: number }) => `${p.productId}-${p.textureId}`

type Props = {
  /** The Akfa product being mapped: positions linked to it stay choosable. */
  akfaProductId: number
  value: AkfaPosition[]
  onChange: (value: AkfaPosition[]) => void
}

/**
 * WinPro positions (product + texture) to link to the Akfa product (the old AkfaPositionPicker):
 * searched by name or article, group type and series. The search shows priced positions only;
 * «Все текстуры» adds a product's other textures.
 */
export function PositionPicker({ akfaProductId, value, onChange }: Props) {
  const { t } = useTranslation()
  const id = useId()
  const series = useSeriesList()
  const [text, setText] = useState('')
  const [groupType, setGroupType] = useState('')
  const [seriesId, setSeriesId] = useState<number | null>(null)

  // as before: the search waits for a pause in typing
  const [q, setQ] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 400)
    return () => clearTimeout(timer)
  }, [text])
  const asked = q !== '' || groupType !== '' || seriesId !== null
  const search = useQuery({
    queryKey: [...akfaKeys.all, 'positions', q, groupType, seriesId],
    queryFn: ({ signal }) =>
      akfaApi.positions({ q, articleGroupType: groupType, productSeriesId: seriesId }, signal),
    enabled: asked,
    placeholderData: keepPreviousData,
  })
  const results = asked ? (search.data ?? []) : []

  // «Все текстуры» per product
  const [opened, setOpened] = useState<number[]>([])
  const textures = useQueries({
    queries: opened.map((productId) => ({
      queryKey: [...akfaKeys.all, 'product-textures', productId],
      queryFn: ({ signal }: { signal: AbortSignal }) => akfaApi.productTextures(productId, signal),
      staleTime: 60_000,
    })),
  })

  // Grouped by product, the textures without a price added after the priced ones.
  const groups: {
    productId: number
    productName: string
    article?: string | null
    rows: AkfaPosition[]
  }[] = []
  for (const pos of results) {
    let group = groups.find((g) => g.productId === pos.productId)
    if (!group) {
      group = {
        productId: pos.productId,
        productName: pos.productName,
        article: pos.article,
        rows: [],
      }
      groups.push(group)
    }
    group.rows.push(pos)
  }
  for (const group of groups) {
    const i = opened.indexOf(group.productId)
    const extra = i === -1 ? [] : (textures[i]?.data ?? [])
    const known = new Set(group.rows.map((r) => r.textureId))
    for (const tx of extra)
      if (!known.has(tx.id))
        group.rows.push({
          productId: group.productId,
          productName: group.productName,
          article: group.article,
          textureId: tx.id,
          textureName: tx.name,
          price: null,
          withoutPrice: true,
        })
  }

  const chosen = new Set(value.map(keyOf))
  const lockedByOther = (p: AkfaPosition) =>
    !!p.mappedToAkfaProductId && p.mappedToAkfaProductId !== akfaProductId
  const toggle = (p: AkfaPosition) => {
    if (lockedByOther(p)) return
    onChange(chosen.has(keyOf(p)) ? value.filter((x) => keyOf(x) !== keyOf(p)) : [...value, p])
  }

  return (
    <section aria-labelledby={`${id}-title`} className="grid gap-2.5">
      <h3 id={`${id}-title`} className="font-semibold">
        {t('akfa.modal.targets_label')}
      </h3>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('akfa.modal.targets_label')}>
          {value.map((p) => (
            <li
              key={keyOf(p)}
              className="inline-flex items-center gap-1 rounded-md bg-primary-soft py-0.5 pr-1 pl-2 text-xs font-medium text-primary-strong"
            >
              {p.productName} · {p.textureName}
              <button
                type="button"
                aria-label={t('akfa.remove_target', {
                  name: `${p.productName} · ${p.textureName}`,
                })}
                onClick={() => toggle(p)}
                className="grid size-5 place-items-center rounded hover:bg-surface"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t('akfa.modal.no_targets_yet')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          type="search"
          aria-label={t('akfa.modal.search_product')}
          placeholder={t('akfa.modal.search_product')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          // it searches as you type: Enter mustn't save the dialog around it
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className="min-w-[200px] flex-1"
        />
        <Select
          aria-label={t('akfa.create.article_group_type')}
          className="w-40"
          value={groupType}
          onChange={(e) => setGroupType(e.target.value)}
        >
          <option value="">{t('akfa.modal.all_group_types')}</option>
          {ARTICLE_GROUP_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('akfa.series')}
          className="w-40"
          value={seriesId ?? ''}
          onChange={(e) => setSeriesId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{t('akfa.modal.all_series')}</option>
          {(series.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-line">
        {asked && search.isPending ? (
          <div className="grid place-items-center py-6 text-primary">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <p className="p-3 text-sm text-muted">
            {t(asked ? 'akfa.modal.no_positions_found' : 'akfa.modal.search_hint')}
          </p>
        ) : (
          groups.map((group) => {
            const i = opened.indexOf(group.productId)
            const more = i === -1 ? undefined : textures[i]
            return (
              <div
                key={group.productId}
                role="group"
                aria-labelledby={`${id}-p${group.productId}`}
                className="border-b border-line last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3 bg-surface-2 px-3 py-1.5 text-sm">
                  <span>
                    <span id={`${id}-p${group.productId}`} className="font-medium">
                      {group.productName}
                    </span>
                    {group.article && <span className="text-faint"> ({group.article})</span>}
                  </span>
                  {!more?.data?.length && (
                    <button
                      type="button"
                      disabled={more?.isPending}
                      aria-label={t('akfa.all_textures_of', { name: group.productName })}
                      onClick={() =>
                        setOpened((prev) =>
                          prev.includes(group.productId) ? prev : [...prev, group.productId],
                        )
                      }
                      className="text-xs font-medium text-primary-strong hover:underline disabled:opacity-50"
                    >
                      {more?.isPending
                        ? t('akfa.common.loading')
                        : t('akfa.modal.show_all_textures')}
                    </button>
                  )}
                </div>
                {group.rows.map((pos) => {
                  const locked = lockedByOther(pos)
                  return (
                    <div
                      key={keyOf(pos)}
                      className={cn(
                        'flex items-center justify-between gap-3 border-t border-line/60 py-2 pr-3 pl-6 text-sm',
                        locked ? 'text-faint' : 'hover:bg-primary-soft/60',
                      )}
                    >
                      {/* the name only: the price beside it isn't part of the checkbox's name */}
                      <label
                        className={cn(
                          'flex flex-1 items-center gap-2',
                          locked ? 'cursor-not-allowed' : 'cursor-pointer',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          disabled={locked}
                          checked={chosen.has(keyOf(pos))}
                          onChange={() => toggle(pos)}
                        />
                        {pos.textureName}
                      </label>
                      <span className="text-right text-xs tabular-nums">
                        {locked ? (
                          t('akfa.modal.linked_to', { name: pos.mappedToAkfaName })
                        ) : pos.withoutPrice ? (
                          <span className="text-warn">{t('akfa.modal.no_price_yet')}</span>
                        ) : (
                          formatPrice(pos.price, pos.currencySymbol)
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
      <p className="text-xs text-faint">{t('akfa.modal.search_limit_hint')}</p>
    </section>
  )
}
