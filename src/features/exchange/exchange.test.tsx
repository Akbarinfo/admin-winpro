import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { exchangeRoutes } from './index'

// The real exchangeApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const CURRENCIES = [
  { id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true },
  { id: 2, name: 'Доллар США', symbol: '$' },
  { id: 3, name: 'Евро', symbol: '€' },
]
const RATE = {
  id: 318,
  fromCurrencyId: 2,
  toCurrencyId: 1,
  fromName: 'Доллар США',
  toName: 'Узбекский сум',
  date: '2026-10-19',
  rate: 12648.5,
}

const renderExchange = (url = '/exchange') =>
  renderWithProviders(<></>, { url, routes: exchangeRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/exchange/table')
      return { data: { data: [RATE], recordsTotal: 1, recordsFiltered: 1 } }
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/currency/list') return { data: CURRENCIES }
    if (url === '/v1/exchange/318') return { data: RATE }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Exchange rates', () => {
  it('lists rates from the table endpoint', async () => {
    renderExchange()
    expect(await screen.findByText('Доллар США')).toBeInTheDocument()
    expect(screen.getByText('19.10.2026')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/exchange/table',
      expect.objectContaining({ start: 0, length: 20, order: [{ column: 'id', dir: 'DESC' }] }),
      expect.anything(),
    )
  })

  it('deletes a rate after confirmation and reloads the list', async () => {
    renderExchange()
    await screen.findByText('Доллар США')

    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('«Доллар США → Узбекский сум, 19.10.2026» будет удалено')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/exchange/318'))
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(2)) // table refetched
  })

  it('creates a rate starting from the main currency', async () => {
    const { router } = renderExchange('/exchange/add?exchange.size=50')
    const dialog = await screen.findByRole('dialog')
    const [from, to] = within(dialog).getAllByRole('combobox')

    await waitFor(() => expect(from).toHaveValue('Узбекский сум (сум)'))
    await userEvent.click(to)
    // the main currency is chosen on the left, so it is not offered on the right
    expect(
      within(dialog)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Доллар США ($)', 'Евро (€)'])
    await userEvent.click(within(dialog).getByRole('option', { name: 'Евро (€)' }))
    await userEvent.type(within(dialog).getByLabelText(/Курс/), '0,0000721')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/exchange', {
        id: null,
        fromCurrencyId: 1,
        toCurrencyId: 3,
        rate: 0.0000721,
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    // closes and returns to the list with its URL params intact
    await waitFor(() =>
      expect(router.state.location).toMatchObject({
        pathname: '/exchange',
        search: '?exchange.size=50',
      }),
    )
  })

  it('shows validation errors instead of saving', async () => {
    renderExchange('/exchange/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2) // to currency, rate
    expect(http.post).not.toHaveBeenCalledWith('/v1/exchange', expect.anything())
  })

  it('edits an existing rate with PUT', async () => {
    renderExchange('/exchange/update/318')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить курс' })
    const rate = await within(dialog).findByLabelText(/Курс/)
    await waitFor(() => expect(rate).toHaveValue('12 648,5'))

    await userEvent.clear(rate)
    await userEvent.type(rate, '12700')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/exchange', {
        id: '318',
        fromCurrencyId: 2,
        toCurrencyId: 1,
        rate: 12700,
        date: '2026-10-19',
      }),
    )
  })
})
