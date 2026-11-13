import { describe, expect, it } from 'vitest'
import { additionalSchema, consistSchema } from './schema'

describe('inserts schemas', () => {
  it('needs the product', () => {
    expect(consistSchema.safeParse({ productId: null, productName: null }).success).toBe(false)
  })

  it('needs an insert’s name, trimmed', () => {
    expect(
      additionalSchema.safeParse({ name: '  ', byDefault: false, necessarily: false }).success,
    ).toBe(false)
    expect(
      additionalSchema.parse({ name: ' Штапик ', byDefault: true, necessarily: false }).name,
    ).toBe('Штапик')
  })
})
