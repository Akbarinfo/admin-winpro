import { api } from '@/shared/api/client'
import { profileSystemKeys } from '@/shared/lookups/profileSystems'
import type { ProfileSystemValues } from './schema'
import type { Characteristic, EnumItem, ProfileSystem } from './types'

// Same key as the shared profile-system lookups (the tree, the flat list in product filters):
// saving here refreshes them everywhere.
export { profileSystemKeys }

// Endpoints and bodies match the old panel (layout/profileSystem, components/profileSystem).
export const profileSystemApi = {
  get: (id: string, signal?: AbortSignal) =>
    api.get<ProfileSystem>(`/v1/profile/system/${id}`, { signal }).then((r) => r.data),

  slidingTypes: (signal?: AbortSignal) =>
    api
      .get<EnumItem[]>('/v1/profile/system/enum/sliding/type', { signal })
      .then((r) => r.data.map((x) => x.name)),

  clientScopes: (signal?: AbortSignal) =>
    api
      .get<EnumItem[]>('/v1/profile/system/enum/client/scope', { signal })
      .then((r) => r.data.map((x) => x.name)),

  /**
   * multipart «data» (JSON) + «file» (the picture, "null" without a new one); POST and PUT both on
   * /v1/profile/system. The id is the tree's string, as the old modal sent it. On edit the old modal
   * never loaded the parent and sent parentId null — kept: the backend doesn't move a system on update.
   */
  save: ({ image, ...v }: ProfileSystemValues, characteristics: Characteristic[], id?: string) => {
    const data = {
      id: id ?? null,
      name: v.name,
      parentId: id ? null : v.parentId,
      defaultGlassId: v.defaultGlassId,
      defaultPanelId: v.defaultPanelId,
      fillingGroupId: v.fillingGroupId,
      materialTypeId: v.materialTypeId,
      isVisible: v.isVisible,
      isDefault: v.isDefault,
      supplierId: v.supplierId,
      visibility: v.visibility,
      slidingType: v.slidingType,
      isTesting: v.isTesting,
      clientScope: v.clientScope,
      // empty — the global sash clearance (12)
      sashClearance: v.sashClearance,
      // only a simple sliding system has its own limit; a warm one counts it from the frames
      maxTrackCount: v.slidingType === 'FRAME_PER_TRACK' ? v.maxTrackCount : null,
      specifications: characteristics,
    }
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    form.append('file', image ?? 'null')
    const request = id
      ? api.put<{ id?: number }>('/v1/profile/system', form)
      : api.post<{ id?: number }>('/v1/profile/system', form)
    return request.then((r) => r.data)
  },

  /** The characteristics: PUT with the saved id, POST without (the old saveItem). */
  saveFullInfo: (
    fullInfoId: number | null,
    profileSystemId: number,
    characteristics: Characteristic[],
  ) => {
    const body = { id: fullInfoId, profileSystemId, characteristics }
    return fullInfoId
      ? api.put('/v1/profile-system-full-info', body)
      : api.post('/v1/profile-system-full-info', body)
  },

  remove: (id: number) => api.delete(`/v1/profile/system/${id}`),
}
