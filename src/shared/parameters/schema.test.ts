import { describe, expect, it } from 'vitest'
import { parameterSchema } from './schema'

const issues = (v: object) => parameterSchema.safeParse(v).error?.issues.map((i) => i.path[0]) ?? []

describe('parameterSchema', () => {
  it('needs a kind', () => {
    expect(issues({ kind: null, kindType: null, objectId: null, value: '' })).toEqual(['kind'])
  })

  it('needs a chosen value for SELECT and a typed one for TEXT', () => {
    expect(issues({ kind: 'P', kindType: 'SELECT', objectId: null, value: 'x' })).toEqual([
      'objectId',
    ])
    expect(issues({ kind: 'A', kindType: 'TEXT', objectId: null, value: '  ' })).toEqual(['value'])
    expect(issues({ kind: 'A', kindType: 'TEXT', objectId: null, value: '45' })).toEqual([])
  })
})
