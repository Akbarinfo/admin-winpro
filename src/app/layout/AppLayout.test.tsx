import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
// the sections' translations, for their menu labels
import '@/features/currency'
import '@/features/units'
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
})
