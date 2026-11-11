import type { TranslationKey } from '@/shared/translations'

/** A row of POST /v1/translation/table: a key with its text per language. */
export type TranslationRow = TranslationKey

/** POST /v1/translation/table — not DataTables: its own page shape. */
export type TranslationPage = {
  data: TranslationRow[]
  total: number
  totalPage?: number
}

/** POST /v1/translation/import-excel: how many rows went in and why the others didn't. */
export type ImportResult = { success?: number; failed?: number; errors?: string[] | null }
