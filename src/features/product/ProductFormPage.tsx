import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api/errors'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useSeriesList } from '@/shared/lookups/series'
import { useSuppliers } from '@/shared/lookups/suppliers'
import { useUnits } from '@/shared/lookups/units'
import {
  CountryTranslations,
  useCountryTranslations,
  type TranslationField,
} from '@/shared/translations'
import { Alert, Button, Combobox, Field, FormField, ImageUpload, Input, Spinner } from '@/shared/ui'
import { productApi, productKeys } from './api'
import { FieldGrid, Section } from './forms/fields'
import type { AnyProductFormSpec } from './forms/types'
import { groupPath, type ProductGroup } from './groups'
import type { BaseProductForm, BaseProductValues } from './schema'

/** Texts a country can have its own version of (entity type PRODUCT). */
const TRANSLATION_FIELDS: TranslationField[] = [
  { key: 'NAME', label: 'product.name' },
  { key: 'NAME_IN_CATALOG', label: 'product.name_in_catalog' },
]

/** The common fields as the shell sees them; with `withSeries` the form also has productSeriesId. */
type ShellForm = BaseProductForm & { productSeriesId?: number | null }

type Props = { group: ProductGroup; spec: AnyProductFormSpec }

/**
 * /product/<group>/add and …/update/:id — one page for every product group.
 * The shell has what all groups share; `spec` (forms/<group>.tsx) adds the group's own fields and body.
 * A fresh form per record: going to another product (e.g. a copy) drops unsaved edits.
 */
export function ProductFormPage(props: Props) {
  const { id } = useParams()
  return <ProductForm key={id ?? 'new'} {...props} />
}

