import { useTranslation } from 'react-i18next'
import type { SealForm, SealValues } from '../schema'
import { FieldGrid, NumberField, Section } from './fields'
import type { ProductFormSpec } from './types'

/** Weight and waste of a seal (layout/product/seal/AddSealType.js). */
export function SealFields({
  form,
}: Parameters<ProductFormSpec<SealForm, SealValues>['Fields']>[0]) {
  const { t } = useTranslation()
  const { control } = form
  return (
    <Section title={t('product.section_specs')}>
      <FieldGrid>
        <NumberField
          control={control}
          name="articleSpecificWeight"
          label={t('product.specific_weight')}
        />
        <NumberField control={control} name="waste" label={t('product.waste')} required />
      </FieldGrid>
    </Section>
  )
}
