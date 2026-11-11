import { api } from '@/shared/api/client'
import { fetchLanguages, languageKeys } from '@/shared/lookups/languages'
import type { LanguageValues } from './schema'
import type { Language } from './types'

// Same key as the shared lookup (the translation-key dialog): saving here refreshes it.
export { languageKeys }

const path = (code: string) => `/v1/language/${encodeURIComponent(code)}`

// Endpoints and bodies match the old panel (layout/language, services/languageService.js).
// There is no /table endpoint: the whole list comes at once.
export const languageApi = {
  list: fetchLanguages,

  get: (code: string, signal?: AbortSignal) =>
    api.get<Language>(path(code), { signal }).then((r) => r.data),

  /**
   * Create: POST /v1/language with `default`. Update: PUT /v1/language/{code} with `isDefault` and no code.
   * The field name differs between the two — kept exactly as the old panel sends it.
   */
  save: ({ code, name, isDefault, active }: LanguageValues, currentCode?: string) =>
    currentCode
      ? api.put(path(currentCode), { name, isDefault, active })
      : api.post('/v1/language', { code, name, default: isDefault, active }),

  remove: (code: string) => api.delete(path(code)),
}
