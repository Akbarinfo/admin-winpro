import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

export type FillingGroupOption = { id: number; name: string }
/** A filling product (glass unit, sandwich panel) by its article. */
export type FillingArticleOption = { id: number; name: string; article?: string | null }

export const fillingGroupKeys = { all: ['filling-group'] as const }

/** Groups of fillings: /v1/filling/group/list. */
export function useFillingGroups() {
  return useQuery({
    queryKey: [...fillingGroupKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<FillingGroupOption[]>('/v1/filling/group/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}

/** Filling products to pick a default glass unit or panel from. Under 'product': product saves refresh it. */
export function useFillingArticles() {
  return useQuery({
    queryKey: ['product', 'article', 'filling'],
    queryFn: ({ signal }) =>
      api
        .get<FillingArticleOption[]>('/v1/product/article/filling', { signal })
        .then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
