import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { Alert, Button, Combobox, FormField, Modal } from '@/shared/ui'
import { furnitureApi, furnitureKeys, type SpecTab } from './api'
import {
  copyToAccessorySchema,
  type CopyToAccessoryForm,
  type CopyToAccessoryValues,
} from './schema'
import type { Accessory, AccessorySpecification } from './types'

const resolver = zodResolver(copyToAccessorySchema)

const accessoryLabel = (a: Accessory) =>
  a.shortName ? `${a.name ?? ''} (${a.shortName})` : (a.name ?? '')

type CopyToAccessoryDialogProps = {
  tab: SpecTab
  /** The accessory the row belongs to: not offered as a target. */
  accessoryId: number
  row: AccessorySpecification
  onClose: () => void
}

/**
 * A main/track row copied into another accessory (the old ModalCopySpecificationToAccessories).
 * Not a record form, so not built on useEntityForm; links the server couldn't find come back as warnings.
 */
export function CopyToAccessoryDialog({
  tab,
  accessoryId,
  row,
  onClose,
}: CopyToAccessoryDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  // kept apart: a new search may not list the chosen one any more
  const [chosen, setChosen] = useState<Accessory | null>(null)
  const [search, setSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const accessories = useQuery({
    queryKey: [...furnitureKeys.search, search],
    queryFn: ({ signal }) => furnitureApi.search(search, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
  const options = (accessories.data ?? []).filter((a) => a.id !== accessoryId)

  const form = useForm<CopyToAccessoryForm, unknown, CopyToAccessoryValues>({
    resolver,
    defaultValues: { accessoriesId: null },
  })

  const copy = useMutation({
    mutationFn: (v: CopyToAccessoryValues) =>
      furnitureApi.copyToAccessory(tab, row.id, v.accessoriesId),
    onSuccess: (warnings) => {
      toast.success(t('furniture.spec.copy_to_done'))
      if (warnings.length)
        toast.warning(t('furniture.spec.copy_to_warnings', { list: warnings.join('; ') }), {
          duration: 10_000,
        })
      onClose()
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={t('furniture.spec.copy_to')}
      description={[row.article, row.productName].filter(Boolean).join(' — ') || undefined}
      size="sm"
      onSubmit={form.handleSubmit((v) => copy.mutate(v))}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={copy.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={copy.isPending}>
            {t('furniture.spec.copy_to_submit')}
          </Button>
        </>
      }
    >
      {/* the old modal showed the backend's reason in place; a 420 is already a warning toast */}
      {isClientError(copy.error) && copy.error.status !== 420 && (
        <Alert>{copy.error.message}</Alert>
      )}
      <FormField
        control={form.control}
        name="accessoriesId"
        label={t('furniture.spec.copy_to_choose')}
        required
      >
        {(field) => (
          <Combobox<Accessory>
            id={field.id}
            ref={field.ref}
            onBlur={field.onBlur}
            value={chosen}
            onChange={(a) => {
              setChosen(a)
              field.onChange(a?.id ?? null)
            }}
            options={options}
            getKey={(a) => a.id}
            getLabel={accessoryLabel}
            loading={accessories.isFetching}
            onQueryChange={setQuery}
            invalid={field.invalid}
          />
        )}
      </FormField>
    </Modal>
  )
}
