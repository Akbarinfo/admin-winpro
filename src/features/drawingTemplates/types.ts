/** A row of POST /v1/drawing/templete/table. */
export type DrawingTemplateRow = {
  id: number
  imageId?: number | null
  name?: string | null
  profileSystemName?: string | null
  textureName?: string | null
  type?: string | null
  width?: number | null
  height?: number | null
}

/** GET /v1/drawing/templete/{id} (the old form read it as a list's first item). */
export type DrawingTemplate = {
  id: number
  name?: string | null
  imageId?: number | null
  type?: string | null
  profileSystemId?: number | null
  textureId?: number | null
  width?: number | null
  height?: number | null
  area?: number | null
  templeteJson?: string | null
}
