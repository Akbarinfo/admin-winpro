import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** A texture (film / colour) from /v1/texture/list. */
export type TextureOption = {
  id: number
  name: string
  color?: string | null
  imageId?: number | null
}

/** Shared with the «Текстуры» section: saving there refreshes these lists too. */
export const textureKeys = { all: ['texture'] as const }

export function useTextures() {
  return useQuery({
    queryKey: [...textureKeys.all, 'list'],
    queryFn: ({ signal }) =>
      api.get<TextureOption[]>('/v1/texture/list', { signal }).then((r) => r.data),
    staleTime: 10 * 60_000,
  })
}

/** The textures a profile system comes in (/v1/texture/list/system/{id}); none until one is chosen. */
export function useSystemTextures(systemId: number | null) {
  return useQuery({
    queryKey: [...textureKeys.all, 'system', systemId],
    queryFn: ({ signal }) =>
      api
        .get<TextureOption[]>(`/v1/texture/list/system/${systemId}`, { signal })
        .then((r) => r.data),
    enabled: systemId !== null,
    staleTime: 10 * 60_000,
  })
}

/** The textures a product comes in (/v1/texture/list/by/productId/{id}): one query, shared by every picker. */
export const productTexturesQuery = (productId: number) => ({
  queryKey: [...textureKeys.all, 'product', productId] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    api
      .get<TextureOption[]>(`/v1/texture/list/by/productId/${productId}`, { signal })
      .then((r) => r.data),
  staleTime: 60_000,
})

/** A product's textures; none until one is chosen. */
export function useProductTextures(productId: number | null) {
  return useQuery({
    ...productTexturesQuery(productId ?? 0),
    enabled: productId !== null,
  })
}
