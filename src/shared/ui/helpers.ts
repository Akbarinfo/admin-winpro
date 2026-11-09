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

/**
 * Splits text into plain and matching parts for search highlighting (case-insensitive).
 * ('Рама 60 мм', 'ра') → [{ text: 'Ра', match: true }, { text: 'ма 60 мм', match: false }]
 */
export function splitByQuery(text: string, query: string) {
  const q = query.trim()
  if (!q || !text) return [{ text, match: false }]
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text
    .split(new RegExp(`(${escaped})`, 'gi'))
    .filter(Boolean)
    .map((part) => ({ text: part, match: part.toLowerCase() === q.toLowerCase() }))
}

/** What a phone field needs to know about a country (a subset of /v1/country/list). */
export type PhoneFormat = { phoneCode: string; phoneFormat: string }

const onlyDigits = (v: string) => v.replace(/\D/g, '')

/** The country of a stored number by its code (longest code first); the first one when none matches. */
export function detectPhoneCountry<T extends PhoneFormat>(
  value: string | null | undefined,
  countries: T[],
): T {
  const digits = onlyDigits(value ?? '')
  const found = [...countries]
    .sort((a, b) => onlyDigits(b.phoneCode).length - onlyDigits(a.phoneCode).length)
    .find((c) => digits && digits.startsWith(onlyDigits(c.phoneCode)))
  return found ?? countries[0]
}

/** National digits of a stored number: «+998 (90) 123 45 67» → «901234567». */
export function phoneDigits(value: string | null | undefined, country: PhoneFormat) {
  const digits = onlyDigits(value ?? '')
  const code = onlyDigits(country.phoneCode)
  return digits.startsWith(code) ? digits.slice(code.length) : digits
}

/**
 * Typed or pasted text → the value in the country's format: «+998 (90) 1». The format holds the code,
 * so text that starts with «+» (the field's own value, a pasted number) has the code dropped first;
 * plain digits are the national number. A separator appears only once a digit follows it.
 * Returns '' when there are no digits.
 */
export function formatPhone(text: string, country: PhoneFormat) {
  const code = onlyDigits(country.phoneCode)
  const pattern = country.phoneFormat
  let digits = onlyDigits(text)
  if (text.trim().startsWith('+') && digits.startsWith(code)) digits = digits.slice(code.length)
  digits = digits.slice(0, pattern.split('#').length - 1)
  if (!digits) return ''

  let out = ''
  let used = 0
  for (const ch of pattern) {
    if (ch === '#') {
      if (used === digits.length) break
      out += digits[used++]
    } else if (used < digits.length) {
      out += ch
    }
  }
  return out
}

/** Whether the number has all the digits its country's format needs. */
export function isPhoneComplete(value: string, countries: PhoneFormat[]) {
  const country = detectPhoneCountry(value, countries)
  return phoneDigits(value, country).length === country.phoneFormat.split('#').length - 1
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
