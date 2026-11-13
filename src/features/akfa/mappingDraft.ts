import type { MappingAkfaProduct, MappingChange, TextureOption } from './types'

/**
 * The mapping dialog's state (the old useMappingDraft): each WinPro texture (product + texture)
 * points to at most one Akfa product, several textures to the same one (N:1).
 * `orig` — what the server has (for the rows loaded), `edits` — only what differs from it.
 * A texture's value is its edit if there is one, else its `orig`.
 */

export const textureKey = (productId: number, textureId: number) => `${productId}:${textureId}`

/** Ids compared as text: the server sends some as numbers, some as strings. */
export const idEq = (a: unknown, b: unknown) =>
  a == null ? b == null : b != null && String(a) === String(b)

/** A texture row of the left list. */
export type TextureRow = {
  key: string
  productId: number
  productName: string
  article: string
  textureId: number
  textureName: string
  price: number | null
  currency: string
  akfaProductId: number | null
  akfa: AkfaInfo | null
}

/** What is known of an Akfa product, for its label. */
export type AkfaInfo = { id: number; externalId?: string | number | null; name?: string }

/** An Akfa product of the right list, with the textures the server has linked to it. */
export type AkfaItem = {
  id: number
  externalId: string | number | null
  name: string
  groupName: string
  price: number | null
  currency: string
  linked: {
    key: string
    productId: number
    productName: string
    textureId: number
    textureName: string
  }[]
}

type Meta = { productId: number; productName: string; textureId: number; textureName: string }

export type DraftState = {
  orig: Record<string, number | null>
  edits: Record<string, number | null>
  meta: Record<string, Meta>
  akfa: Record<number, AkfaInfo>
  checked: Record<string, boolean>
}

export const EMPTY_DRAFT: DraftState = { orig: {}, edits: {}, meta: {}, akfa: {}, checked: {} }

/**
 * The search an Akfa list starts with for a product (the old defaultAkfaQuery): the name without
 * its (…) parts, its first word that isn't a number. «(13) (Prostoe Otkr) Petli Komplekt» → «Petli».
 */
