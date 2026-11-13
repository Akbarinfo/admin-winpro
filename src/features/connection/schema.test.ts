import { describe, expect, it } from 'vitest'
import { connectionSchema, connectionSpecSchema, connectionTypeSchema } from './schema'

describe('connection schemas', () => {
  it('needs both products', () => {
    expect(connectionSchema.safeParse({ product1: 1, product2: null }).success).toBe(false)
    expect(connectionSchema.parse({ product1: 1, product2: 2 })).toEqual({
      product1: 1,
      product2: 2,
    })
  })

  it('needs a variant’s name and priority, not its icon', () => {
    const r = connectionTypeSchema.safeParse({
      name: ' ',
      priority: null,
      connectionTypeIndex: null,
      isDefault: false,
    })
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(['name', 'priority'])
  })

  it('needs a specification’s product, not its texture', () => {
    expect(connectionSpecSchema.parse({ productId: 3, textureId: null })).toEqual({
      productId: 3,
      textureId: null,
    })
  })
})
