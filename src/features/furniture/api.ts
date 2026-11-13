import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { ParameterEndpoint } from '@/shared/parameters'
import type { AccessorySpecValues, AccessoryValues, SideLimitValues } from './schema'
import type {
  Accessory,
  AccessorySide,
  AccessorySpecification,
  EnumOption,
  SideLimit,
} from './types'

const all = ['furniture'] as const
const specs = [...all, 'specs'] as const
export const furnitureKeys = {
  all,
  detail: (id: string) => [...all, 'detail', id] as const,
  /** Apart from `all`: saving a fitting doesn't need its enums or the copy search again. */
  enums: ['furniture-enums'] as const,
  search: ['furniture-search'] as const,
  sides: [...all, 'sides'] as const,
  /** Every specification level; deleting a row refreshes the levels under it too. */
  specs,
  /**
   * One key per level (main and track apart): the tables and edited rows of different levels must
   * never share a cache entry — the same filter or id would show one level's rows in another.
   */
  level: (level: 'main' | 'track' | 'depend' | 'inner') => [...specs, level] as const,
  limits: [...all, 'limits'] as const,
}

const A = '/v1/accessories'

/** The main and track specifications differ only in their path (the old SPEC_TABS). */
export const SPEC_TABS = {
  main: { path: `${A}/main/specification`, showDefault: true },
  track: { path: `${A}/track/specification`, showDefault: false },
} as const
export type SpecTab = keyof typeof SPEC_TABS

const DEPEND = `${A}/dependent/specification`
const INNER = `${A}/inner/specification`
const LIMIT = `${A}/specification/limit/side`

const specRows = (url: string, body: TableBody, signal?: AbortSignal) =>
  api.post<TablePage<AccessorySpecification>>(url, body, { signal }).then((r) => r.data)

const getSpec = (url: string, signal?: AbortSignal) =>
  api.get<AccessorySpecification>(url, { signal }).then((r) => r.data)

/** POST without id, PUT with it — on the same path (the old saveItem). */
const saveOn = (path: string, id: string | undefined, body: object) => {
  const full = { id: id === undefined ? null : Number(id), ...body }
  return id === undefined ? api.post(path, full) : api.put(path, full)
}

