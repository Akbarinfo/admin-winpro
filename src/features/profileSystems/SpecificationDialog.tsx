import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useSuppliers } from '@/shared/lookups/suppliers'
import { Alert, Button, Combobox, FormField, Modal, NumberInput, Spinner } from '@/shared/ui'
import { specificationApi, specificationKeys } from './api'
import { ProductPicker } from '@/shared/lookups/ProductPicker'
import {
  PRODUCT_TYPE_BY_APPLICATION,
  specificationSchema,
  type SpecificationForm,
  type SpecificationValues,
} from './schema'
import type { Specification } from './types'

const resolver = zodResolver(specificationSchema)

const toForm = (s: Specification): SpecificationForm => ({
  priority: s.priority ?? null,
  applicationType: s.applicationType ?? null,
  productId: s.productId ?? null,
  sideType: s.sideType ?? null,
  supplierId: s.supplierId ?? null,
})

type SpecificationDialogProps = {
  systemId: number
  /** undefined — a new row. */
  id?: string
  /** The table's supplier filter: a new row starts with it, as the old panel added under it. */
  supplierId: number | null
  onClose: () => void
}

/** Add/edit a profile of the system (the old ModalAddProfileSystemSpecification). */
export function SpecificationDialog({
  systemId,
  id,
  supplierId,
  onClose,
}: SpecificationDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<SpecificationForm>(() => ({
    priority: null,
    applicationType: null,
    productId: null,
    sideType: null,
    supplierId,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: specificationKeys.all,
    fetchOne: specificationApi.get,
    toForm,
    save: (v: SpecificationValues, rowId?: string) =>
      specificationApi.save({ ...v, profileSystemId: systemId }, rowId),
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState

  const applications = useQuery({
    queryKey: [...specificationKeys.all, 'enum', 'application'],
    queryFn: ({ signal }) => specificationApi.applicationTypes(signal),
    staleTime: 10 * 60_000,
  })
  const sides = useQuery({
    queryKey: [...specificationKeys.all, 'enum', 'side'],
    queryFn: ({ signal }) => specificationApi.sideTypes(signal),
    staleTime: 10 * 60_000,
  })
  const suppliers = useSuppliers()

  const application = useWatch({ control: form.control, name: 'applicationType' })
  const productType = application ? PRODUCT_TYPE_BY_APPLICATION[application] : undefined

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'profileSystems.spec.edit' : 'profileSystems.spec.add')}
      onSubmit={submit}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
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
              name="applicationType"
              label={t('profileSystems.spec.application')}
              required
            >
              {(field) => (
                <Combobox
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={(next) => {
                    // Another product type: the chosen product may not fit — choose again.
                    const before = field.value
                      ? PRODUCT_TYPE_BY_APPLICATION[field.value]
                      : undefined
                    const after = next ? PRODUCT_TYPE_BY_APPLICATION[next] : undefined
                    if (before !== after) form.setValue('productId', null)
                    field.onChange(next)
                  }}
                  options={applications.data ?? []}
                  getKey={(x) => x}
                  getLabel={(x) => t(x)}
                  loading={applications.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="priority"
              label={t('profileSystems.spec.priority')}
              hint={t('profileSystems.spec.priority_hint')}
              required
            >
              {(field) => (
                <NumberInput
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  nonNegative
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="productId"
                label={t('profileSystems.spec.article')}
                hint={
                  productType
                    ? t('profileSystems.spec.product_type_hint', { type: t(productType) })
                    : undefined
                }
                required
              >
                {(field) => (
                  <ProductPicker
                    id={field.id}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={field.onChange}
                    profileType={productType}
                    invalid={field.invalid}
                  />
                )}
              </FormField>
            </div>

            <FormField
              control={form.control}
              name="sideType"
              label={t('profileSystems.spec.side')}
              required
            >
              {(field) => (
                <Combobox
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onChange={field.onChange}
                  options={sides.data ?? []}
                  getKey={(x) => x}
                  getLabel={(x) => t(x)}
                  loading={sides.isPending}
                  invalid={field.invalid}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="supplierId"
              label={t('profileSystems.spec.supplier')}
              required
            >
              {(field) => (
                <Combobox
                  id={field.id}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={suppliers.data?.find((s) => s.id === field.value) ?? null}
                  onChange={(s) => field.onChange(s?.id ?? null)}
                  options={suppliers.data ?? []}
                  getKey={(s) => s.id}
                  getLabel={(s) => t(s.name)}
                  loading={suppliers.isPending}
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
