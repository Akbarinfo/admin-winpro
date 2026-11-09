/** A texture's colour as a small square with its hex code. */
export function ColorSwatch({ color }: { color?: string | null }) {
  if (!color) return <>—</>
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-line-strong"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted uppercase tabular-nums">{color}</span>
    </span>
  )
}