function ProductForm({ group, spec }: Props) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  // Back to the list exactly as it was left: page, filters, sort.
  const from = (location.state as { from?: string } | null)?.from
  const backTo = from ?? groupPath(group)
  const close = () => navigate(backTo)

  const series = useSeriesList()
  const units = useUnits()
  const suppliers = useSuppliers()
  const types = useQuery({
    queryKey: productKeys.articleTypes(group.groupType),
    queryFn: ({ signal }) => productApi.articleTypes(group.groupType, signal),
    staleTime: 10 * 60_000,
  })

  const translationFields = TRANSLATION_FIELDS.map((f) => ({ ...f, label: t(f.label) }))
  const translations = useCountryTranslations(
    'PRODUCT',
    id === undefined ? undefined : Number(id),
    TRANSLATION_FIELDS,
  )

  const [defaultValues] = useState(spec.empty)

  const { form, entity, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id,
    queryKey: productKeys.all,
    fetchOne: productApi.get,
    toForm: spec.toForm,
    resolver: spec.resolver,
    defaultValues,
    onSaved: close,
    // The product first, then its translations: a new product has its id only after saving.
    save: async (values, recordId) => {
      // From the lists; while they haven't loaded, the record's own name for an unchanged choice.
      const nameOf = (
        list: { id: number; name: string }[] | undefined,
        key: number | null | undefined,
        savedKey: number | null | undefined,
        savedName: string | null | undefined,
      ) => list?.find((x) => x.id === key)?.name ?? (key === savedKey ? savedName : '') ?? ''
      // Every spec's values extend the common ones (see ProductFormSpec).
      const v = values as BaseProductValues & { productSeriesId?: number | null }
      const data = spec.toBody(values, {
        id: recordId,
        names: {
          productSeriesName: nameOf(
            series.data,
            v.productSeriesId,
            entity?.productSeriesId,
            entity?.productSeriesName,
          ),
          unitName: nameOf(units.data, v.unitId, entity?.unitId, entity?.unitName),
          supplierName: nameOf(
            suppliers.data,
            v.supplierId,
            entity?.supplierId,
            entity?.supplierName,
          ),
        },
      })
      const saved = await productApi.saveProduct(spec.saveUrl, data, v.drawing, recordId)
      if (saved.status === 206) {
        // Not saved: the backend explains why (e.g. the article is taken). Stay on the form.
        const message = saved.data?.error ?? t('errors.unknown')
        toast.warning(message)
        throw new ApiError(206, message)
      }
      const productId = recordId ? Number(recordId) : saved.data?.id
      if (productId === undefined) return
      try {
        await translations.save(productId)
      } catch (error) {
        toast.error(t('translations.save_error'))
        // The product itself is saved: the list must show it.
        await queryClient.invalidateQueries({ queryKey: productKeys.all })
        // It exists now: keep editing it, so saving again doesn't create a second one.
        if (!recordId)
          navigate(`${groupPath(group)}/update/${productId}`, {
            replace: true,
            state: location.state,
          })
        throw error
      }
    },
  })
  // The shell only touches the common fields; the group's Fields get the form with its own types.
  const shell = form as unknown as UseFormReturn<ShellForm>
  const { errors } = shell.formState
  const [name, nameInCatalog] = useWatch({
    control: shell.control,
    name: ['name', 'nameInCatalog'],
  })

  const select = <T extends { id: number; name: string }>(
    fieldName: 'productSeriesId' | 'unitId' | 'supplierId',
    label: string,
    query: { data?: T[]; isPending: boolean },
  ) => (
    <FormField control={shell.control} name={fieldName} label={label}>
      {(field) => (
        <Combobox<T>
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={query.data?.find((x) => x.id === field.value) ?? null}
          onChange={(x) => field.onChange(x?.id ?? null)}
          options={query.data ?? []}
          getKey={(x) => x.id}
          getLabel={(x) => x.name}
          loading={query.isPending}
          clearable
        />
      )}
    </FormField>
  )

  const text = (fieldName: 'name' | 'nameInCatalog' | 'article', label: string) => (
    <Field label={label} htmlFor={fieldName} error={errors[fieldName]?.message} required>
      <Input id={fieldName} invalid={!!errors[fieldName]} {...shell.register(fieldName)} />
    </Field>
  )

  const { Fields } = spec

  return (
    <div className="mx-auto grid max-w-[1040px] gap-4">
      {/* Stays at the top while the long form scrolls under it (-top-4 / -mt-4: over <main>'s padding). */}
      <div className="sticky -top-4 z-10 -mt-4 -mb-2 grid gap-1 bg-bg pt-4 pb-2">
        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg"
        >
          <ArrowLeft size={16} />
          {t(group.title)}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(isEdit ? spec.editTitle : group.addLabel)}
        </h1>
      </div>

      {/* The record couldn't be loaded: say so instead of showing an empty form that would overwrite it. */}
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-16 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-4">
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <Section title={t('product.section_main')}>
            <FieldGrid>
              {text('name', t('product.name'))}
              {text('nameInCatalog', t('product.name_in_catalog'))}
              {text('article', t('product.article'))}
              <FormField control={shell.control} name="profileType" label={t('product.type')}>
                {(field) => (
                  <Combobox
                    id={field.id}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={types.data?.find((x) => x.name === field.value) ?? null}
                    onChange={(x) => field.onChange(x?.name ?? null)}
                    options={types.data ?? []}
                    getKey={(x) => x.name}
                    getLabel={(x) => t(x.name)}
                    loading={types.isPending}
                    clearable
                  />
                )}
              </FormField>
              {spec.withSeries && select('productSeriesId', t('product.series'), series)}
              {select('unitId', t('product.unit'), units)}
              {select('supplierId', t('product.supplier'), suppliers)}
            </FieldGrid>
          </Section>

          <Fields form={form} />

          <Section title={t('product.drawing')}>
            <FormField control={shell.control} name="drawing" label={t('product.drawing_file')}>
              {(field) => (
                <ImageUpload
                  id={field.id}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  currentUrl={fileUrl('product', entity?.drawingId)}
                  crop={false}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </Section>

          <Section title={t('translations.title')}>
            <CountryTranslations
              state={translations}
              fields={translationFields}
              defaults={{ NAME: name, NAME_IN_CATALOG: nameInCatalog }}
            />
          </Section>

          <div className="sticky -bottom-4 z-10 -mb-4 flex justify-end gap-2 border-t border-line bg-bg py-3">
            <Button variant="outline" onClick={close} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSaving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
