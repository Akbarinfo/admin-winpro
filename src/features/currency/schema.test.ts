import { describe, expect, it } from 'vitest'
import { currencySchema } from './schema'

const issues = (input: unknown) => {
  const result = currencySchema.safeParse(input)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('currencySchema', () => {
  it('trims name and symbol', () => {
    expect(currencySchema.parse({ name: '  Доллар США ', symbol: ' $ ', isMain: false })).toEqual({
      name: 'Доллар США',
      symbol: '$',
      isMain: false,
    })
  })

  it('requires name and symbol (spaces only count as empty)', () => {
    expect(issues({ name: '   ', symbol: '', isMain: true })).toEqual({
      name: 'validation.required',
      symbol: 'validation.required',
    })
  })
})
