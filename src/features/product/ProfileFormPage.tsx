import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useWatch } from 'react-hook-form'
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
import {
  Alert,
  Button,
  Card,
  Combobox,
  Field,
  FormField,
  ImageUpload,
  Input,
  NumberInput,
  Spinner,
  Switch,
} from '@/shared/ui'
import { productApi, productKeys } from './api'
import { groupPath, PROFILE_GROUP } from './groups'
import {
  emptyProfile,
  profileSchema,
  SASH_CLEARANCE_TYPES,
  TRACK_TYPES,
  type ProfileForm,
} from './schema'
import type { ProductDetail } from './types'

const resolver = zodResolver(profileSchema)

const toForm = (p: ProductDetail): ProfileForm => ({
  ...emptyProfile(),
  name: p.name ?? '',
  nameInCatalog: p.nameInCatalog ?? '',
  article: p.article ?? '',
  profileType: p.profileType || null,
  productSeriesId: p.productSeriesId ?? null,
  unitId: p.unitId ?? null,
  supplierId: p.supplierId ?? null,
  length: p.length ?? null,
  width: p.width ?? null,
  thickness: p.thickness ?? null,
  sizeB: p.sizeB ?? null,
  sizeN: p.sizeN ?? null,
  sizeF: p.sizeF ?? null,
  trackCount: p.trackCount ?? null,
  sashClearance: p.sashClearance ?? null,
  comeIn: p.comeIn ?? null,
  articleSpecificWeight: p.articleSpecificWeight ?? null,
  sectionArea: p.sectionArea ?? null,
  momentJx: p.momentJx ?? null,
  momentJy: p.momentJy ?? null,
  // The old form showed (and sent back) 0 for these two when they were empty.
  usefulPiece: p.usefulPiece || 0,
  wastePercent: p.wastePercent || 0,
  isReinforced: !!p.isReinforced,
  needCuttingOptimization: !!p.needCuttingOptimization,
  isArcProfile: !!p.isArcProfile,
  drawingId: p.drawingId ?? null,
})

/** Texts a country can have its own version of (entity type PRODUCT). */
const TRANSLATION_FIELDS: TranslationField[] = [
  { key: 'NAME', label: 'product.name' },
  { key: 'NAME_IN_CATALOG', label: 'product.name_in_catalog' },
]

type NumberName =
  | 'length'
  | 'width'
  | 'thickness'
  | 'sizeB'
  | 'sizeN'
  | 'sizeF'
  | 'trackCount'
  | 'sashClearance'
  | 'comeIn'
  | 'articleSpecificWeight'
  | 'sectionArea'
  | 'momentJx'
  | 'momentJy'
  | 'usefulPiece'
  | 'wastePercent'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-3.5 p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </Card>
  )
}

