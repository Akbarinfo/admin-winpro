import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useTextures, type TextureOption } from '@/shared/lookups/textures'
import { Button, Combobox, Field, FormField, Input, Modal, Select, Spinner } from '@/shared/ui'
import { ARTICLE_GROUP_TYPES, akfaApi, akfaKeys } from './api'
import { formatPrice, guessTextureName, toastClientError } from './helpers'
import { quickProductSchema, type QuickProductForm, type QuickProductValues } from './schema'
import type { AkfaProduct, ProductDraft } from './types'

const resolver = zodResolver(quickProductSchema)

export type CreatedProduct = { productId: number | null; productName: string; article?: string }

type Props = {
  akfaProduct: AkfaProduct
  onClose: () => void
  onCreated: (product: CreatedProduct) => void
}

/**
 * «+ Продукт WinPro»: a new WinPro product from an Akfa product, linked to it at once (the old
 * AkfaCreateFromAkfaModal). Prefilled from …/product-draft; the texture from the draft, or guessed
 * from the Akfa name's last (…) part.
 */
export function CreateFromAkfaDialog({ akfaProduct, onClose, onCreated }: Props) {
  const { t } = useTranslation()
  const textures = useTextures()
  const draft = useQuery({
    queryKey: [...akfaKeys.all, 'draft', akfaProduct.id],
    queryFn: ({ signal }) => akfaApi.draft(akfaProduct.id, signal),
    staleTime: Infinity,
  })
  const form = useForm<QuickProductForm, unknown, QuickProductValues>({
    resolver,
    defaultValues: { name: '', article: '', articleGroupType: 'PROFILES', textureId: null },
  })

  // Filled once both the draft and the textures are here.
  const [filled, setFilled] = useState(false)
  const ready = draft.isFetched && textures.isFetched
  if (ready && !filled) {
    const d: ProductDraft = draft.data ?? {}
    setFilled(true)
    const guess = guessTextureName(akfaProduct.name).toLowerCase()
    const textureId =
      d.textureId ??
      d.textureIds?.[0] ??
      (guess ? textures.data?.find((x) => x.name.toLowerCase() === guess)?.id : undefined) ??
      null
    form.reset({
      name: d.name ?? '',
      article: d.article ?? '',
      articleGroupType: d.articleGroupType ?? 'PROFILES',
      textureId,
    })
  }

  const [saving, setSaving] = useState(false)
  const submit = form.handleSubmit(async (v) => {
    setSaving(true)
    try {
      // As before: the empty product, the draft over it (its texture guesses left out), the form
      // over that; the length a number or null.
      const { textureId: _a, textureIds: _b, ...rest } = draft.data ?? {}
      const length = rest.length as number | string | null | undefined
      const created = await akfaApi.createProduct(akfaProduct.id, {
        product: {
          unitId: null,
          supplierId: null,
          productSeriesId: null,
          ...rest,
          name: v.name,
          article: v.article,
          articleGroupType: v.articleGroupType,
          length: length === '' || length == null ? null : Number(length),
        },
        textureIds: [v.textureId],
      })
      onCreated({
        productId: created?.productId ?? created?.id ?? null,
        productName: created?.productName ?? created?.name ?? v.name,
        article: v.article,
      })
    } catch (e) {
      toastClientError(e, t('akfa.modal.error_generic'))
    } finally {
      setSaving(false)
    }
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title={t('akfa.createFromAkfa.title')}
      description={`Akfa: ${akfaProduct.externalId ?? `#${akfaProduct.id}`} ${akfaProduct.name}`}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving} disabled={!ready}>
            {t(saving ? 'common.saving' : 'akfa.createFromAkfa.submit')}
          </Button>
        </>
      }
    >
      {!ready ? (
        <div className="grid place-items-center py-8 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label={t('akfa.createFromAkfa.name')}
                htmlFor="quick-name"
                error={errors.name?.message}
                required
              >
                <Input
                  id="quick-name"
                  autoFocus
                  invalid={!!errors.name}
                  {...form.register('name')}
                />
              </Field>
            </div>
            <Field label={t('akfa.createFromAkfa.article')} htmlFor="quick-article">
              <Input id="quick-article" {...form.register('article')} />
            </Field>
            <Field label={t('akfa.createFromAkfa.group')} htmlFor="quick-group">
              <Select id="quick-group" {...form.register('articleGroupType')}>
                {ARTICLE_GROUP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
              </Select>
            </Field>
            <FormField
              control={form.control}
              name="textureId"
              label={t('akfa.createFromAkfa.texture')}
              required
            >
              {(field) => (
                <Combobox<TextureOption>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={textures.data?.find((x) => x.id === field.value) ?? null}
                  onChange={(x) => field.onChange(x?.id ?? null)}
                  options={textures.data ?? []}
                  getKey={(x) => x.id}
                  getLabel={(x) => x.name}
                  placeholder={t('akfa.mapping.texture_placeholder')}
                  invalid={field.invalid}
                />
              )}
            </FormField>
            <Field label={t('akfa.createFromAkfa.price')} htmlFor="quick-price">
              <Input
                id="quick-price"
                readOnly
                disabled
                value={formatPrice(akfaProduct.currentRate, akfaProduct.currentRateCurrency)}
              />
            </Field>
          </div>
          <p className="text-xs text-muted">{t('akfa.createFromAkfa.note')}</p>
        </>
      )}
    </Modal>
  )
}
