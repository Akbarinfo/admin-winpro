import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fileUrl } from '@/shared/api/files'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { usePhoneCountries } from '@/shared/lookups/countries'
import { currencyLabel, useCurrencies, type Currency } from '@/shared/lookups/currencies'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  ImageUpload,
  Input,
  Modal,
  MultiSelect,
  PhoneInput,
  Spinner,
} from '@/shared/ui'
import { supplierApi, supplierKeys } from './api'
import { supplierSchema, type SupplierForm } from './schema'
import { parseTypes, type Supplier, type SupplierType } from './types'

const toForm = (s: Supplier): SupplierForm => ({
  name: s.name ?? '',
  address: s.address ?? '',
  phone: s.phone ?? '',
  country: s.country || null,
  currencyId: s.currencyId ?? null,
  types: parseTypes(s.types),
  logoId: s.logoId ?? null,
  image: null,
})

const asIs = (v: string) => v
const typeKey = (v: SupplierType) => v.name

/** Mounted on /suppliers/add and /suppliers/update/:id, over the list. */
export function SupplierFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/suppliers', search })

  const currencies = useCurrencies()
  const phoneCountries = usePhoneCountries()
  const resolver = useMemo(() => zodResolver(supplierSchema(phoneCountries)), [phoneCountries])
  const countries = useQuery({
    queryKey: [...supplierKeys.all, 'countries'],
    queryFn: ({ signal }) => supplierApi.countries(signal),
    staleTime: 10 * 60_000,
  })
  const types = useQuery({
    queryKey: [...supplierKeys.all, 'types'],
    queryFn: ({ signal }) => supplierApi.types(signal),
    staleTime: Infinity,
  })

  const [defaultValues] = useState<SupplierForm>(() => ({
    name: '',
    address: '',
    phone: '',
    country: null,
    currencyId: null,
    types: [],
    logoId: null,
    image: null,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: supplierKeys.all,
    fetchOne: supplierApi.get,
    toForm,
    save: supplierApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState
  const typeLabel = (v: SupplierType) => t(v.name)
  const currencyById = (cid: number | null) => currencies.data?.find((c) => c.id === cid) ?? null

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'suppliers.edit' : 'suppliers.add')}
      size="lg"
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
            <Field label={t('suppliers.name')} htmlFor="name" error={errors.name?.message} required>
              <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
            </Field>

            <FormField control={form.control} name="phone" label={t('suppliers.phone')}>
              {(field) => (
                <PhoneInput
                  id={field.id}
                  countries={phoneCountries}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </div>

          <Field label={t('suppliers.address')} htmlFor="address" error={errors.address?.message}>
            <Input id="address" {...form.register('address')} />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField control={form.control} name="country" label={t('suppliers.country')}>
              {(field) => (
                <Combobox<string>
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  options={countries.data ?? []}
                  getKey={asIs}
                  getLabel={asIs}
                  loading={countries.isPending}
                  clearable
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <FormField control={form.control} name="currencyId" label={t('suppliers.currency')}>
              {(field) => (
                <Combobox<Currency>
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={currencyById(field.value)}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={currencies.data ?? []}
                  getKey={(c) => c.id}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  clearable
                  invalid={field.invalid}
                />
              )}
            </FormField>
          </div>

          <FormField control={form.control} name="types" label={t('suppliers.types')}>
            {(field) => (
              <MultiSelect<SupplierType>
                id={field.id}
                onBlur={field.onBlur}
                value={field.value.map((name) => ({ id: name, name }))}
                onChange={(list) => field.onChange(list.map((v) => v.name))}
                options={types.data ?? []}
                getKey={typeKey}
                getLabel={typeLabel}
                loading={types.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>

          <FormField control={form.control} name="image" label={t('suppliers.logo')}>
            {(field) => (
              <ImageUpload
                id={field.id}
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                currentUrl={fileUrl('supplier', form.getValues('logoId'))}
                invalid={field.invalid}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
