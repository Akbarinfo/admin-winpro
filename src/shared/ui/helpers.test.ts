import { describe, expect, it } from 'vitest'
import {
  ancestorKeys,
  indexTree,
  leafKeys,
  toLeafKeys,
  topCheckedNodes,
  treeCheckStates,
  visibleTreeRows,
  caretAfter,
  detectPhoneCountry,
  formatPhone,
  isPhoneComplete,
  phoneDigits,
  formatNumberText,
  getPageItems,
  nextSort,
  numberToText,
  parseNumber,
  splitByQuery,
} from './helpers'

describe('formatNumberText', () => {
  it('groups thousands and uses a comma for decimals', () => {
    expect(formatNumberText('15253')).toBe('15 253')
    expect(formatNumberText('1234567.891')).toBe('1 234 567,891')
    expect(formatNumberText('-10000')).toBe('-10 000')
  })

  it('keeps unfinished input', () => {
    expect(formatNumberText('1000,')).toBe('1 000,')
    expect(formatNumberText(',5')).toBe(',5')
    expect(formatNumberText('-')).toBe('-')
  })
})

describe('numberToText', () => {
  it('pads decimals up to the minimum but never cuts them', () => {
    expect(numberToText(1.5, 2)).toBe('1,50')
    expect(numberToText(10000, 2)).toBe('10 000,00')
    expect(numberToText(0.0000721, 2)).toBe('0,0000721')
    expect(numberToText(12648.5)).toBe('12 648,5')
  })
})

describe('caretAfter', () => {
  it('skips group spaces', () => {
    expect(caretAfter('15 000', 2)).toBe(2)
    expect(caretAfter('1 525 300', 4)).toBe(5)
    expect(caretAfter('12', 5)).toBe(2)
  })
})

describe('nextSort', () => {
  it('sorts a new column ascending', () => {
    expect(nextSort('date')).toEqual({ column: 'date', dir: 'asc' })
    expect(nextSort('date', { column: 'rate', dir: 'asc' })).toEqual({ column: 'date', dir: 'asc' })
  })

  it('flips the direction on the same column', () => {
    expect(nextSort('date', { column: 'date', dir: 'asc' })).toEqual({
      column: 'date',
      dir: 'desc',
    })
    expect(nextSort('date', { column: 'date', dir: 'desc' })).toEqual({
      column: 'date',
      dir: 'asc',
    })
  })
})

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('shows first, last and neighbours with gaps in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
  })

  it('shows more pages near the edges instead of a one-page gap', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 'gap', 20])
    expect(getPageItems(20, 20)).toEqual([1, 'gap', 17, 18, 19, 20])
  })
})

describe('parseNumber', () => {
  it('parses dots, commas and spaces', () => {
    expect(parseNumber('12.5')).toBe(12.5)
    expect(parseNumber('12,5')).toBe(12.5)
    expect(parseNumber('12 648,50')).toBe(12648.5)
    expect(parseNumber('-3')).toBe(-3)
  })

  it('treats unfinished input as no value yet', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('-')).toBeNull()
    expect(parseNumber(',')).toBeNull()
  })
})

describe('splitByQuery', () => {
  it('marks every case-insensitive match', () => {
    expect(splitByQuery('Рама 60 мм, рама', 'рама')).toEqual([
      { text: 'Рама', match: true },
      { text: ' 60 мм, ', match: false },
      { text: 'рама', match: true },
    ])
  })

  it('treats regex characters literally and ignores an empty query', () => {
    expect(splitByQuery('AK-60 (101)', '(10')).toEqual([
      { text: 'AK-60 ', match: false },
      { text: '(10', match: true },
      { text: '1)', match: false },
    ])
    expect(splitByQuery('Рама', '  ')).toEqual([{ text: 'Рама', match: false }])
  })
})

const UZ = { code: 'uz', phoneCode: '+998', phoneFormat: '+998 (##) ### ## ##' }
const KZ = { code: 'kz', phoneCode: '+7', phoneFormat: '+7 (###) ### ## ##' }
const KG = { code: 'kg', phoneCode: '+996', phoneFormat: '+996 (###) ### ###' }
const COUNTRIES = [UZ, KZ, KG]

