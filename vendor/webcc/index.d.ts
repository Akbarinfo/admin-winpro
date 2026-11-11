// Only what the admin panel uses (the package ships no types).

export interface WebccShapeManager {
  enLangMode: boolean
  europeanStandard: boolean
  dimFontSize: number
  strictWheel: boolean
  labelFontSize: number
  /** Size of the drawn window, mm; area, m². */
  width: number
  height: number
  area: number
  glassSpec?: { id?: number; textureId?: number } | null
  profileSystem?: { id: number } | null
  mainTextureId?: number | null
  /** Opens a saved drawing (its JSON text). */
  openFile(json: string, dim?: boolean): void
  /** The drawing as an image without dimensions (base64), as templates save it. */
  toSimpleNoDimData(): string
}

export class Runtime {
  /** Draws into the element with this id («webcc» by default). */
  constructor(token: string, containerId?: string)
  shapeManager: WebccShapeManager
  /** The Konva stage it draws on. */
  stage?: { destroy(): void }
  setCanvasScale(x: number, y: number): void
}
