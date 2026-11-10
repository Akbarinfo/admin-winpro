import { describe, expect, it } from 'vitest'
import { salesCategorySchema } from './schema'

const valid = {
  name: 'Дилер',
  description: '',
  price: 0,
  currencyId: null,
  freeForTariffs: [],
  profileSystemIds: [],
}

describe('salesCategorySchema', () => {
  it('accepts a free category without currency', () => {
    expect(salesCategorySchema.safeParse(valid).success).toBe(true)
  })

  it('requires a name and a price', () => {
    const result = salesCategorySchema.safeParse({ ...valid, name: '  ', price: null })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['name', 'validation.required'],
      ['price', 'validation.required'],
    ])
  })

  it('rejects a negative price', () => {
    const result = salesCategorySchema.safeParse({ ...valid, price: -1 })
    expect(result.error?.issues[0].message).toBe('validation.positive')
  })
})
