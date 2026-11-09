import { splitByQuery } from './helpers'

/**
 * Marks the parts of `text` that match the current search.
 * DataTable does this for plain cells when given `highlight`; use it inside custom `render` cells.
 */
export function Highlight({ text, query }: { text: string | null | undefined; query?: string }) {
  const value = text ?? ''
  if (!query?.trim()) return <>{value}</>
  return (
    <>
      {splitByQuery(value, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-[3px] bg-highlight px-px text-fg">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  )
}
