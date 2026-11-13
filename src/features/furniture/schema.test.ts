import { describe, expect, it } from 'vitest'
import { accessorySchema, sideLimitSchema } from './schema'

describe('furniture schemas', () => {
  it('needs a name; handle side whole', () => {
    const base = {
      name: 'Roto',
      shortName: '',
      handleSide: null,
      maxHalfPerimeter: null,
      maxHeight: null,
      maxWidth: null,
      maxSash: null,
      accessoriesType: null,
      openingType: null,
      openingSide: 'INWARD',
      door: false,
    }
    expect(accessorySchema.safeParse({ ...base, name: ' ' }).success).toBe(false)
    expect(accessorySchema.safeParse({ ...base, handleSide: 1.5 }).success).toBe(false)
    expect(accessorySchema.safeParse(base).success).toBe(true)
  })

  it('needs all five whole numbers of a side limit', () => {
    const r = sideLimitSchema.safeParse({
      minLength: 1,
      maxLength: null,
      minCorner: 1.5,
      maxCorner: 1,
      number: 1,
    })
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(['maxLength', 'minCorner'])
  })
})
