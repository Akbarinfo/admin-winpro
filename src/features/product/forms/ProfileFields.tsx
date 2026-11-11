import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/shared/ui'
import { SASH_CLEARANCE_TYPES, TRACK_TYPES, type ProfileForm, type ProfileValues } from '../schema'
import { FieldGrid, NumberField, Section } from './fields'
import type { ProductFormSpec } from './types'

/** Sizes and specifications of a profile (layout/product/profile/AddProfile.js). */
export function ProfileFields({
  form,
}: Parameters<ProductFormSpec<ProfileForm, ProfileValues>['Fields']>[0]) {
  const { t } = useTranslation()
  const { control } = form
  const profileType = useWatch({ control, name: 'profileType' })

  return (
    <>
      <Section title={t('product.section_sizes')}>
        <FieldGrid>
          <NumberField control={control} name="length" label={t('product.length')} required />
          <NumberField control={control} name="width" label={t('product.width')} required />
          <NumberField control={control} name="thickness" label={t('product.thickness')} required />
          <NumberField control={control} name="sizeB" label={t('product.size_b')} />
          <NumberField control={control} name="sizeN" label={t('product.size_n')} />
          <NumberField control={control} name="sizeF" label={t('product.size_f')} />
          {TRACK_TYPES.includes(profileType ?? '') && (
            <NumberField
              control={control}
              name="trackCount"
              label={t('product.track_count')}
              hint={t('product.track_count_hint')}
            />
          )}
          {SASH_CLEARANCE_TYPES.includes(profileType ?? '') && (
            <NumberField
              control={control}
              name="sashClearance"
              label={t('product.sash_clearance')}
              hint={t('product.sash_clearance_hint')}
            />
          )}
          <NumberField control={control} name="comeIn" label={t('product.come_in')} />
        </FieldGrid>
      </Section>

      <Section title={t('product.section_specs')}>
        <FieldGrid>
          <NumberField
            control={control}
            name="articleSpecificWeight"
            label={t('product.specific_weight')}
          />
          <NumberField control={control} name="sectionArea" label={t('product.section_area')} />
          <NumberField control={control} name="momentJx" label={t('product.moment_jx')} />
          <NumberField control={control} name="momentJy" label={t('product.moment_jy')} />
          <NumberField control={control} name="usefulPiece" label={t('product.useful_piece')} />
          <NumberField control={control} name="wastePercent" label={t('product.waste_percent')} />
        </FieldGrid>
        <div className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
          <Switch label={t('product.reinforced')} {...form.register('isReinforced')} />
          <Switch
            label={t('product.cutting_optimization')}
            {...form.register('needCuttingOptimization')}
          />
          <Switch label={t('product.arc_profile')} {...form.register('isArcProfile')} />
        </div>
      </Section>
    </>
  )
}
