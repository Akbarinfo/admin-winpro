import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
// the sections' translations, for their menu labels
import '@/features/currency'
import '@/features/units'
import { useRecentPages } from '@/shared/store/recentPages'
import { useSession } from '@/shared/store/session'
import { renderWithProviders } from '@/test/render'
import { AppLayout } from './AppLayout'

const routes = [
  {
    element: <AppLayout />,
    children: [
      { path: '/currency', element: <p>Страница валют</p> },
      { path: '/units', element: <p>Страница единиц</p> },
    ],
  },
]

describe('AppLayout', () => {
  it('brings a section back where it was left: its table page, filters and search', async () => {
    const { router } = renderWithProviders(<></>, {
      url: '/currency?currency.page=3&currency.q=usd',
      routes,
    })
    expect(await screen.findByText('Страница валют')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Единицы измерения' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/units'))
    await userEvent.click(screen.getByRole('link', { name: 'Валюты' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/currency'))
    expect(router.state.location.search).toBe('?currency.page=3&currency.q=usd')
  })

  it('writes each opened section into the user’s recent pages, with the address last seen', async () => {
    useSession.setState({ user: { username: 'ali' } })
    const { router } = renderWithProviders(<></>, { url: '/currency?currency.page=2', routes })
    await screen.findByText('Страница валют')
    await userEvent.click(screen.getByRole('link', { name: 'Единицы измерения' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/units'))
    expect(useRecentPages.getState().byUser.ali.map((p) => [p.section, p.url])).toEqual([
      ['/units', '/units'],
      ['/currency', '/currency?currency.page=2'],
    ])
  })

  it('has the logo leading home', async () => {
    renderWithProviders(<></>, { url: '/currency', routes })
    await screen.findByText('Страница валют')
    expect(screen.getByRole('link', { name: 'WinPro Admin' })).toHaveAttribute('href', '/')
  })
})
