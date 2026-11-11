import { useQuery } from '@tanstack/react-query'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Combobox, FormField } from '@/shared/ui'
import { productApi, productKeys } from '../api'
import {
  FITTINGS_TYPE,
  HANDLE_SUBTYPE,
  type AccessoriesForm,
  type AccessoriesValues,
} from '../schema'
import { FieldGrid, NumberField, Section } from './fields'
import { HandlePicker } from './HandlePicker'
import type { ProductFormSpec } from './types'

/**
 * Weight of an accessory; a subtype for fittings, and a handle picture for a handle
 * (layout/product/accessories/AddAccessoriesType.js).
 */
export function AccessoriesFields({
  form,
}: Parameters<ProductFormSpec<AccessoriesForm, AccessoriesValues>['Fields']>[0]) {
  const { t } = useTranslation()
  const { control } = form
  const [profileType, subtype] = useWatch({ control, name: ['profileType', 'subtype'] })
  const isFittings = profileType === FITTINGS_TYPE
  const subtypes = useQuery({
    queryKey: productKeys.subtypes,
    queryFn: ({ signal }) => productApi.subtypes(signal),
    staleTime: 10 * 60_000,
    enabled: isFittings,
  })

  return (
    <Section title={t('product.section_specs')}>
      <FieldGrid>
        <NumberField
          control={control}
          name="articleSpecificWeight"
          label={t('product.specific_weight')}
        />
        {isFittings && (
          // Not clearable, as in the old form: a loaded null stays null until a subtype is picked.
          <FormField control={control} name="subtype" label={t('product.subtype')}>
            {(field) => (
              <Combobox
                id={field.id}
                ref={field.ref}
                onBlur={field.onBlur}
                value={subtypes.data?.find((x) => x.name === field.value) ?? null}
                onChange={(x) => field.onChange(x?.name ?? '')}
                options={subtypes.data ?? []}
                getKey={(x) => x.name}
                getLabel={(x) => t(x.name)}
                loading={subtypes.isPending}
              />
            )}
          </FormField>
        )}
      </FieldGrid>
      {/* As the old form: by the subtype alone, even if the type was changed away from fittings. */}
      {subtype === HANDLE_SUBTYPE && <HandlePicker control={control} />}
    </Section>
  )
}
