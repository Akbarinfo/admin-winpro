import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { todayIso } from '@/shared/lib/format'
import { useCountries } from '@/shared/lookups/countries'
import { currencyLabel, useCurrencies, type Currency } from '@/shared/lookups/currencies'
import { useTextures, type TextureOption } from '@/shared/lookups/textures'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  Input,
  Modal,
  NumberInput,
  Spinner,
  TextureMark,
} from '@/shared/ui'
import { priceApi, priceKeys, productKeys } from './api'
import { priceSchema, type PriceForm } from './priceSchema'
import type { PriceDetail, ProductPrice } from './types'

const resolver = zodResolver(priceSchema)

const toForm = (p: PriceDetail): PriceForm => ({
  date: p.date ? p.date.slice(0, 10) : todayIso(),
  textureId: p.textureId ?? null,
  price: p.price ?? null,
  priceOfOne: p.priceOfOne ?? null,
  currencyId: p.currencyId ?? null,
  countryId: p.countryId ?? null,
})

/** A texture in the list: its picture or colour, then the name. */
function TextureLabel({ texture }: { texture: TextureOption }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <TextureMark src={fileUrl('texture', texture.imageId)} color={texture.color} />
      <span className="truncate">{texture.name}</span>
    </span>
  )
}

type PriceFormDialogProps = {
  productId: number
  /** The price being edited; undefined — a new one. */
  price?: ProductPrice
  /** A new price starts in the country the panel is filtered by. */
  countryId: number | null
  onClose: () => void
}

/** Add or edit one price of a product (the old ModalPrice and the inline row editor in one). */
export function PriceFormDialog({ productId, price, countryId, onClose }: PriceFormDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const textures = useTextures()
  const currencies = useCurrencies()
  const countries = useCountries()

  const [defaultValues] = useState<PriceForm>(() => ({
    date: todayIso(),
    textureId: null,
    price: null,
    priceOfOne: null,
    currencyId: null,
    countryId,
  }))

  const { form, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id: price ? String(price.id) : undefined,
    queryKey: priceKeys.all,
    fetchOne: priceApi.get,
    toForm,
    save: (values, id) => priceApi.save(values, productId, id),
    resolver,
    defaultValues,
    onSaved: () => {
      // A new price can clear the product's «price warning» mark in the list.
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      onClose()
    },
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'product.price.edit' : 'product.price.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading || !!loadError}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {/* Akfa sync overwrites prices it owns: say so before the user edits one. */}
          {price?.akfaExternalName && (
            <Alert tone="warn">
              {t('product.price.akfa_warning', { name: price.akfaExternalName })}
            </Alert>
          )}
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="textureId"
              label={t('product.price.texture')}
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
                  renderOption={(x) => <TextureLabel texture={x} />}
                  renderValueMark={(x) => (
                    <TextureMark src={fileUrl('texture', x.imageId)} color={x.color} />
                  )}
                  loading={textures.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>
            <Field
              label={t('product.price.date')}
              htmlFor="price-date"
              error={errors.date?.message}
              required
            >
              <Input
                id="price-date"
                type="date"
                invalid={!!errors.date}
                {...form.register('date')}
              />
            </Field>
            <FormField
              control={form.control}
              name="price"
              label={t('product.price.price')}
              required
            >
              {(field) => (
                <NumberInput
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                  nonNegative
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="priceOfOne"
              label={t('product.price.price_of_one')}
              required
            >
              {(field) => (
                <NumberInput
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                  nonNegative
                />
              )}
            </FormField>
            <FormField
              control={form.control}
              name="currencyId"
              label={t('product.price.currency')}
              required
            >
              {(field) => (
                <Combobox<Currency>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={currencies.data?.find((c) => c.id === field.value) ?? null}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={currencies.data ?? []}
                  getKey={(c) => c.id}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>
            <FormField control={form.control} name="countryId" label={t('product.price.country')}>
              {(field) => (
                <Combobox
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={countries.data?.find((c) => c.id === field.value) ?? null}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={countries.data ?? []}
                  getKey={(c) => c.id}
                  getLabel={(c) => c.name}
                  loading={countries.isPending}
                  clearable
                />
              )}
            </FormField>
          </div>
        </>
      )}
    </Modal>
  )
}
