import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { currencyRoutes } from './index'

// The real currencyApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const SUM = { id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true }
const USD = { id: 2, name: 'Доллар США', symbol: '$', isMain: false }

const renderCurrency = (url = '/currency') =>
  renderWithProviders(<></>, { url, routes: currencyRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/currency/table'
      ? { data: { data: [SUM, USD], recordsTotal: 2, recordsFiltered: 2 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/currency/2') return { data: USD }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Currencies', () => {
  it('lists currencies and marks the main one', async () => {
    renderCurrency()
    const sumRow = (await screen.findByText('Узбекский сум')).closest('tr')!
    expect(within(sumRow).getByText('Основная')).toBeInTheDocument()
    const usdRow = screen.getByText('Доллар США').closest('tr')!
    expect(within(usdRow).queryByText('Основная')).not.toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/currency/table',
      expect.objectContaining({ start: 0, length: 20, order: [{ column: 'id', dir: 'DESC' }] }),
      expect.anything(),
    )
  })

  it('sorts by name with the field name the old panel used', async () => {
    renderCurrency()
    await screen.findByText('Доллар США')
    await userEvent.click(screen.getByRole('button', { name: /Название/ }))
    await waitFor(() =>
      expect(http.post).toHaveBeenLastCalledWith(
        '/v1/currency/table',
        expect.objectContaining({ order: [{ column: 'name', dir: 'ASC' }] }),
        expect.anything(),
      ),
    )
  })

  it('deletes after confirmation', async () => {
    renderCurrency()
    await screen.findByText('Доллар США')
    const usdRow = screen.getByText('Доллар США').closest('tr')!
    await userEvent.click(within(usdRow).getByRole('button', { name: 'Удалить' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('«Доллар США ($)» будет удалено')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/currency/2'))
  })

  it('creates a currency with the same body as the old panel', async () => {
    const { router } = renderCurrency('/currency/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить валюту' })

    await userEvent.type(within(dialog).getByLabelText(/Название/), ' Евро ')
    await userEvent.type(within(dialog).getByLabelText(/Символ/), '€')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/currency', {
        id: null,
        name: 'Евро',
        symbol: '€',
        isMain: false,
      }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/currency'))
  })

  it('requires name and symbol', async () => {
    renderCurrency('/currency/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    expect(http.post).not.toHaveBeenCalledWith('/v1/currency', expect.anything())
  })

  it('edits a currency with PUT', async () => {
    renderCurrency('/currency/update/2')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить валюту' })
    const name = await within(dialog).findByLabelText(/Название/)
    await waitFor(() => expect(name).toHaveValue('Доллар США'))

    await userEvent.click(within(dialog).getByLabelText('Основная валюта'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/currency', {
        id: '2',
        name: 'Доллар США',
        symbol: '$',
        isMain: true,
      }),
    )
  })
})
