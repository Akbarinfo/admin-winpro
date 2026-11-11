import { useController, useFieldArray, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { TranslationKeyInput } from '@/shared/translations'
import { Button, IconButton } from '@/shared/ui'
import type { ProfileSystemForm } from './schema'

type Props = { control: Control<ProfileSystemForm> }

/**
 * The system's characteristics (the old «Xususiyatlar»): rows of two translation keys — what it
 * is and its value. The apps show their texts in the user's language.
 */
export function CharacteristicsFields({ control }: Props) {
  const { t } = useTranslation()
  const rows = useFieldArray({ control, name: 'characteristics' })

  return (
    <section aria-labelledby="ps-characteristics" className="grid gap-2">
      <h3 id="ps-characteristics" className="font-semibold">
        {t('profileSystems.characteristics')}
      </h3>
      {rows.fields.length === 0 ? (
        <p className="text-sm text-muted">{t('profileSystems.no_characteristics')}</p>
      ) : (
        <div className="grid gap-2">
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] gap-2 text-sm font-medium text-muted sm:grid"
          >
            <span>{t('profileSystems.characteristic')}</span>
            <span>{t('profileSystems.characteristic_value')}</span>
          </div>
          {rows.fields.map((row, i) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_36px] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px]"
            >
              <KeyCell
                control={control}
                name={`characteristics.${i}.key`}
                label={`${t('profileSystems.characteristic')} ${i + 1}`}
              />
              <div className="max-sm:col-start-1 max-sm:row-start-2">
                <KeyCell
                  control={control}
                  name={`characteristics.${i}.value`}
                  label={`${t('profileSystems.characteristic_value')} ${i + 1}`}
                />
              </div>
              <IconButton
                tone="danger"
                label={`${t('profileSystems.remove_characteristic')} ${i + 1}`}
                className="size-9"
                onClick={() => rows.remove(i)}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => rows.append({ key: '', value: '' }, { shouldFocus: true })}
        >
          {t('profileSystems.add_characteristic')}
        </Button>
      </div>
    </section>
  )
}

function KeyCell({
  control,
  name,
  label,
}: {
  control: Control<ProfileSystemForm>
  name: `characteristics.${number}.${'key' | 'value'}`
  label: string
}) {
  const { t } = useTranslation()
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  return (
    <div className="grid gap-1">
      <TranslationKeyInput
        id={name}
        ref={ref}
        aria-label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        invalid={!!fieldState.error}
      />
      {fieldState.error?.message && (
        <p className="text-xs text-danger">{t(fieldState.error.message)}</p>
      )}
    </div>
  )
}
