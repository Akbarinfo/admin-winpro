import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { productRoutes } from './index'

// The real productApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const PROFILE = {
  id: 41,
  name: 'Рама 60',
  nameInCatalog: 'Рама 60 кат',
  article: 'AK-6001',
  profileType: 'FRAME',
  supplierName: 'Akfa',
  unitName: 'м',
  productSeriesName: 'Серия 60',
  usefulPiece: 5800,
  wastePercent: 3.5,
  hasPriceWarning: true,
}

const LISTS: Record<string, unknown> = {
  '/v1/product/series/list': [{ id: 5, name: 'Серия 60' }],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/profile/system/list': [{ id: 9, name: 'Termo 70', parentName: 'Akfa' }],
  '/v1/product/enum/article/type/PROFILES': [
    { id: 1, name: 'FRAME' },
    { id: 2, name: 'SASH' },
  ],
}

const renderProfiles = (url = '/product/profile') =>
  renderWithProviders(<></>, { url, routes: productRoutes })

/** The body of the last table request. */
const lastTableBody = () => {
  const calls = http.post.mock.calls.filter(([url]) => url === '/v1/product/table')
  return calls[calls.length - 1][1] as { order: unknown; filter: Record<string, unknown> }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/product/table')
      return { data: { data: [PROFILE], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/product/copy/41') return { data: { id: 77 } }
    throw new Error(`unexpected POST ${url}`)
  })
  http.get.mockImplementation(async (url: string) => {
    if (url in LISTS) return { data: LISTS[url] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Profiles list', () => {
  it('loads profiles of the PROFILES group, oldest first like the old panel', async () => {
    renderProfiles()
    expect(await screen.findByText('Рама 60')).toBeInTheDocument()
    expect(screen.getByText('Коробка')).toBeInTheDocument() // FRAME, legacy translation
    expect(screen.getByText(/^5\s800$/)).toBeInTheDocument()
    expect(screen.getByLabelText('У товара есть подозрительная цена')).toBeInTheDocument()

    expect(lastTableBody()).toMatchObject({
      order: [{ column: 'id', dir: 'ASC' }],
      filter: {
        searchTxt: null,
        type: null,
        supplierId: null,
        productSeriesId: null,
        profileSystemId: null,
        hasPriceWarning: null,
        groupType: 'PROFILES',
      },
    })
  })

  it('sorts only by name and article', async () => {
    renderProfiles()
    await screen.findByText('Рама 60')
    // the other old sortable headers are left without sorting on purpose
    expect(screen.queryByRole('button', { name: /Имя в каталоге/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Артикул' }))
    await waitFor(() => expect(lastTableBody().order).toEqual([{ column: 'article', dir: 'ASC' }]))
  })

  it('sends the filters in the table body and keeps them in the URL', async () => {
    const { router } = renderProfiles()
    await screen.findByText('Рама 60')

    await userEvent.click(screen.getByRole('combobox', { name: 'Поставщик' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Akfa' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Тип' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Коробка' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Профильная система' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Termo 70 - Akfa' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Проблемы с ценой/ }))

    await waitFor(() =>
      expect(lastTableBody().filter).toMatchObject({
        supplierId: 3,
        type: 'FRAME',
        profileSystemId: 9,
        hasPriceWarning: true,
        groupType: 'PROFILES',
      }),
    )
    const params = router.state.location.search
    expect(params).toContain('profile.supplierId=3')
    expect(params).toContain('profile.hasPriceWarning=1')

    await userEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    await waitFor(() => expect(lastTableBody().filter.supplierId).toBeNull())
    expect(router.state.location.search).toBe('')
  })

  it('restores the filters from a link', async () => {
    renderProfiles('/product/profile?profile.searchTxt=AK&profile.productSeriesId=5')
    await screen.findByText('Рама 60')
    expect(lastTableBody().filter).toMatchObject({ searchTxt: 'AK', productSeriesId: 5 })
    expect(screen.getByRole('combobox', { name: 'Серия' })).toHaveValue('Серия 60')
  })

  it('copies a profile and opens the copy', async () => {
    const { router } = renderProfiles('/product/profile?profile.size=50')
    await screen.findByText('Рама 60')

    await userEvent.click(screen.getByRole('button', { name: 'Копировать' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('«Рама 60»')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))

    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/product/copy/41'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/profile/update/77'))
    expect(router.state.location.state).toEqual({ from: '/product/profile?profile.size=50' })
  })

  it('deletes a profile after confirmation', async () => {
    renderProfiles()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/product/41'))
  })
})
