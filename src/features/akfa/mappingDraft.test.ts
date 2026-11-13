import { describe, expect, it } from 'vitest'
import {
  EMPTY_DRAFT,
  akfaLabel,
  defaultAkfaQuery,
  draftReducer,
  keysWithChecked,
  toAkfaItem,
  toChanges,
  toTextureRow,
  valueOf,
  type DraftState,
} from './mappingDraft'

const RAMA = { productId: 7, productName: 'Рама 60', article: 'R60' }
const rows = [
  toTextureRow(
    { textureId: 21, textureName: 'Белый', mappedToAkfaProductId: 100, mappedToAkfaName: 'Rama W' },
    RAMA,
  ),
  toTextureRow({ textureId: 22, textureName: 'Дуб', priceOne: 61000, currencySymbol: 'сум' }, RAMA),
]
const loaded = (): DraftState => draftReducer(EMPTY_DRAFT, { type: 'textures', rows })

describe('mapping draft', () => {
  it('starts each texture from the server and keeps only real changes', () => {
    let s = loaded()
    expect(valueOf(s, '7:21')).toBe(100)
    expect(valueOf(s, '7:22')).toBeNull()
    s = draftReducer(s, { type: 'assign', keys: ['7:22'], akfaId: 200 })
    expect(toChanges(s)).toEqual([
      { productId: 7, textureId: 22, akfaProductId: 200, expectedAkfaProductId: null },
    ])
    // back to what the server has: not a change any more
    s = draftReducer(s, { type: 'unlink', key: '7:22' })
    expect(toChanges(s)).toEqual([])
    s = draftReducer(s, { type: 'unlink', key: '7:21' })
    expect(toChanges(s)).toEqual([
      { productId: 7, textureId: 21, akfaProductId: null, expectedAkfaProductId: 100 },
    ])
  })

  it('moves the checked textures together and unchecks them', () => {
    let s = draftReducer(loaded(), { type: 'toggleCheck', key: '7:21' })
    s = draftReducer(s, { type: 'toggleCheck', key: '7:22' })
    expect(keysWithChecked(s, '7:22')).toEqual(['7:21', '7:22'])
    // a texture not checked moves alone
    expect(keysWithChecked(draftReducer(s, { type: 'toggleCheck', key: '7:21' }), '7:21')).toEqual([
      '7:21',
    ])
    s = draftReducer(s, { type: 'assign', keys: keysWithChecked(s, '7:21'), akfaId: 300 })
    expect([valueOf(s, '7:21'), valueOf(s, '7:22')]).toEqual([300, 300])
    expect(s.checked).toEqual({})
  })

  it('learns the server state of textures linked to Akfa products it loads', () => {
    const item = toAkfaItem({
      id: 400,
      externalId: 5001,
      name: 'Stvorka',
      linkedTextures: [
        { productId: 8, productName: 'Створка', textureId: 31, textureName: 'Белый' },
      ],
    })
    const s = draftReducer(EMPTY_DRAFT, { type: 'akfaItems', items: [item] })
    expect(valueOf(s, '8:31')).toBe(400)
    expect(akfaLabel(s.akfa[400])).toBe('5001 Stvorka')
    // a row loaded later doesn't override what the server was already known to have
    const later = draftReducer(s, {
      type: 'textures',
      rows: [toTextureRow({ textureId: 31, textureName: 'Белый' }, { productId: 8 })],
    })
    expect(valueOf(later, '8:31')).toBe(400)
  })

  it('takes the server state after a conflict, keeping the other edits', () => {
    let s = draftReducer(loaded(), { type: 'assign', keys: ['7:21', '7:22'], akfaId: 500 })
    s = draftReducer(s, {
      type: 'serverState',
      rows: [
        toTextureRow({ textureId: 21, mappedToAkfaProductId: 600, mappedToAkfaName: 'X' }, RAMA),
      ],
      conflictKeys: ['7:21'],
    })
    expect(valueOf(s, '7:21')).toBe(600)
    expect(toChanges(s)).toEqual([
      { productId: 7, textureId: 22, akfaProductId: 500, expectedAkfaProductId: null },
    ])
  })

  it('guesses the Akfa search from a product name', () => {
    expect(defaultAkfaQuery('(13) (Prostoe Otkr) Petli Komplekt (FORNAX)')).toBe('Petli')
    expect(defaultAkfaQuery('152 Inja Chovush')).toBe('Inja')
    expect(defaultAkfaQuery(null)).toBe('')
  })

  it('keeps an edit of another product when the server state of a conflict comes', () => {
    const other = toTextureRow({ textureId: 31, textureName: 'Белый' }, { productId: 8 })
    let s = draftReducer(loaded(), { type: 'textures', rows: [other] })
    s = draftReducer(s, { type: 'assign', keys: ['7:21', '8:31'], akfaId: 700 })
    s = draftReducer(s, {
      type: 'serverState',
      rows: [
        toTextureRow({ textureId: 21, mappedToAkfaProductId: 600 }, RAMA),
        toTextureRow({ textureId: 31, textureName: 'Белый' }, { productId: 8 }),
      ],
      conflictKeys: ['7:21'],
    })
    expect(toChanges(s)).toEqual([
      { productId: 8, textureId: 31, akfaProductId: 700, expectedAkfaProductId: null },
    ])
  })
})
