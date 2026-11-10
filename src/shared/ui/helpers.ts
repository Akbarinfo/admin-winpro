import type { TableSort } from '@/shared/api/table'
import type { Key } from 'react'

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

/** How TreeSelect reads a node of any shape. */
export type TreeAccess<T> = {
  getKey: (node: T) => Key
  getLabel: (node: T) => string
  getChildren: (node: T) => T[] | null | undefined
}

export type TreeRow<T> = {
  node: T
  /** 1 for roots */
  level: number
  hasChildren: boolean
  expanded: boolean
}

/**
 * Tree rows to show, depth first. Without a query: children only under expanded nodes.
 * With a query: nodes whose label contains it, plus their ancestors, all open.
 */
export function visibleTreeRows<T>(
  roots: T[],
  access: TreeAccess<T>,
  expanded: ReadonlySet<Key>,
  query = '',
): TreeRow<T>[] {
  const q = query.trim().toLowerCase()
  const rows: TreeRow<T>[] = []

  if (!q) {
    const walk = (nodes: T[], level: number) => {
      for (const node of nodes) {
        const children = access.getChildren(node) ?? []
        const open = children.length > 0 && expanded.has(access.getKey(node))
        rows.push({ node, level, hasChildren: children.length > 0, expanded: open })
        if (open) walk(children, level + 1)
      }
    }
    walk(roots, 1)
    return rows
  }

  // Returns the rows of a subtree that has a match, or null.
  const match = (node: T, level: number): TreeRow<T>[] | null => {
    const inner = (access.getChildren(node) ?? []).flatMap((c) => match(c, level + 1) ?? [])
    const self = access.getLabel(node).toLowerCase().includes(q)
    if (!self && inner.length === 0) return null
    return [{ node, level, hasChildren: inner.length > 0, expanded: inner.length > 0 }, ...inner]
  }
  return roots.flatMap((r) => match(r, 1) ?? [])
}

/** Every node of the tree by key. */
export function indexTree<T>(roots: T[], access: TreeAccess<T>) {
  const map = new Map<Key, T>()
  const walk = (nodes: T[]) => {
    for (const node of nodes) {
      map.set(access.getKey(node), node)
      walk(access.getChildren(node) ?? [])
    }
  }
  walk(roots)
  return map
}

/** Keys of the nodes above any of `keys` — opened so the chosen nodes are visible. */
export function ancestorKeys<T>(roots: T[], access: TreeAccess<T>, keys: Iterable<Key>) {
  const wanted = new Set(keys)
  const result = new Set<Key>()
  const walk = (nodes: T[], path: Key[]): boolean => {
    let found = false
    for (const node of nodes) {
      const key = access.getKey(node)
      const below = walk(access.getChildren(node) ?? [], [...path, key])
      if (below || wanted.has(key)) {
        found = true
        path.forEach((k) => result.add(k))
      }
      if (below) result.add(key)
    }
    return found
  }
  walk(roots, [])
  return result
}

/** How much of a node is chosen: every leaf under it, some of them, or none. */
export type CheckState = 'all' | 'some' | 'none'

/** Keys of the leaves under a node; a node without children is its own leaf. */
export function leafKeys<T>(node: T, access: TreeAccess<T>): Key[] {
  const children = access.getChildren(node) ?? []
  return children.length ? children.flatMap((c) => leafKeys(c, access)) : [access.getKey(node)]
}

/**
 * Chosen keys as leaves only: a parent in the list stands for all of its leaves
 * (old records may hold parent ids). Keys not in the tree — or before it loads — stay as they are.
 */
export function toLeafKeys<T>(index: ReadonlyMap<Key, T>, access: TreeAccess<T>, keys: Key[]) {
  const result = new Set<Key>()
  for (const key of keys) {
    const node = index.get(key)
    for (const leaf of node ? leafKeys(node, access) : [key]) result.add(leaf)
  }
  return [...result]
}

/** Check state of every node, from the chosen leaves: a parent is 'all' when every leaf under it is chosen. */
export function treeCheckStates<T>(roots: T[], access: TreeAccess<T>, leaves: ReadonlySet<Key>) {
  const states = new Map<Key, CheckState>()
  const walk = (node: T): CheckState => {
    const children = access.getChildren(node) ?? []
    let state: CheckState
    if (!children.length) {
      state = leaves.has(access.getKey(node)) ? 'all' : 'none'
    } else {
      const inner = children.map(walk)
      state = inner.every((s) => s === 'all')
        ? 'all'
        : inner.every((s) => s === 'none')
          ? 'none'
          : 'some'
    }
    states.set(access.getKey(node), state)
    return state
  }
  roots.forEach(walk)
  return states
}

/** The top-most fully chosen nodes: shown as one chip instead of every leaf under them. */
export function topCheckedNodes<T>(
  roots: T[],
  access: TreeAccess<T>,
  states: ReadonlyMap<Key, CheckState>,
): T[] {
  return roots.flatMap((node) => {
    const state = states.get(access.getKey(node))
    if (state === 'all') return [node]
    if (state === 'some') return topCheckedNodes(access.getChildren(node) ?? [], access, states)
    return []
  })
}
