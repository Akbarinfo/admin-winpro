import { beforeEach, describe, expect, it } from 'vitest'
import { RECENT_LIMIT, useRecentPages } from './recentPages'

const visit = useRecentPages.getState().visit
const list = (user = 'ali') => useRecentPages.getState().byUser[user] ?? []

beforeEach(() => useRecentPages.setState({ byUser: {} }))

describe('recent pages', () => {
  it('keeps the newest first, one entry per section with its last address', () => {
    visit('ali', '/currency', '/currency', 1)
    visit('ali', '/connection', '/connection?connection.page=2', 2)
    visit('ali', '/currency', '/currency/update/5', 3)
    expect(list()).toEqual([
      { section: '/currency', url: '/currency/update/5', at: 3 },
      { section: '/connection', url: '/connection?connection.page=2', at: 2 },
    ])
  })

  it(`keeps at most ${RECENT_LIMIT}, per user`, () => {
    for (let i = 0; i < 12; i++) visit('ali', `/s${i}`, `/s${i}`, i)
    visit('vali', '/units', '/units', 1)
    expect(list()).toHaveLength(RECENT_LIMIT)
    expect(list()[0].section).toBe('/s11')
    expect(list('vali')).toHaveLength(1)
  })

  it('clears one user’s list only', () => {
    visit('ali', '/currency', '/currency', 1)
    visit('vali', '/units', '/units', 1)
    useRecentPages.getState().clear('ali')
    expect(list()).toEqual([])
    expect(list('vali')).toHaveLength(1)
  })
})
