// Per-country translations of a record's text fields (/v1/country-translation).
// A country «on» means the record has its own texts there; turning it off deletes them.

/** As stored by the backend. `field` is one of the record's translatable fields: NAME, NAME_IN_CATALOG… */
export type Translation = {
  id: number
  entityType: string
  entityId: number
  countryId: number
  field: string
  value: string | null
}

/** A text to save: `id` null creates it. */
export type TranslationDto = Omit<Translation, 'id' | 'value'> & {
  id: number | null
  value: string
}

export type TranslationField = { key: string; label: string }

export type TranslationRow = {
  countryId: number
  countryName: string
  /** The country has its own texts. */
  enabled: boolean
  /** field → saved id (null if new) and current text */
  values: Record<string, { id: number | null; value: string }>
}

/** One row per country; a country with any saved text starts enabled. */
export function buildTranslationRows(
  countries: { id: number; name: string }[],
  fields: TranslationField[],
  saved: Translation[],
): TranslationRow[] {
  return countries.map((c) => {
    const values: TranslationRow['values'] = {}
    let enabled = false
    for (const f of fields) {
      const tr = saved.find((s) => s.countryId === c.id && s.field === f.key)
      if (tr) enabled = true
      values[f.key] = { id: tr?.id ?? null, value: tr?.value ?? '' }
    }
    return { countryId: c.id, countryName: c.name, enabled, values }
  })
}

/** Turning a country on fills its empty fields with the record's own texts, as a starting point. */
export function toggleTranslationRow(
  row: TranslationRow,
  defaults: Record<string, string | null | undefined>,
): TranslationRow {
  if (row.enabled) return { ...row, enabled: false }
  const values = { ...row.values }
  for (const [key, entry] of Object.entries(values)) {
    const fallback = defaults[key]
    if (!entry.value && fallback) values[key] = { ...entry, value: fallback }
  }
  return { ...row, enabled: true, values }
}

/**
 * What to send after the record is saved: non-empty texts of enabled countries go in one batch
 * (with their id when updating); saved texts of disabled countries are deleted.
 * A field cleared in an enabled country is deleted too — the old panel silently kept it.
 */
export function planTranslationSave(rows: TranslationRow[], entityType: string, entityId: number) {
  const batch: TranslationDto[] = []
  const deleteIds: number[] = []
  for (const row of rows) {
    for (const [field, entry] of Object.entries(row.values)) {
      const value = entry.value.trim()
      if (row.enabled && value)
        batch.push({ id: entry.id, entityType, entityId, countryId: row.countryId, field, value })
      else if (entry.id !== null) deleteIds.push(entry.id)
    }
  }
  return { batch, deleteIds }
}
