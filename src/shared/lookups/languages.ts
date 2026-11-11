import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** An interface language as returned by /v1/language. The code (ru, uz, en…) is its id. */
export type Language = {
  code: string
  name: string
  default: boolean
  active: boolean
}

export const languageKeys = { all: ['language'] as const }

export const fetchLanguages = (signal?: AbortSignal) =>
  api.get<Language[]>('/v1/language', { signal }).then((r) => r.data)

/** The active languages: a translation key gets a text in each (the old TranslationKeyModal). */
export function useActiveLanguages() {
  return useQuery({
    // the same request as the Languages list page
    queryKey: [...languageKeys.all, 'list'],
    queryFn: ({ signal }) => fetchLanguages(signal),
    select: (list) => list.filter((l) => l.active),
    staleTime: 10 * 60_000,
  })
}
