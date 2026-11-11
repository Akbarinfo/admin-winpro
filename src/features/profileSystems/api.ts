import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import { profileSystemKeys } from '@/shared/lookups/profileSystems'
import type { ProfileSystemValues, SpecificationValues, SystemAccessoryValues } from './schema'
import type {
  Characteristic,
  EnumItem,
  NamedOption,
  ProfileSystem,
  Specification,
  SpecificationRow,
  SystemAccessory,
  SystemAccessoryRow,
} from './types'

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
  save: ({ image, characteristics, ...v }: ProfileSystemValues, id?: string) => {
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

const enumNames = (url: string, signal?: AbortSignal) =>
  api.get<EnumItem[]>(url, { signal }).then((r) => r.data.map((x) => x.name))

/** Products to choose in a specification: searched on the backend, 200 at a time (the old panel's size). */
export const PRODUCT_SEARCH_SIZE = 200

/** The system's profiles (the old ProfileSystemSpecificationLayout and its modal). */
export const specificationKeys = { all: ['profile-system-specification'] as const }

const SPEC = '/v1/profile/system/specification'

export const specificationApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<SpecificationRow>>(`${SPEC}/table`, body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Specification>(`${SPEC}/${id}`, { signal }).then((r) => r.data),

  applicationTypes: (signal?: AbortSignal) => enumNames(`${SPEC}/enum/application/type`, signal),
  sideTypes: (signal?: AbortSignal) => enumNames(`${SPEC}/enum/side/type`, signal),

  /** POST /specification, PUT /specification/{id} — the old modal's body. */
  save: (v: SpecificationValues & { profileSystemId: number }, id?: string) => {
    const body = {
      priority: v.priority,
      productId: v.productId,
      supplierId: v.supplierId,
      sideType: v.sideType,
      applicationType: v.applicationType,
      profileSystemId: v.profileSystemId,
    }
    return id ? api.put(`${SPEC}/${id}`, body) : api.post(SPEC, body)
  },

  remove: (id: number) => api.delete(`${SPEC}/${id}`),

  /** GET /v1/product/article/product?page=0&size=200[&search][&profileType] */
  searchProducts: (search: string, profileType: string | undefined, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: '0', size: String(PRODUCT_SEARCH_SIZE) })
    if (search.trim()) params.set('search', search.trim())
    if (profileType) params.set('profileType', profileType)
    return api
      .get<NamedOption[]>(`/v1/product/article/product?${params}`, { signal })
      .then((r) => r.data)
  },

  /** The chosen product, so the field shows it on edit even if it isn't in the first 200. */
  product: (id: number, signal?: AbortSignal) =>
    api.get<NamedOption>(`/v1/product/article/product/${id}`, { signal }).then((r) => r.data),
}

/** The system's accessories (the old ProfileSystemAccessoriesLayout and its modal). */
export const systemAccessoryKeys = { all: ['profile-system-accessories'] as const }

const ACC = '/v1/profile/system/accessories'

export const systemAccessoryApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<SystemAccessoryRow>>(`${ACC}/table`, body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<SystemAccessory>(`${ACC}/${id}`, { signal }).then((r) => r.data),

  openingTypes: (signal?: AbortSignal) => enumNames(`${ACC}/enum/opening/type`, signal),
  handleTypes: (signal?: AbortSignal) => enumNames(`${ACC}/enum/handle/type`, signal),

  /** GET /v1/accessories/list — the accessories to choose from. */
  accessories: (signal?: AbortSignal) =>
    api.get<NamedOption[]>('/v1/accessories/list', { signal }).then((r) => r.data),

  /**
   * POST /accessories, PUT /accessories/{id}. productId and supplierId aren't in the form: the old
   * modal sent back what the record had (null for a new one).
   */
  save: (v: SystemAccessoryValues & { profileSystemId: number }, id?: string) => {
    const body = {
      accessoryId: v.accessoryId,
      openingType: v.openingType,
      handleType: v.handleType,
      productId: v.productId,
      supplierId: v.supplierId,
      profileSystemId: v.profileSystemId,
    }
    return id ? api.put(`${ACC}/${id}`, body) : api.post(ACC, body)
  },

  /** Moves the accessory one place up in the system's list (a GET, as in the old panel). */
  up: (id: number) => api.get(`${ACC}/up/${id}`),

  remove: (id: number) => api.delete(`${ACC}/${id}`),
}