describe('formatPhone', () => {
  it('applies the country format while typing (separators appear before the next digit)', () => {
    expect(formatPhone('9', UZ)).toBe('+998 (9')
    expect(formatPhone('90', UZ)).toBe('+998 (90')
    expect(formatPhone('901', UZ)).toBe('+998 (90) 1')
    expect(formatPhone('901234567', UZ)).toBe('+998 (90) 123 45 67')
    expect(formatPhone('', UZ)).toBe('')
  })

  it('re-formats its own value and pasted numbers, ignoring extra digits', () => {
    expect(formatPhone('+998 (90) 123 45 678', UZ)).toBe('+998 (90) 123 45 67')
    expect(formatPhone('+998(90) 123 - 45 - 67', UZ)).toBe('+998 (90) 123 45 67') // old panel format
    expect(formatPhone('+998 (', UZ)).toBe('')
  })

  it('takes typed digits as the national number even when they start like the code', () => {
    expect(formatPhone('7011234567', KZ)).toBe('+7 (701) 123 45 67')
    expect(formatPhone('+7 (701) 123 45 67', KZ)).toBe('+7 (701) 123 45 67')
  })
})

describe('detectPhoneCountry / phoneDigits / isPhoneComplete', () => {
  it('detects the country by its code, longest first', () => {
    expect(detectPhoneCountry('+998(90) 123 - 45 - 67', COUNTRIES)).toBe(UZ)
    expect(detectPhoneCountry('+7 (701) 123 45 67', COUNTRIES)).toBe(KZ)
    expect(detectPhoneCountry('+996 (555) 123 456', COUNTRIES)).toBe(KG)
    expect(detectPhoneCountry('', COUNTRIES)).toBe(UZ)
  })

  it('extracts the national digits', () => {
    expect(phoneDigits('+998(90) 123 - 45 - 67', UZ)).toBe('901234567')
    expect(phoneDigits('', UZ)).toBe('')
  })

  it('checks the number is complete for its country', () => {
    expect(isPhoneComplete('+998 (90) 123 45 67', COUNTRIES)).toBe(true)
    expect(isPhoneComplete('+998(90) 123 - 45 - 67', COUNTRIES)).toBe(true)
    expect(isPhoneComplete('+998 (90) 123', COUNTRIES)).toBe(false)
    expect(isPhoneComplete('+996 (555) 123 456', COUNTRIES)).toBe(true)
  })
})

describe('tree helpers', () => {
  type N = { id: number; name: string; children?: N[] }
  const tree: N[] = [
    { id: 1, name: 'A', children: [{ id: 2, name: 'B', children: [{ id: 3, name: 'C' }] }] },
    { id: 4, name: 'D' },
  ]
  const access = {
    getKey: (n: N) => n.id,
    getLabel: (n: N) => n.name,
    getChildren: (n: N) => n.children,
  }
  const keys = (rows: { node: N }[]) => rows.map((r) => r.node.id)

  it('visibleTreeRows follows expanded branches', () => {
    expect(keys(visibleTreeRows(tree, access, new Set()))).toEqual([1, 4])
    expect(keys(visibleTreeRows(tree, access, new Set([1])))).toEqual([1, 2, 4])
    // A closed parent hides an open child.
    expect(keys(visibleTreeRows(tree, access, new Set([2])))).toEqual([1, 4])
  })

  it('visibleTreeRows with a query keeps matches and their ancestors', () => {
    const rows = visibleTreeRows(tree, access, new Set(), 'c')
    expect(keys(rows)).toEqual([1, 2, 3])
    expect(rows.map((r) => r.level)).toEqual([1, 2, 3])
    expect(keys(visibleTreeRows(tree, access, new Set(), 'zz'))).toEqual([])
  })

  it('ancestorKeys and indexTree', () => {
    expect([...ancestorKeys(tree, access, [3])].sort()).toEqual([1, 2])
    expect([...ancestorKeys(tree, access, [4, 1])]).toEqual([])
    expect(indexTree(tree, access).get(3)?.name).toBe('C')
  })

  it('cascading checks', () => {
    const index = indexTree(tree, access)
    expect(leafKeys(tree[0], access)).toEqual([3])
    expect(toLeafKeys(index, access, [1, 4, 99])).toEqual([3, 4, 99])

    const states = treeCheckStates(tree, access, new Set([3]))
    expect([states.get(1), states.get(2), states.get(4)]).toEqual(['all', 'all', 'none'])
    expect(topCheckedNodes(tree, access, states).map((n) => n.id)).toEqual([1])
  })
})
