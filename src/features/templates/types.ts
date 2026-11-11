/** A row of POST /v1/templates/table. */
export type TemplateRow = {
  id: number
  parentId?: number | null
  imageId?: number | null
  name?: string | null
  /** The material type comes either nested or as a name (the old list read both). */
  materialType?: { name?: string | null } | null
  materialTypeName?: string | null
  width?: number | null
  height?: number | null
}

/** GET /v1/templates/{id}. */
export type Template = {
  id: number
  name?: string | null
  imageId?: number | null
  parentId?: number | null
  materialTypeId?: number | null
  width?: number | null
  height?: number | null
  area?: number | null
  /** The drawing, opened in the constructor. */
  templeteJson?: string | null
}

/** The material type's name, as the old list read it. */
export const typeName = (row: TemplateRow) => row.materialType?.name || row.materialTypeName || ''
