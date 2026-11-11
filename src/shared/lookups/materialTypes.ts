import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

export type MaterialTypeOption = { id: number; name: string }

/** Shared with the «Виды материала» section: saving there refreshes these lists too. */
export const materialTypeKeys = { all: ['materialType'] as const }

export function useMaterialTypes() {
  return useQuery({
    queryKey: [...materialTypeKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<MaterialTypeOption[]>('/v1/material-type/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
