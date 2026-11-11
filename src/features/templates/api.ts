import { api } from '@/shared/api/client'
import type { TableBody, TablePage } from '@/shared/api/table'
import type { TemplateValues } from './schema'
import type { Template, TemplateRow } from './types'

export const templateKeys = { all: ['template'] as const }

/** What the form adds to its values when saving. */
export type TemplateSaveExtra = {
  /** A child's parent (the route's :parentId); absent for a top-level template. */
  parentId?: string
  /** The record's picture, kept unless a new one is chosen. */
  imageId: number | null
  /** The drawing as an image, from the constructor. */
  base64Image: string | null
}

// Endpoints and bodies match the old panel (layout/templates, components/templates/FormTemplate.js).
export const templateApi = {
  table: (body: TableBody, signal?: AbortSignal) =>
    api.post<TablePage<TemplateRow>>('/v1/templates/table', body, { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    api.get<Template>(`/v1/templates/${id}`, { signal }).then((r) => r.data),

  /**
   * multipart «data» (JSON) + «image» + «json» (the drawing file); "" for a file not chosen,
   * as the old form sent. POST and PUT both on /v1/templates; ids are the route's strings.
   */
  save: (values: TemplateValues, extra: TemplateSaveExtra, id?: string) => {
    const data = {
      id: id ?? null,
      name: values.name,
      imageId: extra.imageId,
      // undefined drops out of the JSON, as the old form's absent route param did
      parentId: extra.parentId,
      materialTypeId: values.materialTypeId,
      base64Image: extra.base64Image,
      width: values.width,
      height: values.height,
      area: values.area,
    }
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    form.append('image', values.image ?? '')
    form.append('json', values.json ?? '')
    return id ? api.put('/v1/templates', form) : api.post('/v1/templates', form)
  },

  remove: (id: number) => api.delete(`/v1/templates/${id}`),
}
