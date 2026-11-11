import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { priceRequestRoutes } from './index'

// The real priceRequestApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const ROWS = [
  {
    id: 1,
    productName: 'Рама 60',
    productArticle: 'AK-6001',
    supplierName: 'Akfa',
    textureName: 'Белый',
    textureColor: '#ffffff',
    currentPrice: 50000,
    requestedPrice: 55000,
    currencySymbol: 'сум',
    createdDate: '2026-11-09T10:00:00',
    requestStatus: 'PENDING',
  },
  {
    id: 2,
    productName: 'Створка 70',
    supplierName: 'Akfa',
    currentPrice: 40000,
    requestedPrice: 36000,
    currencySymbol: 'сум',
    requestStatus: 'PENDING',
  },
  {
    id: 3,
    productName: 'Импост',
    supplierName: 'Enwin',
    currentPrice: 30000,
    requestedPrice: 31000,
    currencySymbol: 'сум',
    requestStatus: 'APPROVED',
  },
]

const render = (url = '/price-requests') =>
  renderWithProviders(<></>, { url, routes: priceRequestRoutes })

/** Query params of the last list request. */
const lastParams = () => http.get.mock.calls.at(-1)![1]!.params

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: { data: ROWS, total: 23 } })
  http.put.mockResolvedValue({ data: {} })
})

describe('Price requests', () => {
  it('lists requests by a plain GET with a 0-based page and no empty params', async () => {
    render()
    expect(await screen.findByText('Рама 60')).toBeInTheDocument()
    expect(http.get).toHaveBeenCalledWith('/v1/price-requests', {
      params: { page: 0, size: 10 },
      signal: expect.anything(),
    })
    // the requested price shows how it changes the current one
    expect(screen.getByText('▲10,0%')).toBeInTheDocument()
    expect(screen.getByText('▼10,0%')).toBeInTheDocument()
    // only pending requests can be approved or rejected
    const approved = screen.getByText('Импост').closest('tr')!
    expect(within(approved).queryByRole('button', { name: 'Одобрить' })).not.toBeInTheDocument()
    expect(within(approved).queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('sends the status, search and page, and keeps them in the URL', async () => {
    const { router } = render('/price-requests?priceRequests.page=2')
    await screen.findByText('Рама 60')
    expect(lastParams()).toEqual({ page: 1, size: 10 })

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Статус' }), 'PENDING')
    await waitFor(() => expect(lastParams()).toEqual({ page: 0, size: 10, status: 'PENDING' }))
    await userEvent.type(screen.getByRole('searchbox'), 'рама')
    await waitFor(() =>
      expect(lastParams()).toEqual({ page: 0, size: 10, status: 'PENDING', search: 'рама' }),
    )
    expect(router.state.location.search).toContain('priceRequests.status=PENDING')
  })

  it('approves one request after confirmation', async () => {
    render()
    const row = (await screen.findByText('Рама 60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Одобрить' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Цена «Рама 60» станет 55 000 сум')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Одобрить' }))

    await waitFor(() => expect(http.put).toHaveBeenCalledWith('/v1/price-requests/1/approve'))
    expect(toast.success).toHaveBeenCalledWith('Запрос одобрен')
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2)) // the list is asked again
  })

  it('rejects with a required reason', async () => {
    render()
    const row = (await screen.findByText('Створка 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Отклонить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отклонить' }))
    expect(within(dialog).getByText('Заполните это поле')).toBeInTheDocument()
    expect(http.put).not.toHaveBeenCalled()

    await userEvent.type(within(dialog).getByLabelText(/Причина/), '  Слишком дорого  ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отклонить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/price-requests/2/reject', {
        rejectReason: 'Слишком дорого',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith('Запрос отклонён')
  })

  it('selects all pending ones and approves them one after another', async () => {
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все ожидающие' }))
    expect(screen.getByText('Выбрано: 2')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Одобрить выбранные' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Будет одобрено запросов: 2.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Одобрить' }))

    await waitFor(() => expect(http.put).toHaveBeenCalledTimes(2))
    expect(http.put.mock.calls.map(([url]) => url)).toEqual([
      '/v1/price-requests/1/approve',
      '/v1/price-requests/2/approve',
    ])
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Выбранные запросы одобрены'))
    await waitFor(() => expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument())
  })

  it('rejects the selected with one reason and says when some failed', async () => {
    http.put.mockImplementation(async (url: string) => {
      if (url === '/v1/price-requests/2/reject') throw new ApiError(409, 'Уже обработан')
      return { data: {} }
    })
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать запрос: Рама 60' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать запрос: Створка 70' }))
    await userEvent.click(screen.getByRole('button', { name: 'Отклонить выбранные' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Причина отклонения (запросов: 2)')
    await userEvent.type(within(dialog).getByLabelText(/Причина/), 'Нет обоснования')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отклонить' }))

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Выполнено 1 из 2'))
    expect(http.put).toHaveBeenCalledWith('/v1/price-requests/1/reject', {
      rejectReason: 'Нет обоснования',
    })
  })

  it('shows why a single approval failed (4xx)', async () => {
    http.put.mockRejectedValue(new ApiError(409, 'Запрос уже обработан'))
    render()
    const row = (await screen.findByText('Рама 60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Одобрить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Одобрить' }),
    )
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Запрос уже обработан'))
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('keeps the reject dialog and its reason when a single rejection fails', async () => {
    http.put.mockRejectedValue(new ApiError(400, 'Неверный запрос'))
    render()
    const row = (await screen.findByText('Рама 60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Отклонить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Причина/), 'Дорого')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отклонить' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Неверный запрос'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Причина/)).toHaveValue('Дорого')
  })

  it('says «0 of N» when every selected request fails', async () => {
    http.put.mockRejectedValue(new ApiError(409, 'x'))
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все ожидающие' }))
    await userEvent.click(screen.getByRole('button', { name: 'Одобрить выбранные' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Одобрить' }),
    )
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Выполнено 0 из 2'))
  })

  it('forgets the selection on another page', async () => {
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать запрос: Рама 60' }))
    expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 1 }))
    await userEvent.click(screen.getByRole('button', { name: 'Предыдущая страница' }))
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 0 }))
    expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Выбрать запрос: Рама 60' })).not.toBeChecked()
  })
})
