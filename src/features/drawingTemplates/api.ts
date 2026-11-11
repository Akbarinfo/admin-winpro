import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { DrawingTemplateValues } from './schema'
import type { DrawingTemplate, DrawingTemplateRow } from './types'

export const drawingTemplateKeys = { all: ['drawing-template'] as const }

const BASE = '/v1/drawing/templete'

// Endpoints and bodies match the old panel (layout/templete, components/templete/FormTemplete.js).
export const drawingTemplateApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<DrawingTemplateRow>>(`${BASE}/table`, body, { signal }).then((r) => r.data),

  /** The old form took the answer's first item: it may come as a list. */
  get: (id: string, signal?: AbortSignal) =>
    api
      .get<DrawingTemplate | DrawingTemplate[]>(`${BASE}/${id}`, { signal })
      .then((r) => (Array.isArray(r.data) ? r.data[0] : r.data)),

  /** The drawing types (plain strings). */
  types: (signal?: AbortSignal) =>
    api.get<string[]>(`${BASE}/types`, { signal }).then((r) => r.data),

  /**
   * multipart «data» (JSON) + «image» + «json» (the drawing file); an empty part for a file not
   * chosen, as the old form sent. POST and PUT both on /v1/drawing/templete.
   */
  save: (values: DrawingTemplateValues, extra: { imageId: number | null }, id?: string) => {
    const data = {
      id: id ?? null,
      name: values.name,
      imageId: extra.imageId,
      type: values.type,
      profileSystemId: values.profileSystemId,
      textureId: values.textureId,
      width: values.width,
      height: values.height,
      area: values.area,
    }
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    // without a new picture the old form sent "null" when adding and "" when editing
    form.append('image', values.image ?? (id ? '' : 'null'))
    form.append('json', values.json ?? '')
    return id ? api.put(BASE, form) : api.post(BASE, form)
  },

  remove: (id: number) => api.delete(`${BASE}/${id}`),
}
