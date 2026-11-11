import { describe, expect, it } from 'vitest'
import { translationSchema } from './schema'

const issues = (codes: string[], value: object) => {
  const r = translationSchema(codes).safeParse(value)
  return r.success ? [] : r.error.issues.map((i) => [i.path.join('.'), i.message])
}

describe('translationSchema', () => {
  it('needs the key and a text in every language given', () => {
    expect(issues(['ru', 'uz'], { key: ' ', values: { ru: 'Да', uz: '  ' } })).toEqual([
      ['key', 'validation.required'],
      ['values.uz', 'validation.required'],
    ])
    // a language the record had no text for yet: still required
    expect(issues(['ru', 'uz'], { key: 'yes', values: { ru: 'Да' } })).toEqual([
      ['values.uz', 'validation.required'],
    ])
  })

  it('trims the key but keeps the texts as typed', () => {
    const r = translationSchema(['ru']).parse({ key: '  yes ', values: { ru: ' Да ' } })
    expect(r).toEqual({ key: 'yes', values: { ru: ' Да ' } })
  })

  it('takes no texts when no language is active', () => {
    expect(translationSchema([]).safeParse({ key: 'yes', values: {} }).success).toBe(true)
  })
})
