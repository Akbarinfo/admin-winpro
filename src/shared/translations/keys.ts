import { api } from '@/shared/api/client'

/** A translation key with its text per language (/v1/translation). */
export type TranslationKey = {
  key: string
  translations?: { code: string; value?: string | null }[] | null
}

export const translationKeyKeys = {
  all: ['translation'] as const,
  search: (query: string) => ['translation', 'search', query] as const,
  byKey: (key: string) => ['translation', 'by-key', key] as const,
}

const enc = encodeURIComponent

// Endpoints and bodies match the old panel (services/translationCrudService.js).
export const translationKeyApi = {
  search: (query: string, signal?: AbortSignal) =>
    api
      .get<TranslationKey[]>(`/v1/translation/search?key=${enc(query)}`, { signal })
      .then((r) => r.data ?? []),

  byKey: (key: string, signal?: AbortSignal) =>
    api.get<TranslationKey>(`/v1/translation/by-key/${enc(key)}`, { signal }).then((r) => r.data),

  /** A new key with a text for every active language (empty ones as ""). */
  create: (key: string, translations: { code: string; value: string }[]) =>
    api.post('/v1/translation', { key, translations }),
}
