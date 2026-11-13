import { describe, expect, it } from 'vitest'
import { akfaProductSchema, emptyAkfaProduct } from './schema'

const issues = (patch: object) => {
  const r = akfaProductSchema.safeParse({ ...emptyAkfaProduct(), ...patch })
  return r.success ? [] : r.error.issues.map((i) => [i.path.join('.'), i.message])
}

describe('akfaProductSchema', () => {
  it('needs the name, article and at least one texture', () => {
    expect(issues({ name: ' ', article: '' })).toEqual([
      ['name', 'validation.required'],
      ['article', 'validation.required'],
      ['textureIds', 'akfa.create.no_textures_selected'],
    ])
  })

  it('trims the texts and takes no negative length', () => {
    const r = akfaProductSchema.parse({
      ...emptyAkfaProduct(),
      name: ' Rama 60 ',
      article: ' SW306G ',
      textureIds: [21],
    })
    expect([r.name, r.article]).toEqual(['Rama 60', 'SW306G'])
    expect(issues({ name: 'x', article: 'y', textureIds: [1], length: -1 })).toEqual([
      ['length', 'validation.non_negative'],
    ])
  })
})
