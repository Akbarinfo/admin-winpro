import { describe, expect, it } from 'vitest'
import { fillingGroupSchema, fillingSpecSchema } from './schema'

const issues = (r: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.error?.issues.map((i) => i.path[0]) ?? []

describe('filling schemas', () => {
  it('needs a group’s name and clearance', () => {
    expect(
      issues(
        fillingGroupSchema.safeParse({ name: ' ', clearance: null, outer: false, inner: false }),
      ),
    ).toEqual(['name', 'clearance'])
  })

  it('needs a specification row’s thickness and product, not its texture', () => {
    expect(
      issues(fillingSpecSchema.safeParse({ thickness: null, productId: null, textureId: null })),
    ).toEqual(['thickness', 'productId'])
  })
})
