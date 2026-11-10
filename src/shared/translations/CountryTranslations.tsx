import { useTranslation } from 'react-i18next'
import { Alert, Input, Spinner } from '@/shared/ui'
import type { TranslationField } from './helpers'
import type { CountryTranslationsState } from './useCountryTranslations'

type CountryTranslationsProps = {
  state: CountryTranslationsState
  fields: TranslationField[]
  /** The record's own texts: an enabled country starts from them. */
  defaults: Record<string, string | null | undefined>
}

/**
 * Table «country × field» of a record's own texts per country (the old TranslationTable).
 * A country is switched on with its checkbox; switched off, its texts are deleted on save.
 */
export function CountryTranslations({ state, fields, defaults }: CountryTranslationsProps) {
  const { t } = useTranslation()

  if (state.error) return <Alert>{t('common.load_error')}</Alert>
  if (state.isLoading)
    return (
      <div className="grid place-items-center py-6 text-primary">
        <Spinner />
      </div>
    )
  if (state.rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-left">
        <thead className="bg-surface-2 text-xs font-medium text-muted">
          <tr>
            <th className="px-3 py-2">{t('translations.country')}</th>
            <th className="w-20 px-3 py-2 text-center">{t('translations.enabled')}</th>
            {fields.map((f) => (
              <th key={f.key} className="px-3 py-2">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {state.rows.map((row) => (
            <tr key={row.countryId}>
              <td className="px-3 py-2 whitespace-nowrap">{row.countryName}</td>
              <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  aria-label={t('translations.enable_for', { country: row.countryName })}
                  checked={row.enabled}
                  onChange={() => state.toggle(row.countryId, defaults)}
                />
              </td>
              {fields.map((f) => (
                <td key={f.key} className="min-w-48 px-3 py-1.5">
                  <Input
                    aria-label={`${f.label} — ${row.countryName}`}
                    disabled={!row.enabled}
                    value={row.values[f.key]?.value ?? ''}
                    onChange={(e) => state.setValue(row.countryId, f.key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
