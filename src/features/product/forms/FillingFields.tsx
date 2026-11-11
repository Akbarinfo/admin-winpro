import { useTranslation } from 'react-i18next'
import { Switch } from '@/shared/ui'
import type { FillingForm, FillingValues } from '../schema'
import { FieldGrid, NumberField, Section } from './fields'
import type { ProductFormSpec } from './types'

/** Sizes, weight and waste of a filling (layout/product/filling/AddFillingType.js). */
export function FillingFields({
  form,
}: Parameters<ProductFormSpec<FillingForm, FillingValues>['Fields']>[0]) {
  const { t } = useTranslation()
  const { control } = form
  return (
    <Section title={t('product.section_specs')}>
      <FieldGrid>
        <NumberField control={control} name="length" label={t('product.length')} required />
        <NumberField control={control} name="width" label={t('product.width')} required />
        <NumberField control={control} name="thickness" label={t('product.thickness')} required />
        <NumberField
          control={control}
          name="articleSpecificWeight"
          label={t('product.specific_weight')}
        />
        <NumberField control={control} name="waste" label={t('product.waste')} required />
      </FieldGrid>
      <div className="pt-1">
        <Switch
          label={t('product.cutting_optimization')}
          {...form.register('needCuttingOptimization')}
        />
      </div>
    </Section>
  )
}
