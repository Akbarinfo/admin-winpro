import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** A supplier as returned by /v1/supplier/list. */
export type SupplierOption = { id: number; name: string }

/** Shared with the «Поставщики» section: saving there refreshes these lists too. */
export const supplierKeys = { all: ['supplier'] as const }

export function useSuppliers() {
  return useQuery({
    queryKey: [...supplierKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<SupplierOption[]>('/v1/supplier/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
