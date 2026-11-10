import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { productRoutes } from './index'

// The real APIs run against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const PROFILE = { id: 41, name: 'Рама 60', article: 'AK-6001', profileType: 'FRAME' }
const PRICE = {
  id: 501,
  productId: 41,
  productName: 'Рама 60',
  textureName: 'Золотой дуб',
  color: '#a8743d',
  imageId: null,
  date: '2026-10-19',
  price: 52000,
  priceOfOne: 8700,
  currencySymbol: 'сум',
  countryCode: 'uz',
  akfaExternalName: 'AKFA-GD',
}

const GETS: Record<string, unknown> = {
  '/v1/product/series/list': [],
  '/v1/supplier/list': [],
  '/v1/profile/system/list': [],
  '/v1/product/enum/article/type/PROFILES': [{ id: 1, name: 'FRAME' }],
  '/v1/country/list': [
    { id: 1, name: 'Kazakhstan' },
    { id: 2, name: 'Uzbekistan' },
  ],
  '/v1/texture/list': [
    { id: 7, name: 'Золотой дуб', color: '#a8743d' },
    { id: 8, name: 'Белый', color: '#ffffff' },
  ],
  '/v1/currency/list': [
    { id: 1, name: 'Узбекский сум', symbol: 'сум' },
    { id: 2, name: 'Доллар США', symbol: '$' },
  ],
  '/v1/product/price/501': {
    id: 501,
    productId: 41,
    textureId: 7,
    currencyId: 1,
    countryId: 2,
    price: 52000,
    priceOfOne: 8700,
    date: '2026-10-19T00:00:00',
  },
}

const priceBodies = () =>
  http.post.mock.calls.filter(([url]) => url === '/v1/product/price/table').map(([, body]) => body)

const renderList = (url = '/product/profile') =>
  renderWithProviders(<></>, { url, routes: productRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/product/table')
      return { data: { data: [PROFILE], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/product/price/table')
      return { data: { data: [PRICE], recordsTotal: 1, recordsFiltered: 1 } }
    return { data: {} }
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Product prices', () => {
  it('opens the prices right under a clicked product, unsorted like the old panel', async () => {
    const { router } = renderList()
    await userEvent.click(await screen.findByText('AK-6001'))

    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    expect(panel.closest('tr')).not.toBeNull() // inside the table, under its row
    expect(await within(panel).findByText('Золотой дуб')).toBeInTheDocument()
    expect(within(panel).getByText('Akfa')).toBeInTheDocument()
    expect(within(panel).getByText('19.10.2026')).toBeInTheDocument()
    expect(within(panel).getByText(/^52\s000 сум$/)).toBeInTheDocument()
    expect(priceBodies()[0]).toMatchObject({
      start: 0,
      length: 10,
      order: [],
      filter: { productId: 41 },
    })
    expect(router.state.location.search).toBe('?profile.selected=41')

    await userEvent.click(screen.getByRole('button', { name: 'Скрыть цены: Рама 60' }))
    expect(screen.queryByRole('region', { name: /Цены/ })).not.toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('filters prices by country', async () => {
    renderList('/product/profile?profile.selected=41')
    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Страна' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Uzbekistan' }))
    await waitFor(() =>
      expect(priceBodies().at(-1)).toMatchObject({ filter: { productId: 41, countryId: 2 } }),
    )
    // cleared — the country is left out of the filter, not sent as null
    await userEvent.click(within(panel).getByRole('button', { name: 'Очистить' }))
    await waitFor(() =>
      expect((priceBodies().at(-1) as { filter: object }).filter).toEqual({ productId: 41 }),
    )
  })

  it("starts another product's prices from their first page", async () => {
    const { router } = renderList('/product/profile?profile.selected=7&price.page=3')
    await userEvent.click(await screen.findByRole('button', { name: 'Показать цены: Рама 60' }))
    await waitFor(() => expect(router.state.location.search).toBe('?profile.selected=41'))
  })

  it('closes the prices of a deleted product', async () => {
    const { router } = renderList('/product/profile?profile.selected=41')
    await screen.findByRole('region', { name: 'Цены: Рама 60' })
    const row = screen.getByText('AK-6001').closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    )
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/product/41'))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /Цены/ })).not.toBeInTheDocument(),
    )
    expect(router.state.location.search).toBe('')
  })

  it('adds a price in the chosen country', async () => {
    renderList('/product/profile?profile.selected=41&price.countryId=1')
    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить цену' }))

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByLabelText(/Текстура/))
    await userEvent.click(await screen.findByRole('option', { name: 'Белый' }))
    await userEvent.type(within(dialog).getByLabelText(/^Цена(?! за)/), '61000')
    await userEvent.type(within(dialog).getByLabelText(/Цена за единицу/), '10200')
    await userEvent.click(within(dialog).getByLabelText(/Валюта/))
    await userEvent.click(await screen.findByRole('option', { name: /Доллар США/ }))
    await userEvent.clear(within(dialog).getByLabelText(/Дата/))
    await userEvent.type(within(dialog).getByLabelText(/Дата/), '2026-11-01')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/price', {
        id: null,
        productId: 41,
        date: '2026-11-01',
        textureId: 8,
        price: 61000,
        priceOfOne: 10200,
        currencyId: 2,
        countryId: 1,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('edits an Akfa price with a warning, by PUT', async () => {
    renderList('/product/profile?profile.selected=41')
    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    await within(panel).findByText('Золотой дуб')
    await userEvent.click(within(panel).getByRole('button', { name: 'Изменить' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('связана с Akfa (AKFA-GD)')
    await waitFor(() => expect(within(dialog).getByLabelText(/Дата/)).toHaveValue('2026-10-19'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/price', {
        id: 501,
        productId: 41,
        date: '2026-10-19',
        textureId: 7,
        price: 52000,
        priceOfOne: 8700,
        currencyId: 1,
        countryId: 2,
      }),
    )
  })

  it('requires the fields of the old form plus texture and currency', async () => {
    renderList('/product/profile?profile.selected=41')
    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить цену' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(4)
    expect(http.post).not.toHaveBeenCalledWith('/v1/product/price', expect.anything())
  })

  it('copies and deletes a price', async () => {
    renderList('/product/profile?profile.selected=41')
    const panel = await screen.findByRole('region', { name: 'Цены: Рама 60' })
    await within(panel).findByText('Золотой дуб')

    await userEvent.click(within(panel).getByRole('button', { name: 'Копировать цену' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/product/price/copy/501'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Цена скопирована'))

    await userEvent.click(within(panel).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/product/price/501'))
  })
})
