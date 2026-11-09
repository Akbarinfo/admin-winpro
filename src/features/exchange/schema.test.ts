import { describe, expect, it } from 'vitest'
import { exchangeSchema } from './schema'

const valid = { fromCurrencyId: 1, toCurrencyId: 2, rate: 12648.5, date: '2026-10-19' }

const issues = (input: unknown) => {
  const result = exchangeSchema.safeParse(input)
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('exchangeSchema', () => {
  it('accepts a complete rate', () => {
    expect(exchangeSchema.parse(valid)).toEqual(valid)
  })

  it('requires both currencies, a rate and a date', () => {
    expect(issues({ fromCurrencyId: null, toCurrencyId: null, rate: null, date: '' })).toEqual({
      fromCurrencyId: 'validation.required',
      toCurrencyId: 'validation.required',
      rate: 'validation.required',
      date: 'validation.required',
    })
  })

  it('rejects zero and negative rates', () => {
    expect(issues({ ...valid, rate: 0 })).toEqual({ rate: 'validation.positive' })
  })

  it('rejects the same currency on both sides', () => {
    expect(issues({ ...valid, toCurrencyId: 1 })).toEqual({
      toCurrencyId: 'validation.same_currency',
    })
  })
})
