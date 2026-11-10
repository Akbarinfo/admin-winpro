import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** A profile system and its subsystems, from /v1/profile/system/list/tree. */
export type ProfileSystemNode = {
  id: number
  name: string
  children?: ProfileSystemNode[] | null
}

export const profileSystemKeys = { all: ['profile-system'] as const }

export function useProfileSystemTree() {
  return useQuery({
    queryKey: [...profileSystemKeys.all, 'tree'],
    queryFn: ({ signal }) =>
      api.get<ProfileSystemNode[]>('/v1/profile/system/list/tree', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
