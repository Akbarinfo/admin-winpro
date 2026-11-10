import { api } from '@/shared/api/client'
import { multipartBody } from '@/shared/api/files'
import type { TableBody, TablePage } from '@/shared/api/table'
import { todayIso } from '@/shared/lib/format'
import type { MatchValues, TextureValues } from './schema'
import type { Texture, TextureMatch } from './types'

export const textureKeys = { all: ['texture'] as const }
/** Matches of one texture, under the texture key so a texture save refreshes them too. */
export const matchKeys = {
  of: (textureId: number) => [...textureKeys.all, 'matches', textureId] as const,
}

// Endpoints and bodies match the old panel (layout/texture, components/texture/*, services/textureService.js).
export const textureApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Texture>>('/v1/texture/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Texture>(`/v1/texture/${id}`, { signal }).then((r) => r.data),

  /** All textures, for choosing a matching one. */
  list: (signal?: AbortSignal) =>
    api.get<Texture[]>('/v1/texture/list', { signal }).then((r) => r.data),

  /** multipart «data» + «image»; POST and PUT both on /v1/texture. */
  save: ({ image, ...values }: TextureValues, id?: string) => {
    const data = {
      id: id ?? null,
      name: values.name,
      color: values.color,
      priority: values.priority,
      isDouble: values.isDouble,
      imageId: values.imageId,
    }
    const body = multipartBody(data, image)
    return id ? api.put('/v1/texture', body) : api.post('/v1/texture', body)
  },

  remove: (id: number) => api.delete(`/v1/texture/${id}`),
}

export const matchApi = {
  list: (textureId: number, signal?: AbortSignal) =>
    api
      .get<TextureMatch[]>(`/v1/texture/matching/list/${textureId}`, { signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<TextureMatch>(`/v1/texture/matching/${id}`, { signal }).then((r) => r.data),

  sideTypes: (signal?: AbortSignal) =>
    api.get<string[]>('/v1/texture/matching/matching-site-type', { signal }).then((r) => r.data),

  /**
   * As the old panel (components/texture/TextureMatchingModal.js), both on /v1/texture/matching:
   * - new: { id: null, textureId, matchingTextureId, matchingSideType, price: '', date: today }
   * - edit: { id, textureId, matchingTextureId, matchingSideType } — textureId is required here,
   *   without it the backend detaches the match from the texture and it vanishes from the list.
   */
  save: (textureId: number, values: MatchValues, id?: string) =>
    id
      ? api.put('/v1/texture/matching', { id: Number(id), textureId, ...values })
      : api.post('/v1/texture/matching', {
          id: null,
          textureId,
          ...values,
          price: '',
          date: todayIso(),
        }),

  remove: (id: number) => api.delete(`/v1/texture/matching/${id}`),
}
