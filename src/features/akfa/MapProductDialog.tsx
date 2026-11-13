import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { Button, Modal, Spinner } from '@/shared/ui'
import { akfaApi, akfaKeys } from './api'
import { CreateProductFields } from './CreateProductFields'
import { formatPrice, toastClientError } from './helpers'
import { PositionPicker } from './PositionPicker'
import {
  akfaProductSchema,
  emptyAkfaProduct,
  type AkfaProductForm,
  type AkfaProductValues,
} from './schema'
import type { AkfaPosition, AkfaProduct, ProductDraft, SavedMapping } from './types'

const resolver = zodResolver(akfaProductSchema)

type Mode = 'map' | 'create'

type Props = {
  akfaProduct: AkfaProduct
  onClose: () => void
  /** Something was saved: the lists refresh. */
  onSaved: () => void
  /** «Создать новый продукт» only, no switch (the mapping tab's «create as new»). */
  createOnly?: boolean
}

/**
 * Links an Akfa product to WinPro (the old ModalMoslash): to existing positions (POST …/map), or to a
 * new product made from it (POST …/create-product, prefilled from …/product-draft). After mapping it
 * shows the links' price states, as before.
 */
export function MapProductDialog({ akfaProduct, onClose, onSaved, createOnly }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>(createOnly ? 'create' : 'map')
  const [targets, setTargets] = useState<AkfaPosition[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SavedMapping[] | null>(null)

  // The create form, filled from the draft once it comes (only the form's own fields).
  const draft = useQuery({
    queryKey: [...akfaKeys.all, 'draft', akfaProduct.id],
    queryFn: ({ signal }) => akfaApi.draft(akfaProduct.id, signal),
    enabled: mode === 'create',
    staleTime: Infinity,
  })
  const [defaultValues] = useState(emptyAkfaProduct)
  const form = useForm<AkfaProductForm, unknown, AkfaProductValues>({ resolver, defaultValues })
  const [draftFor, setDraftFor] = useState<ProductDraft | undefined>()
  if (draft.data && draftFor !== draft.data) {
    setDraftFor(draft.data)
    const filled = Object.fromEntries(
      Object.entries(draft.data).filter(
        ([k, v]) => k in defaultValues && v !== null && v !== undefined,
      ),
    )
    form.reset({ ...defaultValues, ...filled }, { keepDirtyValues: true })
  }

  const finish = () => {
    onSaved()
    onClose()
  }

  const submitMap = async () => {
    if (targets.length === 0) return toast.warning(t('akfa.modal.no_targets_selected'))
    setSaving(true)
    try {
      const result = await akfaApi.map(
        akfaProduct.id,
        targets.map(({ productId, textureId }) => ({ productId, textureId })),
      )
      toast.success(t('akfa.modal.map_success'))
      setSaved(result)
    } catch (e) {
      toastClientError(e, t('akfa.modal.error_generic'))
    } finally {
      setSaving(false)
    }
  }

  const submitCreate = form.handleSubmit(async ({ textureIds, ...product }) => {
    setSaving(true)
    try {
      // the whole draft goes with the product, as before (its texture guess too)
      const created = await akfaApi.createProduct(akfaProduct.id, {
        product: { ...draft.data, ...product },
        textureIds,
      })
      toast.success(t('akfa.create.success', { name: created?.name || product.name }))
      finish()
    } catch (e) {
      toastClientError(e, t('akfa.modal.error_generic'))
    } finally {
      setSaving(false)
    }
  })

  const info: [string, string][] = [
    [t('akfa.modal.akfa_name'), akfaProduct.name],
    [t('akfa.modal.akfa_code'), `#${akfaProduct.externalId}`],
    [t('akfa.modal.akfa_group'), akfaProduct.groupName || '—'],
    [t('akfa.modal.akfa_unit'), akfaProduct.unitName || '—'],
    [
      t('akfa.modal.akfa_price'),
      formatPrice(akfaProduct.currentRate, akfaProduct.currentRateCurrency),
    ],
    [t('akfa.modal.akfa_date'), akfaProduct.currentRateDate || '—'],
  ]

  return (
    <Modal
      open
      size="lg"
      // after mapping, closing refreshes the lists
      onClose={() => (saved ? finish() : !saving && onClose())}
      title={t(createOnly ? 'akfa.modal.mode_create' : 'akfa.modal.title')}
      // Enter saves, as the old form did (the position search keeps its Enter to itself)
      onSubmit={(e) => {
        e.preventDefault()
        if (saved || saving) return
        if (mode === 'map') void submitMap()
        else void submitCreate(e)
      }}
      footer={
        saved ? (
          <Button onClick={finish}>{t('common.close')}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {saving
                ? t('common.saving')
                : mode === 'map'
                  ? t('akfa.modal.save', { count: targets.length })
                  : t('akfa.create.submit')}
            </Button>
          </>
        )
      }
    >
      <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-2 p-3.5 text-sm sm:grid-cols-3">
        {info.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted">{label}</dt>
            <dd className="truncate font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {saved ? (
        <SavedMappings mappings={saved} />
      ) : (
        <>
          {!createOnly && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('akfa.modal.title')}>
              {(['map', 'create'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
                    mode === m
                      ? 'border-primary bg-primary text-primary-fg'
                      : 'border-line-strong bg-surface hover:border-primary',
                  )}
                >
                  {t(`akfa.modal.mode_${m}`)}
                </button>
              ))}
            </div>
          )}

          {mode === 'map' ? (
            <PositionPicker akfaProductId={akfaProduct.id} value={targets} onChange={setTargets} />
          ) : draft.isPending ? (
            <div className="grid place-items-center py-8 text-primary">
              <Spinner className="size-6" />
            </div>
          ) : (
            <CreateProductFields form={form} />
          )}
        </>
      )}
    </Modal>
  )
}

/** After mapping: each link's price state (the old SavedMappingsPreview). */
function SavedMappings({ mappings }: { mappings: SavedMapping[] }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="akfa-saved" className="grid gap-2">
      <h3 id="akfa-saved" className="font-semibold">
        {t('akfa.modal.saved_title')}
      </h3>
      <ul className="divide-y divide-line rounded-md border border-line">
        {mappings.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span>
              {m.productName} · {m.textureName}
            </span>
            <span className="tabular-nums">
              {m.pendingPrice != null ? (
                <>
                  {formatPrice(m.pendingBasePrice, m.pendingBaseCurrencySymbol)} →{' '}
                  <strong className="text-primary-strong">
                    {formatPrice(m.pendingPrice, m.pendingCurrencySymbol)}
                  </strong>
                </>
              ) : (
                t(`akfa.priceStatus.${m.priceStatus}`, { defaultValue: m.priceStatus ?? '' })
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
