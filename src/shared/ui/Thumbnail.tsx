import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/** Small image in a table cell (logo, texture). Shows an icon when there is no image or it fails to load. */
export function Thumbnail({ src, className }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState<string>()
  const ok = src && failed !== src
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface-2 text-faint',
        className,
      )}
    >
      {ok ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailed(src)}
        />
      ) : (
        <ImageOff size={16} aria-hidden="true" />
      )}
    </span>
  )
}
