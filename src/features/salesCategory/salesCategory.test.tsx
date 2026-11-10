import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { salesCategoryRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const ROW = {
  id: 7,
  name: 'Дилер',
  price: 250000,
  currencyName: 'Узбекский сум',
  freeForTariffs: ['PREMIUM', 'BUSINESS'],
}
const CATEGORY = {
  id: 7,
  name: 'Дилер',
  description: 'для дилеров',
  price: 250000,
  currencyId: 1,
  freeForTariffs: ['PREMIUM'],
  profileSystemIds: [11],
}
const TREE = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Akfa 60', children: [] },
      { id: 12, name: 'Akfa 70', children: [] },
    ],
  },
  { id: 2, name: 'Engelberg', children: [] },
]

const renderPage = (url = '/sales_category') =>
  renderWithProviders(<></>, { url, routes: salesCategoryRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/sale-categories/table'
      ? { data: { data: [ROW], recordsTotal: 1, recordsFiltered: 1 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/sale-categories/7') return { data: CATEGORY }
    if (url === '/v1/sale-categories/tariff/list') return { data: ['PREMIUM', 'BUSINESS', 'START'] }
    if (url === '/v1/profile/system/list/tree') return { data: TREE }
    if (url === '/v1/currency/list')
      return {
        data: [
          { id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true },
          { id: 2, name: 'Доллар США', symbol: '$' },
        ],
      }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Sales categories', () => {
  it('lists categories with price, currency and tariffs', async () => {
    renderPage()
    const row = (await screen.findByText('Дилер')).closest('tr')!
    expect(within(row).getByText(/250\s000/)).toBeInTheDocument()
    expect(within(row).getByText('Узбекский сум')).toBeInTheDocument()
    expect(within(row).getByText('BUSINESS')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/sale-categories/table',
      expect.objectContaining({ order: [{ column: 'id', dir: 'DESC' }] }),
      expect.anything(),
    )
  })

  it('creates with the old body and profile systems from the tree', async () => {
    renderPage('/sales_category/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить категорию продаж' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Розница')
    await userEvent.type(within(dialog).getByLabelText(/Цена/), '2,5')
    await userEvent.click(within(dialog).getByLabelText('Валюта'))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Доллар США ($)' }))

    await userEvent.click(within(dialog).getByLabelText('Бесплатно для тарифов'))
    await userEvent.click(within(dialog).getByRole('option', { name: 'START' }))

    await userEvent.click(within(dialog).getByLabelText('Системы профилей'))
    await userEvent.click(await within(dialog).findByRole('treeitem', { name: 'Engelberg' }))
    await userEvent.type(within(dialog).getByLabelText('Системы профилей'), '70')
    await userEvent.click(within(dialog).getByRole('treeitem', { name: 'Akfa 70' }))

    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/sale-categories', {
        name: 'Розница',
        description: '',
        price: 2.5,
        currencyId: 2,
        freeForTariffs: ['START'],
        profileSystemIds: [2, 12],
      }),
    )
  })

  it('edits with PUT, keeping the description', async () => {
    renderPage('/sales_category/update/7')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить категорию продаж' })
    await waitFor(() => expect(within(dialog).getByLabelText(/Название/)).toHaveValue('Дилер'))
    expect(await within(dialog).findByText('Akfa 60')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/sale-categories', {
        id: 7,
        name: 'Дилер',
        description: 'для дилеров',
        price: 250000,
        currencyId: 1,
        freeForTariffs: ['PREMIUM'],
        profileSystemIds: [11],
      }),
    )
  })

  it('requires a name and a price', async () => {
    renderPage('/sales_category/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    expect(http.post).not.toHaveBeenCalledWith('/v1/sale-categories', expect.anything())
  })

  it('deletes after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Дилер')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/sale-categories/7'))
  })
})
