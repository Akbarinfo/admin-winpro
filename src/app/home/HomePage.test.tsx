import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
// the sections' translations, for their labels
import '@/features/currency'
import '@/features/connection'
import { useRecentPages } from '@/shared/store/recentPages'
import { useSession } from '@/shared/store/session'
import { renderWithProviders } from '@/test/render'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('lists the user’s recently opened sections, newest first, each back where it was left', () => {
    useSession.setState({ user: { username: 'ali' } })
    const now = Date.now()
    useRecentPages.setState({
      byUser: {
        ali: [
          { section: '/connection', url: '/connection?connection.page=2', at: now - 5 * 60_000 },
          { section: '/currency', url: '/currency', at: now - 26 * 3600_000 },
          // no longer in the menu: skipped
          { section: '/gone', url: '/gone', at: now },
        ],
        vali: [{ section: '/units', url: '/units', at: now }],
      },
    })
    renderWithProviders(<HomePage />)

    const links = within(screen.getByRole('list')).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/connection?connection.page=2',
      '/currency',
    ])
    expect(links[0]).toHaveTextContent('Соединение')
    expect(links[0]).toHaveTextContent('Каталог · 5 минут назад')
    expect(links[1]).toHaveTextContent('вчера')
  })

  it('says what will appear when nothing was opened yet', () => {
    useSession.setState({ user: { username: 'new' } })
    renderWithProviders(<HomePage />)
    expect(screen.getByText('Здесь пока пусто')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('clears the list on request', async () => {
    useSession.setState({ user: { username: 'ali' } })
    useRecentPages.setState({
      byUser: { ali: [{ section: '/currency', url: '/currency', at: Date.now() }] },
    })
    renderWithProviders(<HomePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Очистить список' }))
    expect(screen.getByText('Здесь пока пусто')).toBeInTheDocument()
    expect(useRecentPages.getState().byUser.ali).toBeUndefined()
  })
})
