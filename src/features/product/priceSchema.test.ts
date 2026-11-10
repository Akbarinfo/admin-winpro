import { describe, expect, it } from 'vitest'
import { priceSchema } from './priceSchema'

const VALID = {
  date: '2026-11-01',
  textureId: 8,
  price: 61000,
  priceOfOne: 10200,
  currencyId: 2,
  countryId: null,
}

describe('priceSchema', () => {
  it('accepts a price without a country, and zero amounts', () => {
    expect(priceSchema.safeParse(VALID).success).toBe(true)
    expect(priceSchema.safeParse({ ...VALID, price: 0, priceOfOne: 0 }).success).toBe(true)
  })

  it('requires date, texture, amounts and currency', () => {
    const result = priceSchema.safeParse({
      date: ' ',
      textureId: null,
      price: null,
      priceOfOne: null,
      currencyId: null,
      countryId: null,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      'currencyId',
      'date',
      'price',
      'priceOfOne',
      'textureId',
    ])
  })

  it('rejects negative amounts', () => {
    expect(priceSchema.safeParse({ ...VALID, price: -1 }).success).toBe(false)
  })
})
