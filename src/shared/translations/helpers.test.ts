import { describe, expect, it } from 'vitest'
import { buildTranslationRows, planTranslationSave, toggleTranslationRow } from './helpers'

const FIELDS = [
  { key: 'NAME', label: 'Name' },
  { key: 'NAME_IN_CATALOG', label: 'Catalog' },
]
const COUNTRIES = [
  { id: 1, name: 'Kazakhstan' },
  { id: 2, name: 'Uzbekistan' },
]
const SAVED = [
  { id: 10, entityType: 'PRODUCT', entityId: 5, countryId: 1, field: 'NAME', value: 'Рама KZ' },
]

describe('buildTranslationRows', () => {
  it('makes a row per country and enables those with saved texts', () => {
    const rows = buildTranslationRows(COUNTRIES, FIELDS, SAVED)
    expect(rows[0]).toEqual({
      countryId: 1,
      countryName: 'Kazakhstan',
      enabled: true,
      values: { NAME: { id: 10, value: 'Рама KZ' }, NAME_IN_CATALOG: { id: null, value: '' } },
    })
    expect(rows[1].enabled).toBe(false)
  })
})

describe('toggleTranslationRow', () => {
  it('fills empty fields with the record texts when turned on', () => {
    const [kz, uz] = buildTranslationRows(COUNTRIES, FIELDS, SAVED)
    const on = toggleTranslationRow(uz, { NAME: 'Рама', NAME_IN_CATALOG: 'Рама кат' })
    expect(on.enabled).toBe(true)
    expect(on.values.NAME.value).toBe('Рама')
    // existing text is kept
    expect(
      toggleTranslationRow({ ...kz, enabled: false }, { NAME: 'Рама' }).values.NAME.value,
    ).toBe('Рама KZ')
    expect(toggleTranslationRow(kz, {}).enabled).toBe(false)
  })
})

describe('planTranslationSave', () => {
  it('saves enabled texts and deletes disabled or cleared ones', () => {
    const [kz, uz] = buildTranslationRows(COUNTRIES, FIELDS, [
      ...SAVED,
      {
        id: 11,
        entityType: 'PRODUCT',
        entityId: 5,
        countryId: 1,
        field: 'NAME_IN_CATALOG',
        value: 'x',
      },
    ])
    const rows = [
      { ...kz, values: { ...kz.values, NAME_IN_CATALOG: { id: 11, value: '  ' } } },
      { ...uz, enabled: true, values: { ...uz.values, NAME: { id: null, value: ' Rama UZ ' } } },
    ]
    expect(planTranslationSave(rows, 'PRODUCT', 5)).toEqual({
      batch: [
        {
          id: 10,
          entityType: 'PRODUCT',
          entityId: 5,
          countryId: 1,
          field: 'NAME',
          value: 'Рама KZ',
        },
        {
          id: null,
          entityType: 'PRODUCT',
          entityId: 5,
          countryId: 2,
          field: 'NAME',
          value: 'Rama UZ',
        },
      ],
      deleteIds: [11],
    })
    expect(planTranslationSave([{ ...kz, enabled: false }], 'PRODUCT', 5)).toEqual({
      batch: [],
      deleteIds: [10, 11],
    })
  })
})