export const defaultAkfaQuery = (name?: string | null) =>
  (name ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .trim()
    .split(/[\s—-]+/)
    .filter(Boolean)
    .find((word) => !/^\d+$/.test(word)) ?? ''

/** «22510 T LAM (8017…)» — an Akfa product as the dialog names it. */
export const akfaLabel = (akfa?: AkfaInfo | null) =>
  akfa
    ? [akfa.externalId ?? (akfa.name ? null : `#${akfa.id}`), akfa.name].filter(Boolean).join(' ')
    : ''

export const toTextureRow = (
  option: TextureOption,
  product: { productId: number; productName?: string | null; article?: string | null },
): TextureRow => {
  const akfaId = option.mappedToAkfaProductId ?? null
  return {
    key: textureKey(product.productId, option.textureId),
    productId: product.productId,
    productName: product.productName ?? '',
    article: product.article ?? '',
    textureId: option.textureId,
    textureName: option.textureName ?? '',
    price: option.priceOne ?? option.price ?? null,
    currency: option.currencySymbol || option.currency || '',
    akfaProductId: akfaId,
    akfa: akfaId == null ? null : { id: akfaId, name: option.mappedToAkfaName ?? '' },
  }
}

export const toAkfaItem = (item: MappingAkfaProduct): AkfaItem => ({
  id: item.id,
  externalId: item.externalId ?? null,
  name: item.name ?? '',
  groupName: item.groupName ?? '',
  price: item.price ?? null,
  currency: item.currency ?? '',
  linked: (item.linkedTextures ?? []).map((row) => ({
    key: textureKey(row.productId, row.textureId),
    productId: row.productId,
    productName: row.productName ?? '',
    textureId: row.textureId,
    textureName: row.textureName ?? '',
  })),
})

/** Empty fields don't wipe what's already known. */
const mergeAkfa = (prev: AkfaInfo | undefined, next: AkfaInfo): AkfaInfo => {
  const merged = { ...prev } as AkfaInfo
  for (const [field, value] of Object.entries(next))
    if (value != null && value !== '') (merged as Record<string, unknown>)[field] = value
  return merged
}

const metaOf = (row: Meta): Meta => ({
  productId: row.productId,
  productName: row.productName,
  textureId: row.textureId,
  textureName: row.textureName,
})

/** Edits equal to the server's value aren't changes. */
const prune = (edits: DraftState['edits'], orig: DraftState['orig']) =>
  Object.fromEntries(
    Object.entries(edits).filter(([key, value]) => !idEq(value, orig[key] ?? null)),
  )

export type DraftAction =
  /** Texture rows loaded: their server value counts only for keys not seen before. */
  | { type: 'textures'; rows: TextureRow[] }
  /** Akfa products loaded: the textures linked to them become known too (for the chips' ×). */
  | { type: 'akfaItems'; items: AkfaItem[] }
  | { type: 'assign'; keys: string[]; akfaId: number }
  | { type: 'unlink'; key: string }
  | { type: 'toggleCheck'; key: string }
  /** After a 409: the server's state; the conflicting rows go back to it, other edits stay. */
  | { type: 'serverState'; rows: TextureRow[]; conflictKeys: string[] }

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'textures': {
      const orig = { ...state.orig }
      const meta = { ...state.meta }
      const akfa = { ...state.akfa }
      for (const row of action.rows) {
        meta[row.key] = metaOf(row)
        if (!(row.key in orig)) orig[row.key] = row.akfaProductId
        if (row.akfa) akfa[row.akfa.id] = mergeAkfa(akfa[row.akfa.id], row.akfa)
      }
      return { ...state, orig, meta, akfa, edits: prune(state.edits, orig) }
    }
    case 'akfaItems': {
      const orig = { ...state.orig }
      const meta = { ...state.meta }
      const akfa = { ...state.akfa }
      for (const item of action.items) {
        akfa[item.id] = mergeAkfa(akfa[item.id], {
          id: item.id,
          externalId: item.externalId,
          name: item.name,
        })
        for (const row of item.linked) {
          meta[row.key] = { ...meta[row.key], ...metaOf(row) }
          if (!(row.key in orig)) orig[row.key] = item.id
        }
      }
      return { ...state, orig, meta, akfa, edits: prune(state.edits, orig) }
    }
    case 'assign': {
      const edits = { ...state.edits }
      for (const key of action.keys) edits[key] = action.akfaId
      return { ...state, edits: prune(edits, state.orig), checked: {} }
    }
    case 'unlink':
      return { ...state, edits: prune({ ...state.edits, [action.key]: null }, state.orig) }
    case 'toggleCheck':
      return { ...state, checked: { ...state.checked, [action.key]: !state.checked[action.key] } }
    case 'serverState': {
      const orig = { ...state.orig }
      const meta = { ...state.meta }
      const akfa = { ...state.akfa }
      for (const row of action.rows) {
        orig[row.key] = row.akfaProductId
        meta[row.key] = metaOf(row)
        if (row.akfa) akfa[row.akfa.id] = mergeAkfa(akfa[row.akfa.id], row.akfa)
      }
      const edits = { ...state.edits }
      for (const key of action.conflictKeys) delete edits[key]
      return { ...state, orig, meta, akfa, edits: prune(edits, orig) }
    }
  }
}

/** A texture's value now: its edit, else the server's. */
export const valueOf = (state: DraftState, key: string) =>
  key in state.edits ? state.edits[key] : (state.orig[key] ?? null)

export const checkedKeys = (state: DraftState) =>
  Object.keys(state.checked).filter((key) => state.checked[key])

/** A checked texture dragged (or dropped on) takes all the checked ones with it. */
export const keysWithChecked = (state: DraftState, key: string) =>
  state.checked[key] ? checkedKeys(state) : [key]

/** The body of PUT /mappings/batch: each change with what it was when loaded. */
export const toChanges = (state: DraftState): MappingChange[] =>
  Object.keys(state.edits).map((key) => {
    const meta = state.meta[key]
    return {
      productId: meta?.productId,
      textureId: meta?.textureId,
      akfaProductId: state.edits[key] ?? null,
      expectedAkfaProductId: state.orig[key] ?? null,
    }
  })
