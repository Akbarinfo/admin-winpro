export type CropArea = { x: number; y: number; width: number; height: number }

/** Formats a canvas can write; anything else (gif, bmp…) becomes PNG. */
const OUTPUT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

/**
 * Cuts `area` (in source pixels, from react-easy-crop) out of `file`.
 * Keeps the source resolution up to `maxSide` and the source format (PNG keeps transparency).
 */
export async function cropImage(file: File, area: CropArea, maxSide = 1600): Promise<File> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const scale = Math.min(1, maxSide / Math.max(area.width, area.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(area.width * scale)
    canvas.height = Math.round(area.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)

    const type = OUTPUT[file.type] ? file.type : 'image/png'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92))
    if (!blob) throw new Error('Could not crop the image')
    const base = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${base}.${OUTPUT[type]}`, { type })
  } finally {
    URL.revokeObjectURL(url)
  }
}
