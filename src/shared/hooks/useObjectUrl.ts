import { useEffect, useState } from 'react'

/**
 * A temporary `blob:` URL for showing a local file (image preview, crop), freed when the file
 * changes or the component unmounts.
 *
 * Created inside the effect on purpose: with useMemo + cleanup, React StrictMode (dev) runs
 * mount → cleanup → mount, the cleanup revokes the URL and useMemo keeps returning the dead one —
 * the image silently doesn't load.
 */
export function useObjectUrl(file: Blob | null | undefined) {
  // Remembers which file the URL belongs to, so a stale URL is never returned for a new file.
  const [entry, setEntry] = useState<{ file: Blob; url: string }>()

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    // oxlint-disable-next-line react/set-state-in-effect -- syncing with an external resource (blob URL)
    setEntry({ file, url })
    return () => URL.revokeObjectURL(url)
  }, [file])

  return file && entry?.file === file ? entry.url : undefined
}
