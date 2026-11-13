import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useEntityForm } from '@/shared/hooks/useEntityForm'
import { useListUrl } from '@/shared/hooks/useListUrl'
import {
  Alert,
  BackLink,
  Button,
  Card,
  Combobox,
  Field,
  FormField,
  Input,
  NumberInput,
  PageHeader,
  Spinner,
  Switch,
} from '@/shared/ui'
import { furnitureApi, furnitureKeys } from './api'
import { accessorySchema, type AccessoryForm } from './schema'
import type { Accessory, EnumOption } from './types'
import { useAccessoryEnum } from './useEnum'

const resolver = zodResolver(accessorySchema)

const toForm = (a: Accessory): AccessoryForm => ({
  name: a.name ?? '',
  shortName: a.shortName ?? '',
  handleSide: a.handleSide ?? null,
  maxHalfPerimeter: a.maxHalfPerimeter ?? null,
  maxHeight: a.maxHeight ?? null,
  maxWidth: a.maxWidth ?? null,
  maxSash: a.maxSash ?? null,
  accessoriesType: a.accessoriesType ?? null,
  openingType: a.openingType ?? null,
  // the old form showed «Внутрь» when the record had none
  openingSide: a.openingSide ?? 'INWARD',
  door: !!a.door,
})

type NumberName = 'handleSide' | 'maxHalfPerimeter' | 'maxHeight' | 'maxWidth' | 'maxSash'
type EnumName = 'accessoriesType' | 'openingType' | 'openingSide'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-3.5 p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </Card>
  )
}

/** /furniture/add and /furniture/update/:id — a page, as before (the old AddAccessories). */
export function FurnitureFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  // back to the list as it was left
  const listUrl = useListUrl('/furniture')
  const close = () => navigate(listUrl)

  const types = useAccessoryEnum('type')
  const openingTypes = useAccessoryEnum('openingtype')
  const openingSides = useAccessoryEnum('openingside')

  const [defaultValues] = useState<AccessoryForm>(() => ({
    name: '',
    shortName: '',
    handleSide: null,
    maxHalfPerimeter: null,
    maxHeight: null,
    maxWidth: null,
    maxSash: null,
    accessoriesType: null,
    openingType: null,
    openingSide: 'INWARD',
    door: false,
  }))

  const { form, isEdit, isLoading, isSaving, loadError, submit } = useEntityForm({
    id,
    queryKey: furnitureKeys.all,
    fetchOne: furnitureApi.get,
    toForm,
    save: furnitureApi.save,
    resolver,
    defaultValues,
    onSaved: close,
  })
  const { errors } = form.formState

  const number = (name: NumberName, label: string) => (
    <FormField control={form.control} name={name} label={label}>
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
  )

  const choice = (
    name: EnumName,
    label: string,
    list: { data?: EnumOption[]; isPending: boolean },
  ) => (
    <FormField control={form.control} name={name} label={label}>
      {(field) => (
        <Combobox<EnumOption>
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={list.data?.find((o) => o.name === field.value) ?? null}
          onChange={(o) => field.onChange(o?.name ?? null)}
          options={list.data ?? []}
          getKey={(o) => o.id}
          getLabel={(o) => t(o.name)}
          loading={list.isPending}
          clearable
        />
      )}
    </FormField>
  )

  return (
    <div className="mx-auto grid max-w-[880px] gap-4">
      <BackLink to="/furniture">{t('furniture.back')}</BackLink>
      <PageHeader title={t(isEdit ? 'furniture.edit' : 'furniture.new')} />

      {/* The record couldn't be loaded: say so instead of an empty form that would save over it. */}
      {loadError ? (
        <Alert>{t('common.load_error')}</Alert>
      ) : isLoading ? (
        <div className="grid place-items-center py-16 text-primary">
          <Spinner className="size-6" />
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-4">
          {errors.root && <Alert>{errors.root.message}</Alert>}
          <Section title={t('furniture.title')}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field
                label={t('furniture.name')}
                htmlFor="name"
                error={errors.name?.message}
                required
              >
                <Input id="name" autoFocus invalid={!!errors.name} {...form.register('name')} />
              </Field>
              <Field label={t('furniture.short_name')} htmlFor="shortName">
                <Input id="shortName" {...form.register('shortName')} />
              </Field>
              {choice('accessoriesType', t('furniture.type'), types)}
              {choice('openingType', t('furniture.opening_type'), openingTypes)}
              {choice('openingSide', t('furniture.opening_side'), openingSides)}
              {number('handleSide', t('furniture.handle_side'))}
            </div>
            <Switch label={t('furniture.door')} {...form.register('door')} />
          </Section>

          <Section title={t('furniture.limits_group')}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {number('maxHalfPerimeter', t('furniture.max_half_perimeter'))}
              {number('maxHeight', t('furniture.max_height'))}
              {number('maxWidth', t('furniture.max_width'))}
              {number('maxSash', t('furniture.max_sash'))}
            </div>
          </Section>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSaving}>
              {t(isSaving ? 'common.saving' : 'common.save')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
