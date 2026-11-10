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

/** A subsystem from the flat /v1/profile/system/list, with its parent system's name. */
export type ProfileSystemOption = { id: number; name: string; parentName?: string | null }

/** «Termo 70 - Akfa», as the old filters showed them. */
export const profileSystemLabel = (s: ProfileSystemOption) =>
  s.parentName ? `${s.name} - ${s.parentName}` : s.name

export function useProfileSystems() {
  return useQuery({
    queryKey: [...profileSystemKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<ProfileSystemOption[]>('/v1/profile/system/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}
