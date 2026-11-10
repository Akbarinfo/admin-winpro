import { useState } from 'react'

/**
 * A texture at a glance, before its name: its picture, or its colour when it has none
 * (or the picture fails to load). Decorative — the name next to it is what's read out.
 */
export function TextureMark({ src, color }: { src?: string; color?: string | null }) {
  const [failed, setFailed] = useState<string>()
  if (src && failed !== src)
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(src)}
        className="size-5 shrink-0 rounded-full border border-line object-cover"
      />
    )
  return (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 rounded-full border border-line-strong bg-surface-2"
      style={color ? { backgroundColor: color } : undefined}
    />
  )
}