// Endpoints and bodies match the old panel (layout/accessories, components/accessories).
// Numbers go as numbers; the old uncontrolled inputs sent their text ("" when empty → null here).
export const furnitureApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<Accessory>>(`${A}/table`, body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Accessory>(`${A}/${id}`, { signal }).then((r) => r.data),

  /** Create without id (POST), update with the URL's id (PUT) — both on /v1/accessories. */
  save: (values: AccessoryValues, id?: string) => {
    const body = { id: id ?? null, ...values }
    return id ? api.put(A, body) : api.post(A, body)
  },

  remove: (id: number) => api.delete(`${A}/${id}`),

  copy: (id: number) => api.post(`${A}/copy/${id}`),

  /** type | openingtype | openingside */
  enum: (name: 'type' | 'openingtype' | 'openingside', signal?: AbortSignal) =>
    api.get<EnumOption[]>(`${A}/enum/${name}`, { signal }).then((r) => r.data ?? []),

  /** Accessories to copy a specification row to: name ASC, 200 at a time (the old searchAccessories). */
  search: (search: string, signal?: AbortSignal) =>
    api
      .post<TablePage<Accessory>>(
        `${A}/table`,
        {
          draw: 1,
          start: 0,
          length: 200,
          recordsTotal: 0,
          columns: [],
          order: [{ column: 'name', dir: 'ASC' }],
          search: { value: search, regex: true },
          filter: {},
        },
        { signal },
      )
      .then((r) => r.data.data ?? []),

  sides: (accessoryId: number, signal?: AbortSignal) =>
    api.get<AccessorySide[]>(`${A}/side/${accessoryId}/list`, { signal }).then((r) => r.data ?? []),

  sideFunctions: (signal?: AbortSignal) =>
    api.get<EnumOption[]>(`${A}/side/enum/hanglesidefunc`, { signal }).then((r) => r.data ?? []),

  /** The whole side row goes back with its new function (PUT, as the old modal did). */
  saveSide: (side: AccessorySide, hangleSideFunc: string) =>
    api.put(`${A}/side`, { ...side, hangleSideFunc }),

  mainSpecs: (tab: SpecTab, body: TableBody, signal?: AbortSignal) =>
    specRows(`${SPEC_TABS[tab].path}/table`, body, signal),
  mainSpec: (tab: SpecTab, id: string, signal?: AbortSignal) =>
    getSpec(`${SPEC_TABS[tab].path}/${id}`, signal),
  /** «default» is sent false on the track tab, which has no such field. */
  saveMainSpec: (tab: SpecTab, accessoriesId: string, v: AccessorySpecValues, id?: string) =>
    saveOn(SPEC_TABS[tab].path, id, {
      productId: v.productId,
      accessoriesId,
      default: SPEC_TABS[tab].showDefault ? v.default : false,
      textureId: v.textureId,
    }),
  removeMainSpec: (tab: SpecTab, id: number) => api.delete(`${SPEC_TABS[tab].path}/${id}`),
  /** The old panel copied with a GET. */
  copyMainSpec: (tab: SpecTab, id: number) => api.get(`${SPEC_TABS[tab].path}/copy/${id}`),
  /** The row copied into another accessory; the answer may list links that weren't found. */
  copyToAccessory: (tab: SpecTab, specificationId: number, accessoriesId: number) =>
    api
      .post<{ warnings?: string[]; data?: { warnings?: string[] } }>(
        `${SPEC_TABS[tab].path}/copy/to-accessories`,
        { specificationId, accessoriesId },
      )
      .then((r) => r.data?.data?.warnings ?? r.data?.warnings ?? []),

  dependSpecs: (body: TableBody, signal?: AbortSignal) => specRows(`${DEPEND}/table`, body, signal),
  dependSpec: (id: string, signal?: AbortSignal) => getSpec(`${DEPEND}/${id}`, signal),
  saveDependSpec: (mainId: number, accessoriesId: string, v: AccessorySpecValues, id?: string) =>
    saveOn(DEPEND, id, {
      productId: v.productId,
      accessoriesSpecificationId: mainId,
      accessoriesId,
      textureId: v.textureId,
    }),
  removeDependSpec: (id: number) => api.delete(`${DEPEND}/${id}`),

  innerSpecs: (body: TableBody, signal?: AbortSignal) => specRows(`${INNER}/table`, body, signal),
  innerSpec: (id: string, signal?: AbortSignal) => getSpec(`${INNER}/${id}`, signal),
  saveInnerSpec: (dependId: number, v: AccessorySpecValues, id?: string) =>
    saveOn(INNER, id, {
      productId: v.productId,
      accessoriesSpecificationId: dependId,
      textureId: v.textureId,
    }),
  removeInnerSpec: (id: number) => api.delete(`${INNER}/${id}`),

  limits: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<SideLimit>>(`${LIMIT}/table`, body, { signal }).then((r) => r.data),
  limit: (id: string, signal?: AbortSignal) =>
    api.get<SideLimit>(`${LIMIT}/${id}`, { signal }).then((r) => r.data),
  /** Saved under accessoriesSpecificationId, though the table filters by dependSpecificationId (as before). */
  saveLimit: (specId: number, v: SideLimitValues, id?: string) =>
    saveOn(LIMIT, id, { ...v, accessoriesSpecificationId: specId }),
  removeLimit: (id: number) => api.delete(`${LIMIT}/${id}`),
}

/** An accessory's own parameters: a plain list, no table (the old AccessoriesParameter). */
export const ACCESSORY_PARAMETERS: ParameterEndpoint = {
  base: `${A}/parameter`,
  enumUrl: `${A}/parameter/enum/type`,
  kindField: 'accessoriesParameterType',
  parentField: 'accessoriesId',
  filterField: 'accessoriesId',
  list: (accessoryId) => `${A}/parameter/list/${accessoryId}`,
}

/**
 * A specification row's parameters. The old page always used the main specification's endpoint,
 * whichever level (main, track, dependent, inner) the row was chosen from; kept as is.
 */
export const SPEC_PARAMETERS: ParameterEndpoint = {
  base: `${A}/main/specification/parameter`,
  enumUrl: `${A}/main/specification/parameter/enum/type`,
  kindField: 'accessoriesSpecParameterType',
  parentField: 'accessoriesSpecificationId',
  filterField: 'accessoriesSpecificationId',
}
