import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import {
  currencyDecimals,
  currencyLabel,
  useCurrencies,
  type Currency,
} from '@/shared/lookups/currencies'
import { useProfileSystemTree, type ProfileSystemNode } from '@/shared/lookups/profileSystems'
import {
  Alert,
  Button,
  Combobox,
  Field,
  FormField,
  Input,
  Modal,
  MultiSelect,
  NumberInput,
  Spinner,
  TreeSelect,
} from '@/shared/ui'
import { salesCategoryApi, salesCategoryKeys } from './api'
import { salesCategorySchema, type SalesCategoryForm } from './schema'
import type { SalesCategory } from './types'

const resolver = zodResolver(salesCategorySchema)

const toForm = (c: SalesCategory): SalesCategoryForm => ({
  name: c.name ?? '',
  description: c.description ?? '',
  price: c.price ?? null,
  currencyId: c.currencyId ?? null,
  freeForTariffs: c.freeForTariffs ?? [],
  profileSystemIds: c.profileSystemIds ?? [],
})

const nodeKey = (n: ProfileSystemNode) => n.id
const nodeLabel = (n: ProfileSystemNode) => n.name
const nodeChildren = (n: ProfileSystemNode) => n.children
const identity = (s: string) => s

/** Mounted on /sales_category/add and /sales_category/update/:id, over the list. */
export function SalesCategoryFormDialog() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const close = () => navigate({ pathname: '/sales_category', search })

  const currencies = useCurrencies()
  const profileSystems = useProfileSystemTree()
  const tariffs = useQuery({
    queryKey: [...salesCategoryKeys.all, 'tariffs'],
    queryFn: ({ signal }) => salesCategoryApi.tariffs(signal),
    staleTime: Infinity,
  })

  const [defaultValues] = useState<SalesCategoryForm>(() => ({
    name: '',
    description: '',
    price: null,
    currencyId: null,
    freeForTariffs: [],
    profileSystemIds: [],
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: salesCategoryKeys.all,
    fetchOne: salesCategoryApi.get,
    toForm,
    save: salesCategoryApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState
  const currencyId = useWatch({ control: form.control, name: 'currencyId' })
  const currencyById = (cid: number | null) => currencies.data?.find((c) => c.id === cid) ?? null

  return (
    <Modal
      open
      onClose={close}
      title={t(isEdit ? 'salesCategory.edit' : 'salesCategory.add')}
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

          <Field
            label={t('salesCategory.name')}
            htmlFor="name"
            error={errors.name?.message}
            required
          >
            <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              label={t('salesCategory.price')}
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
                  minDecimals={currencyDecimals(currencyById(currencyId))}
                />
              )}
            </FormField>

            <FormField control={form.control} name="currencyId" label={t('salesCategory.currency')}>
              {(field) => (
                <Combobox<Currency>
                  id={field.id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={currencyById(field.value)}
                  onChange={(c) => field.onChange(c?.id ?? null)}
                  options={currencies.data ?? []}
                  getKey={(c) => c.id}
                  getLabel={currencyLabel}
                  loading={currencies.isPending}
                  clearable
                />
              )}
            </FormField>
          </div>

          <FormField
            control={form.control}
            name="freeForTariffs"
            label={t('salesCategory.tariffs')}
          >
            {(field) => (
              <MultiSelect<string>
                id={field.id}
                onBlur={field.onBlur}
                value={field.value}
                onChange={field.onChange}
                options={tariffs.data ?? []}
                getKey={identity}
                getLabel={identity}
                loading={tariffs.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>

          <FormField
            control={form.control}
            name="profileSystemIds"
            label={t('salesCategory.profile_systems')}
          >
            {(field) => (
              <TreeSelect<ProfileSystemNode, number>
                id={field.id}
                onBlur={field.onBlur}
                value={field.value}
                onChange={field.onChange}
                options={profileSystems.data ?? []}
                getKey={nodeKey}
                getLabel={nodeLabel}
                getChildren={nodeChildren}
                loading={profileSystems.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
