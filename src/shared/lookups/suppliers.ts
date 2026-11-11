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

/**
 * All suppliers by name, through the table endpoint (length 1000, name ASC) — the request the old
 * panel's user and profile-system forms made instead of /list.
 */
export function useSuppliersByName() {
  return useQuery({
    queryKey: [...supplierKeys.all, 'by-name'],
    queryFn: ({ signal }) =>
      api
        .post<{ data: SupplierOption[] }>(
          '/v1/supplier/table',
          {
            draw: 1,
            start: 0,
            length: 1000,
            recordsTotal: 0,
            columns: [],
            order: [{ column: 'name', dir: 'ASC' }],
            search: { value: '', regex: false },
            filter: {},
          },
          { signal },
        )
        .then((r) => r.data.data.map((s) => ({ id: s.id, name: s.name }))),
    staleTime: 10 * 60_000,
  })
}
