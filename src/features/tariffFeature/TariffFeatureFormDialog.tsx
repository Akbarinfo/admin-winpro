import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  Input,
  Modal,
  NumberInput,
  Select,
  Spinner,
} from '@/shared/ui'
import { tariffFeatureApi, tariffFeatureKeys } from './api'
import { tariffFeatureSchema, type TariffFeatureForm } from './schema'
import { FEATURE_TYPES, type TariffFeature } from './types'

const resolver = zodResolver(tariffFeatureSchema)

const toForm = (f: TariffFeature): TariffFeatureForm => ({
  tariff: f.tariff ?? '',
  featureType: f.featureType ?? '',
  featureKey: f.featureKey ?? '',
  featureLabel: f.featureLabel ?? '',
  value: f.value ?? '',
  unit: f.unit ?? '',
  sortOrder: f.sortOrder ?? 0,
})

const asIs = (v: string) => v

/** Mounted on /tariff-feature/add and /tariff-feature/update/:id, over the list. */
export function TariffFeatureFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const close = () => navigate('/tariff-feature')

  const tariffs = useQuery({
    queryKey: [...tariffFeatureKeys.all, 'tariffs'],
    queryFn: ({ signal }) => tariffFeatureApi.tariffs(signal),
    staleTime: 10 * 60_000,
  })

  const [defaultValues] = useState<TariffFeatureForm>(() => ({
    tariff: '',
    featureType: '',
    featureKey: '',
    featureLabel: '',
    value: '',
    unit: '',
    sortOrder: 0,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: tariffFeatureKeys.all,
    fetchOne: tariffFeatureApi.get,
    toForm,
    save: tariffFeatureApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'tariffFeature.edit' : 'tariffFeature.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSaving} disabled={isLoading}>
            {t(isSaving ? 'common.saving' : 'common.save')}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-10 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          {errors.root && <Alert>{errors.root.message}</Alert>}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tariff"
              label={t('tariffFeature.tariff')}
              required
            >
              {(field) => (
                <Combobox<string>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  options={tariffs.data ?? []}
                  getKey={asIs}
                  getLabel={asIs}
                  loading={tariffs.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <Field
              label={t('tariffFeature.feature_type')}
              htmlFor="featureType"
              error={errors.featureType?.message}
              required
            >
              <Select
                id="featureType"
                invalid={!!errors.featureType}
                {...form.register('featureType')}
              >
                <option value="">{t('common.select_placeholder')}</option>
                {FEATURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={t('tariffFeature.feature_key')}
              htmlFor="featureKey"
              error={errors.featureKey?.message}
              hint={t('tariffFeature.feature_key_hint')}
              required
            >
              <Input
                id="featureKey"
                invalid={!!errors.featureKey}
                {...form.register('featureKey')}
              />
            </Field>
            <Field
              label={t('tariffFeature.feature_label')}
              htmlFor="featureLabel"
              error={errors.featureLabel?.message}
              required
            >
              <Input
                id="featureLabel"
                invalid={!!errors.featureLabel}
                {...form.register('featureLabel')}
              />
            </Field>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field
              label={t('tariffFeature.value')}
              htmlFor="value"
              error={errors.value?.message}
              hint={t('tariffFeature.value_hint')}
              required
            >
              <Input id="value" invalid={!!errors.value} {...form.register('value')} />
            </Field>
            <Field label={t('tariffFeature.unit')} htmlFor="unit">
              <Input id="unit" {...form.register('unit')} />
            </Field>
            <FormField
              control={form.control}
              name="sortOrder"
              label={t('tariffFeature.sort_order')}
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
          </div>
        </>
      )}
    </Modal>
  )
}
