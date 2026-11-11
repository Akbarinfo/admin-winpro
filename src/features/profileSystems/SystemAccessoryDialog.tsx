import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { Alert, Button, Combobox, FormField, Modal, Spinner } from '@/shared/ui'
import { systemAccessoryApi, systemAccessoryKeys } from './api'
import {
  systemAccessorySchema,
  type SystemAccessoryForm,
  type SystemAccessoryValues,
} from './schema'
import type { SystemAccessory } from './types'

const resolver = zodResolver(systemAccessorySchema)

const toForm = (a: SystemAccessory): SystemAccessoryForm => ({
  accessoryId: a.accessoryId ?? null,
  openingType: a.openingType ?? null,
  handleType: a.handleType ?? null,
  productId: a.productId ?? null,
  supplierId: a.supplierId ?? null,
})

type SystemAccessoryDialogProps = {
  systemId: number
  /** undefined — a new row. */
  id?: string
  onClose: () => void
}

/** Add/edit an accessory of the system (the old ModalAddProfileSystemAccessories). */
export function SystemAccessoryDialog({ systemId, id, onClose }: SystemAccessoryDialogProps) {
  const { t } = useTranslation()
  const [defaultValues] = useState<SystemAccessoryForm>(() => ({
    accessoryId: null,
    openingType: null,
    handleType: null,
    productId: null,
    supplierId: null,
  }))

  const { form, isEdit, isLoading, isSaving, submit } = useEntityForm({
    id,
    queryKey: systemAccessoryKeys.all,
    fetchOne: systemAccessoryApi.get,
    toForm,
    save: (v: SystemAccessoryValues, rowId?: string) =>
      systemAccessoryApi.save({ ...v, profileSystemId: systemId }, rowId),
    resolver,
    defaultValues,
    onSaved: onClose,
  })
  const { errors } = form.formState

  const accessories = useQuery({
    queryKey: [...systemAccessoryKeys.all, 'accessories'],
    queryFn: ({ signal }) => systemAccessoryApi.accessories(signal),
    staleTime: 10 * 60_000,
  })
  const openings = useQuery({
    queryKey: [...systemAccessoryKeys.all, 'enum', 'opening'],
    queryFn: ({ signal }) => systemAccessoryApi.openingTypes(signal),
    staleTime: 10 * 60_000,
  })
  const handles = useQuery({
    queryKey: [...systemAccessoryKeys.all, 'enum', 'handle'],
    queryFn: ({ signal }) => systemAccessoryApi.handleTypes(signal),
    staleTime: 10 * 60_000,
  })

  const choice = (options: string[] | undefined, loading: boolean) => ({
    options: options ?? [],
    getKey: (x: string) => x,
    getLabel: (x: string) => t(x),
    loading,
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'profileSystems.acc.edit' : 'profileSystems.acc.add')}
      size="sm"
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

          <FormField
            control={form.control}
            name="accessoryId"
            label={t('profileSystems.acc.accessory')}
            required
          >
            {(field) => (
              <Combobox
                id={field.id}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={accessories.data?.find((a) => a.id === field.value) ?? null}
                onChange={(a) => field.onChange(a?.id ?? null)}
                options={accessories.data ?? []}
                getKey={(a) => a.id}
                getLabel={(a) => t(a.name)}
                loading={accessories.isPending}
                invalid={field.invalid}
              />
            )}
          </FormField>

          <FormField
            control={form.control}
            name="openingType"
            label={t('profileSystems.acc.opening')}
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
                invalid={field.invalid}
                {...choice(openings.data, openings.isPending)}
              />
            )}
          </FormField>

          <FormField
            control={form.control}
            name="handleType"
            label={t('profileSystems.acc.handle')}
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
                invalid={field.invalid}
                {...choice(handles.data, handles.isPending)}
              />
            )}
          </FormField>
        </>
      )}
    </Modal>
  )
}
