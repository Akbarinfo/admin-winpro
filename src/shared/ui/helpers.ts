import type { TableSort } from '@/shared/api/table'

// Pure helpers of shared/ui components, kept apart so component files export only components.

/** Clicking a column sorts ascending; clicking it again flips the direction. */
export const nextSort = (column: string, current?: TableSort): TableSort =>
  current?.column === column && current.dir === 'asc'
    ? { column, dir: 'desc' }
    : { column, dir: 'asc' }

/** Page buttons to show: first, last, current ±1, with 'gap' for skipped runs. */
export function getPageItems(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set(
    [1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount),
  )
  // Near an edge, show a few more pages instead of a gap of one.
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= pageCount - 2)
    [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['gap', p] as const) : [p]))
}

/** '' '-' '.' → null (still typing), otherwise the number. Accepts a comma as decimal separator. */
export const parseNumber = (text: string) => {
  const normalized = text.replace(/\s/g, '').replace(',', '.')
  if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.')
    return null
  return Number(normalized)
}

/**
 * Number text as shown in inputs: thousands grouped with a space, comma for decimals.
 * "12648.5" → "12 648,5". Partial input is kept: "1000," → "1 000,".
 */
export function formatNumberText(raw: string) {
  const plain = raw.replace(/\s/g, '').replace('.', ',')
  const sign = plain.startsWith('-') ? '-' : ''
  const [int, frac] = plain.slice(sign.length).split(',')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return sign + grouped + (frac === undefined ? '' : `,${frac}`)
}

/** A number as input text, padded to at least `minDecimals` digits after the comma: (1.5, 2) → "1,50". */
export function numberToText(value: number, minDecimals = 0) {
  // toLocaleString avoids exponent notation for tiny rates (0.0000721, not 7.21e-5).
  const plain = value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
  const [int, frac = ''] = plain.split('.')
  const digits = frac.length >= minDecimals ? frac : frac.padEnd(minDecimals, '0')
  return formatNumberText(digits ? `${int}.${digits}` : int)
}

/** Caret index in `text` right after the first `count` non-space characters. */
export function caretAfter(text: string, count: number) {
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (seen === count) return i
    if (text[i] !== ' ') seen++
  }
  return text.length
}
