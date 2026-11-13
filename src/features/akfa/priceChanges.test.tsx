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

const ROWS = [
  {
    id: 11,
    productName: 'Рама 60',
    article: 'R60',
    textureName: 'Белый',
    akfaProductName: '(A) Rama 60 (SW306G)',
    groupName: 'Профили',
    pendingBasePrice: 50000,
    pendingBaseCurrencySymbol: 'сум',
    pendingPrice: 60000,
    pendingCurrencySymbol: 'сум',
    priceDeltaPercent: 20,
    priceStatus: 'PENDING',
    pendingSince: '2026-11-12T09:00:00',
  },
  {
    id: 12,
    productName: 'Створка 70',
    textureName: 'Дуб',
    akfaProductName: 'Stvorka 70',
    pendingBasePrice: 40000,
    pendingPrice: 38000,
    priceDeltaPercent: -5,
    priceStatus: 'PENDING',
    // the WinPro price was changed some other way
    stale: true,
  },
  {
    id: 13,
    productName: 'Импост',
    textureName: 'Белый',
    priceStatus: 'SYNCED',
    lastAppliedAt: '2026-11-10T10:00:00',
    lastAppliedPrice: 30000,
    lastAppliedBy: 'admin',
  },
]

const mappingParams = () =>
  http.get.mock.calls
    .filter(([u]) => u === '/v1/akfa/mappings')
    .map(([, c]) => (c as AxiosRequestConfig).params)

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/akfa/mappings') return { data: { data: ROWS, total: 3 } }
    if (url === '/v1/akfa/summary') return { data: {} }
    if (url === '/v1/akfa/products') return { data: { data: [], total: 0 } }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
})

const render = () =>
  renderWithProviders(<></>, { url: '/integrations/akfa?tab=prices', routes: akfaRoutes })

/** Confirms the dialog that's open (a ConfirmDialog). */
async function confirmWith(label: string) {
  await userEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: label }),
  )
}

