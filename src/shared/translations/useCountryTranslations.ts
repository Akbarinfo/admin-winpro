import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useCountries } from '@/shared/lookups/countries'
import { translationApi, translationKeys } from './api'
import {
  buildTranslationRows,
  planTranslationSave,
  toggleTranslationRow,
  type TranslationField,
  type TranslationRow,
} from './helpers'

/**
 * State of a record's per-country translations, for <CountryTranslations>.
 * The record is saved first; then `save(id)` sends the translations (a new record has its id only then).
 * `fields` must be a module-level constant.
 */
export function useCountryTranslations(
  entityType: string,
  entityId: number | undefined,
  fields: TranslationField[],
) {
  const queryClient = useQueryClient()
  const countries = useCountries()
  const saved = useQuery({
    queryKey: translationKeys.of(entityType, entityId ?? 0),
    queryFn: ({ signal }) => translationApi.byEntity(entityType, entityId!, signal),
    enabled: entityId !== undefined,
    staleTime: Infinity, // don't reset the table under the user's hands
  })

  const loaded = useMemo(
    () => buildTranslationRows(countries.data ?? [], fields, saved.data ?? []),
    [countries.data, fields, saved.data],
  )
  // The user's edits; until the first one the table shows what was loaded.
  const [edited, setEdited] = useState<TranslationRow[] | null>(null)
  const rows = edited ?? loaded

  const update = useCallback(
    (countryId: number, change: (row: TranslationRow) => TranslationRow) =>
      setEdited((prev) =>
        (prev ?? loaded).map((row) => (row.countryId === countryId ? change(row) : row)),
      ),
    [loaded],
  )

  return {
    rows,
    /** Excel import needs a saved record. */
    canImport: entityId !== undefined,
    /** Loads the texts from Excel, then shows what the server has (unsaved edits here are replaced). */
    importExcel: async (file: File, onProgress: (percent: number) => void) => {
      if (entityId === undefined) return
      await translationApi.importExcel(entityType, entityId, file, onProgress)
      setEdited(null)
      await queryClient.invalidateQueries({ queryKey: translationKeys.of(entityType, entityId) })
    },
    isLoading: countries.isPending || (entityId !== undefined && saved.isPending),
    error: countries.error ?? saved.error,
    toggle: (countryId: number, defaults: Record<string, string | null | undefined>) =>
      update(countryId, (row) => toggleTranslationRow(row, defaults)),
    setValue: (countryId: number, field: string, value: string) =>
      update(countryId, (row) => ({
        ...row,
        values: { ...row.values, [field]: { ...row.values[field], value } },
      })),
    /**
     * Sends the batch, then the deletions — the same order as the old panel.
     * Even if a step fails, the table reloads from the server: what was saved gets its id,
     * so saving again updates it instead of creating a duplicate.
     */
    save: async (id: number) => {
      const { batch, deleteIds } = planTranslationSave(rows, entityType, id)
      try {
        if (batch.length) await translationApi.saveBatch(batch)
        for (const trId of deleteIds) await translationApi.remove(trId)
      } finally {
        setEdited(null)
        await queryClient.invalidateQueries({ queryKey: translationKeys.of(entityType, id) })
      }
    },
  }
}

export type CountryTranslationsState = ReturnType<typeof useCountryTranslations>
