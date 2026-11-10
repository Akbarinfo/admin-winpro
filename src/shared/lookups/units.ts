import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** A unit of measure as returned by /v1/unit/list. */
export type UnitOption = { id: number; name: string; shortName?: string | null }

/** Shared with the «Единицы» section: saving there refreshes these lists too. */
export const unitKeys = { all: ['unit'] as const }

export function useUnits() {
  return useQuery({
    queryKey: [...unitKeys.all, 'list'],
    queryFn: ({ signal }) => api.get<UnitOption[]>('/v1/unit/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