describe('Akfa — price changes', () => {
  it('lists the pending ones first, 1-based; only pending ones can be chosen or acted on', async () => {
    render()
    const rama = (await screen.findByText('Рама 60')).closest('tr')!
    expect(mappingParams()[0]).toEqual({ priceStatus: 'PENDING', page: 1, size: 20 })
    expect(rama).toHaveTextContent('20,0%')
    expect(within(rama).getByLabelText('Большое изменение')).toBeInTheDocument()
    const stvorka = screen.getByText('Створка 70').closest('tr')!
    expect(stvorka).toHaveTextContent('Цена изменена другим способом')
    const synced = screen.getByText('Импост').closest('tr')!
    expect(within(synced).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(synced).queryByRole('button', { name: 'Подтвердить' })).not.toBeInTheDocument()
    expect(synced).toHaveTextContent('· admin')
  })

  it('filters by status and change size in the URL', async () => {
    const { router } = render()
    await screen.findByText('Рама 60')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Статус' }), 'ERROR')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Изменение цены' }), '10')
    await waitFor(() =>
      expect(mappingParams().at(-1)).toEqual({
        priceStatus: 'ERROR',
        minDelta: 10,
        page: 1,
        size: 20,
      }),
    )
    expect(router.state.location.search).toContain('prices.status=ERROR')
  })

  it('approves one; a stale price only after asking again, with force', async () => {
    http.put.mockImplementation(async (url: string) => {
      if (url === '/v1/akfa/mappings/12/approve-price?force=false')
        throw new ApiError(409, 'x', undefined, 'x', 'Цена WinPro изменена вручную 11.11')
      return { data: {} }
    })
    render()
    const row = (await screen.findByText('Створка 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Подтвердить' }))
    await confirmWith('Подтвердить')
    // the server's reason is shown in the second question
    expect(await screen.findByText('Цена WinPro изменена вручную 11.11')).toBeInTheDocument()
    await confirmWith('Подтвердить')
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/akfa/mappings/12/approve-price?force=true'),
    )
    expect(toast.success).toHaveBeenCalledWith('Подтверждено изменений цен: 1!')
  })

  it('stops when the stale one is not to be forced', async () => {
    http.put.mockRejectedValueOnce(new ApiError(409, 'stale'))
    render()
    const row = (await screen.findByText('Створка 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Подтвердить' }))
    await confirmWith('Подтвердить')
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: /Устаревших цен/ })).getByRole('button', {
        name: 'Отмена',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(http.put).toHaveBeenCalledTimes(1)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('approves the chosen ones and asks about the stale ones together', async () => {
    http.put.mockImplementation(async (url: string, body?: unknown) => {
      const { force } = body as { force: boolean }
      if (url === '/v1/akfa/mappings/bulk-approve-price')
        return force
          ? { data: { processed: [12] } }
          : { data: { processed: [11], skipped: [{ id: 12, reason: 'stale' }] } }
      return { data: {} }
    })
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все на странице' }))
    expect(screen.getByText('Выбрано: 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить выбранные' }))
    expect(await screen.findByText('Будет подтверждено изменений цен: 2.')).toBeInTheDocument()
    await confirmWith('Подтвердить')
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/akfa/mappings/bulk-approve-price', {
        ids: [11, 12],
        force: false,
      }),
    )
    expect(
      await screen.findByRole('dialog', { name: 'Устаревших цен (stale): 1' }),
    ).toBeInTheDocument()
    await confirmWith('Подтвердить')
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/akfa/mappings/bulk-approve-price', {
        ids: [12],
        force: true,
      }),
    )
    expect(toast.success).toHaveBeenCalledTimes(2)
    // a stale skip isn't reported as a warning: it was asked about
    expect(toast.warning).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument())
  })

  it('rejects one by its own call, several in bulk', async () => {
    http.put.mockImplementation(async (url: string) =>
      url === '/v1/akfa/mappings/bulk-reject-price'
        ? { data: { processed: [11], skipped: [{ id: 12, reason: 'уже обработано' }] } }
        : { data: {} },
    )
    render()
    const row = (await screen.findByText('Рама 60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Отклонить' }))
    await confirmWith('Отклонить')
    await waitFor(() => expect(http.put).toHaveBeenCalledWith('/v1/akfa/mappings/11/reject-price'))

    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все на странице' }))
    await userEvent.click(screen.getByRole('button', { name: 'Отклонить выбранные' }))
    await confirmWith('Отклонить')
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/akfa/mappings/bulk-reject-price', {
        ids: [11, 12],
      }),
    )
    expect(toast.warning).toHaveBeenCalledWith('#12: уже обработано')
  })

  it('says why an action was refused (4xx)', async () => {
    http.put.mockRejectedValue(new ApiError(400, 'Цена не найдена'))
    render()
    const row = (await screen.findByText('Рама 60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Отклонить' }))
    await confirmWith('Отклонить')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Цена не найдена'))
  })

  it('asks with the usual text when the stale answer has none', async () => {
    // an empty 409: the client's generic message, no backend text
    http.put.mockRejectedValueOnce(new ApiError(409, 'Что-то пошло не так'))
    render()
    const row = (await screen.findByText('Створка 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Подтвердить' }))
    await confirmWith('Подтвердить')
    expect(
      await screen.findByText(
        'Цена WinPro была изменена другим способом. Всё равно применить цену Akfa?',
      ),
    ).toBeInTheDocument()
  })

  it('warns about the skipped that are not stale, and shows a failed force', async () => {
    http.put.mockImplementation(async (_url: string, body?: unknown) => {
      const { force } = body as { force: boolean }
      if (force) throw new ApiError(400, 'Цена не найдена')
      return {
        data: {
          processed: [],
          skipped: [
            { id: 11, reason: 'уже обработано' },
            { id: 12, reason: 'stale' },
          ],
        },
      }
    })
    render()
    await screen.findByText('Рама 60')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все на странице' }))
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить выбранные' }))
    await confirmWith('Подтвердить')
    await confirmWith('Подтвердить') // the stale one: force
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Цена не найдена'))
    expect(toast.warning).toHaveBeenCalledWith('#11: уже обработано')
    expect(toast.warning).toHaveBeenCalledTimes(1)
  })
})
