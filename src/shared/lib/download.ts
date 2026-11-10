export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Saves a blob as a file: the browser's «download» of a temporary link. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Some browsers start the download after this tick: free the URL a moment later.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A file the backend sent as base64 text (e.g. the rows an import couldn't take). */
export function base64ToBlob(base64: string, type: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type })
}