/** /product/profile/add and …/update/:id — a page: the form is long and has translations below. */
export function ProfileFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const group = PROFILE_GROUP
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

  const [defaultValues] = useState(emptyProfile)

  const { form, entity, isEdit, isLoading, loadError, isSaving, submit } = useEntityForm({
    id,
    queryKey: productKeys.all,
    fetchOne: productApi.get,
    toForm,
    resolver,
    defaultValues,
    onSaved: close,
    // The profile first, then its translations: a new profile has its id only after saving.
    save: async (values, recordId) => {
      // From the lists; while they haven't loaded, the record's own name for an unchanged choice.
      const nameOf = (
        list: { id: number; name: string }[] | undefined,
        key: number | null,
        savedKey: number | null | undefined,
        savedName: string | null | undefined,
      ) => list?.find((x) => x.id === key)?.name ?? (key === savedKey ? savedName : '') ?? ''
      const saved = await productApi.saveProfile(
        values,
        {
          productSeriesName: nameOf(
            series.data,
            values.productSeriesId,
            entity?.productSeriesId,
            entity?.productSeriesName,
          ),
          unitName: nameOf(units.data, values.unitId, entity?.unitId, entity?.unitName),
          supplierName: nameOf(
            suppliers.data,
            values.supplierId,
            entity?.supplierId,
            entity?.supplierName,
          ),
        },
        recordId,
      )
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
        // The profile itself is saved: the list must show it.
        await queryClient.invalidateQueries({ queryKey: productKeys.all })
        // The profile exists now: keep editing it, so saving again doesn't create a second one.
        if (!recordId)
          navigate(`${groupPath(group)}/update/${productId}`, {
            replace: true,
            state: location.state,
          })
        throw error
      }
    },
  })
  const { errors } = form.formState
  const [profileType, name, nameInCatalog] = useWatch({
    control: form.control,
    name: ['profileType', 'name', 'nameInCatalog'],
  })

  const number = (
    fieldName: NumberName,
    label: string,
    opts: { required?: boolean; hint?: string } = {},
  ) => (
    <FormField
      control={form.control}
      name={fieldName}
      label={label}
      required={opts.required}
      hint={opts.hint}
    >
      {(field) => (
        <NumberInput
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={field.value}
          onChange={field.onChange}
          invalid={field.invalid}
        />
      )}
    </FormField>
  )

  const select = <T extends { id: number; name: string }>(
    fieldName: 'productSeriesId' | 'unitId' | 'supplierId',
    label: string,
    query: { data?: T[]; isPending: boolean },
  ) => (
    <FormField control={form.control} name={fieldName} label={label}>
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
      <Input id={fieldName} invalid={!!errors[fieldName]} {...form.register(fieldName)} />
    </Field>
  )

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
          {t(isEdit ? 'product.profile.edit' : group.addLabel)}
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
            <div className="grid gap-3.5 sm:grid-cols-3">
              {text('name', t('product.name'))}
              {text('nameInCatalog', t('product.name_in_catalog'))}
              {text('article', t('product.article'))}
              <FormField control={form.control} name="profileType" label={t('product.type')}>
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
              {select('productSeriesId', t('product.series'), series)}
              {select('unitId', t('product.unit'), units)}
              {select('supplierId', t('product.supplier'), suppliers)}
            </div>
          </Section>

          <Section title={t('product.section_sizes')}>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {number('length', t('product.length'), { required: true })}
              {number('width', t('product.width'), { required: true })}
              {number('thickness', t('product.thickness'), { required: true })}
              {number('sizeB', t('product.size_b'))}
              {number('sizeN', t('product.size_n'))}
              {number('sizeF', t('product.size_f'))}
              {TRACK_TYPES.includes(profileType ?? '') &&
                number('trackCount', t('product.track_count'), {
                  hint: t('product.track_count_hint'),
                })}
              {SASH_CLEARANCE_TYPES.includes(profileType ?? '') &&
                number('sashClearance', t('product.sash_clearance'), {
                  hint: t('product.sash_clearance_hint'),
                })}
              {number('comeIn', t('product.come_in'))}
            </div>
          </Section>

          <Section title={t('product.section_specs')}>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {number('articleSpecificWeight', t('product.specific_weight'))}
              {number('sectionArea', t('product.section_area'))}
              {number('momentJx', t('product.moment_jx'))}
              {number('momentJy', t('product.moment_jy'))}
              {number('usefulPiece', t('product.useful_piece'))}
              {number('wastePercent', t('product.waste_percent'))}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
              <Switch label={t('product.reinforced')} {...form.register('isReinforced')} />
              <Switch
                label={t('product.cutting_optimization')}
                {...form.register('needCuttingOptimization')}
              />
              <Switch label={t('product.arc_profile')} {...form.register('isArcProfile')} />
            </div>
          </Section>

          <Section title={t('product.drawing')}>
            <FormField control={form.control} name="drawing" label={t('product.drawing_file')}>
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

/** …/update/:id — a fresh form per record: going to another profile (e.g. a copy) drops unsaved edits. */
export function ProfileFormByIdPage() {
  const { id } = useParams()
  return <ProfileFormPage key={id} />
}
