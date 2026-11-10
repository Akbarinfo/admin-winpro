import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** A product series as returned by /v1/product/series/list. */
export type SeriesOption = { id: number; name: string }

/** Shared with the «Серии» section: saving there refreshes these lists too. */
export const seriesKeys = { all: ['series'] as const }

export function useSeriesList() {
  return useQuery({
    queryKey: [...seriesKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<SeriesOption[]>('/v1/product/series/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
