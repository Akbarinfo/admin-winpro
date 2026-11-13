import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { akfaRoutes } from './index'

// The real akfaApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const MESSAGES = [
  {
    id: 501,
    receivedAt: '2026-11-12T08:00:00',
    processedAt: '2026-11-12T08:00:02',
    messageType: 'PRODUCT_RATE',
    queue: 'akfa.rates',
    itemCount: 40,
    failedCount: 2,
    status: 'PARTIAL',
    attempts: 2,
    error: 'Курс USD не найден',
  },
  { id: 502, messageType: 'PRODUCT', queue: 'akfa.products', itemCount: 1, status: 'PROCESSED' },
]

const messageParams = () =>
  http.get.mock.calls
    .filter(([u]) => u === '/v1/akfa/messages')
    .map(([, c]) => (c as AxiosRequestConfig).params)

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/akfa/messages') return { data: { data: MESSAGES, total: 2 } }
    if (url === '/v1/akfa/messages/501')
      return { data: { ...MESSAGES[0], body: '{"rates":[{"id":1,"rate":52000}]}' } }
    if (url === '/v1/akfa/summary') return { data: {} }
    if (url === '/v1/akfa/products') return { data: { data: [], total: 0 } }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
})

const render = () =>
  renderWithProviders(<></>, { url: '/integrations/akfa?tab=log', routes: akfaRoutes })

describe('Akfa — message log', () => {
  it('lists messages 1-based and filters by status and type', async () => {
    render()
    const row = (await screen.findByText('akfa.rates')).closest('tr')!
    expect(messageParams()[0]).toEqual({ page: 1, size: 20 })
    expect(row).toHaveTextContent('40 / 2 ✕')
    expect(row).toHaveTextContent('×2')
    expect(row).toHaveTextContent('Курс USD не найден')
    // a processed one can't be retried
    const done = screen.getByText('akfa.products').closest('tr')!
    expect(within(done).queryByRole('button', { name: 'Повторить' })).not.toBeInTheDocument()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Статус сообщения' }),
      'FAILED',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Тип сообщения' }),
      'PRODUCT',
    )
    await waitFor(() =>
      expect(messageParams().at(-1)).toEqual({
        status: 'FAILED',
        type: 'PRODUCT',
        page: 1,
        size: 20,
      }),
    )
  })

  it('shows a message in full, its body as indented JSON', async () => {
    render()
    const row = (await screen.findByText('akfa.rates')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Подробнее' }))
    const dialog = await screen.findByRole('dialog', { name: '#501 · PRODUCT_RATE' })
    await waitFor(() => expect(dialog.querySelector('pre')).toHaveTextContent('"rate": 52000'))
    expect(within(dialog).getByText('Курс USD не найден')).toBeInTheDocument()
  })

  it('processes a failed or partial message again', async () => {
    render()
    const row = (await screen.findByText('akfa.rates')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Повторить' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/akfa/messages/501/retry'))
    expect(toast.success).toHaveBeenCalledWith('Сообщение отправлено на повторную обработку')
  })

  it('recalculates the prices after confirmation, and says why it was refused', async () => {
    render()
    await screen.findByText('akfa.rates')
    await userEvent.click(screen.getByRole('button', { name: 'Пересчитать все цены' }))
    const dialog = await screen.findByRole('dialog', { name: 'Пересчитать цены?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Пересчитать все цены' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/akfa/rates/recalculate'))
    expect(toast.success).toHaveBeenCalledWith('Пересчёт запущен')

    http.post.mockRejectedValue(new ApiError(409, 'Пересчёт уже идёт'))
    await userEvent.click(screen.getByRole('button', { name: 'Пересчитать все цены' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Пересчитать все цены',
      }),
    )
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Пересчёт уже идёт'))
  })

  it('links to the unit mapping', async () => {
    render()
    await screen.findByText('akfa.rates')
    expect(screen.getByRole('link', { name: 'Сопоставление единиц AKFA' })).toHaveAttribute(
      'href',
      '/integrations/unit',
    )
  })

  it('says why a retry was refused, and shows the row when its detail fails', async () => {
    http.post.mockRejectedValue(new ApiError(409, 'Уже в обработке'))
    const get = http.get.getMockImplementation()!
    http.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
      if (url === '/v1/akfa/messages/501') throw new ApiError(404, 'Нет такого')
      return get(url, config)
    })
    render()
    const row = (await screen.findByText('akfa.rates')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Повторить' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Уже в обработке'))

    await userEvent.click(within(row).getByRole('button', { name: 'Подробнее' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Не удалось загрузить данные')).toBeInTheDocument()
    // what the row had: its error, no body
    expect(within(dialog).getByText('Курс USD не найден')).toBeInTheDocument()
  })

  it('asks for page 2', async () => {
    renderWithProviders(<></>, { url: '/integrations/akfa?tab=log&log.page=2', routes: akfaRoutes })
    await screen.findByText('akfa.rates')
    expect(messageParams()[0]).toEqual({ page: 2, size: 20 })
  })
})
