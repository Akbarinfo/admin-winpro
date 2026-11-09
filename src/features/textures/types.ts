/** A texture (laminate film / colour) as returned by /v1/texture. */
export type Texture = {
  id: number
  name: string
  /** «#a8743d» */
  color: string
  priority: number
  imageId?: number | null
  /** Laminated on both sides */
  isDouble?: boolean
}

/** A texture that goes with another one, from /v1/texture/matching. */
export type TextureMatch = {
  id: number
  textureId?: number
  matchingTextureId: number
  matchingSideType: string
  matchingTextureDto?: { name: string; color: string; imageId?: number | null } | null
}
