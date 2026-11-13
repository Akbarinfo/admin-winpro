import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { useSeriesList } from '@/shared/lookups/series'
import { useSuppliers } from '@/shared/lookups/suppliers'
import { useTextures, type TextureOption } from '@/shared/lookups/textures'
import { useUnits } from '@/shared/lookups/units'
import { Combobox, Field, FormField, Input, MultiSelect, NumberInput, Select } from '@/shared/ui'
import { ARTICLE_GROUP_TYPES } from './api'
import type { AkfaProductForm, AkfaProductValues } from './schema'

type IdName = { id: number; name: string }

/** A new WinPro product (the old AkfaCreateProductForm). */
export function CreateProductFields({
  form,
}: {
  form: UseFormReturn<AkfaProductForm, unknown, AkfaProductValues>
}) {
  const { t } = useTranslation()
  const units = useUnits()
  const suppliers = useSuppliers()
  const series = useSeriesList()
  const textures = useTextures()
  const { errors } = form.formState

  const pick = (
    name: 'unitId' | 'supplierId' | 'productSeriesId',
    label: string,
    list: { data?: IdName[]; isPending: boolean },
  ) => (
    <FormField control={form.control} name={name} label={label}>
      {(field) => (
        <Combobox<IdName>
          id={field.id}
          ref={field.ref}
          onBlur={field.onBlur}
          value={list.data?.find((x) => x.id === field.value) ?? null}
          onChange={(x) => field.onChange(x?.id ?? null)}
          options={list.data ?? []}
          getKey={(x) => x.id}
          getLabel={(x) => t(x.name)}
          loading={list.isPending}
          clearable
        />
      )}
    </FormField>
  )

  return (
    <div className="grid gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field
          label={t('akfa.createFromAkfa.name')}
          htmlFor="akfa-name"
          error={errors.name?.message}
          required
        >
          <Input id="akfa-name" invalid={!!errors.name} {...form.register('name')} />
        </Field>
        <Field
          label={t('akfa.createFromAkfa.article')}
          htmlFor="akfa-article"
          error={errors.article?.message}
          required
        >
          <Input id="akfa-article" invalid={!!errors.article} {...form.register('article')} />
        </Field>
        <Field label={t('akfa.create.article_group_type')} htmlFor="akfa-group" required>
          <Select id="akfa-group" {...form.register('articleGroupType')}>
            {ARTICLE_GROUP_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </Select>
        </Field>
        <FormField control={form.control} name="length" label={t('akfa.length')}>
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
        {pick('unitId', t('akfa.unit'), units)}
        {pick('supplierId', t('akfa.supplier'), suppliers)}
        {pick('productSeriesId', t('akfa.series'), series)}
      </div>
      <FormField
        control={form.control}
        name="textureIds"
        label={t('akfa.create.textures')}
        required
      >
        {(field) => (
          <MultiSelect<TextureOption>
            id={field.id}
            onBlur={field.onBlur}
            value={(textures.data ?? []).filter((x) => field.value.includes(x.id))}
            onChange={(list) => field.onChange(list.map((x) => x.id))}
            options={textures.data ?? []}
            getKey={(x) => x.id}
            getLabel={(x) => x.name}
            loading={textures.isPending}
            placeholder={t('akfa.create.texture_search')}
            invalid={field.invalid}
          />
        )}
      </FormField>
    </div>
  )
}
