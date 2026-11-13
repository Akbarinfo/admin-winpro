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

const RAMA = {
  id: 1,
  externalId: 5001,
  externalStatus: 'ACTIVE',
  name: '(A) Rama 60 (SW306G)',
  groupName: 'Профили',
  unitName: 'м',
  currentRate: 52000,
  currentRateCurrency: 'UZS',
  currentRateDate: '2026-11-10',
  isNew: true,
  firstSeenAt: '2026-11-10T09:30:00',
}
const STVORKA = { ...RAMA, id: 2, externalId: 5002, name: 'Stvorka 70', isNew: false }

const POSITIONS = [
  {
    productId: 7,
    productName: 'Рама 60',
    article: 'R60',
    textureId: 21,
    textureName: 'Белый',
    price: 50000,
    currencySymbol: 'сум',
  },
  // already linked to another Akfa product
  {
    productId: 7,
    productName: 'Рама 60',
    article: 'R60',
    textureId: 22,
    textureName: 'Дуб',
    price: 61000,
    currencySymbol: 'сум',
    mappedToAkfaProductId: 99,
    mappedToAkfaName: 'Rama 60 oak',
  },
]

type Params = Record<string, unknown> | undefined
const getParams = (url: string) =>
  http.get.mock.calls
    .filter(([u]) => u === url)
    .map(([, config]) => (config as { params?: Params })?.params)

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
    const p = (config?.params ?? {}) as Record<string, unknown>
    if (url === '/v1/akfa/summary')
      return {
        data: {
          listenerRunning: true,
          lastMessageAt: '2026-11-12T14:05:00',
          unmappedCount: 12,
          pendingPriceCount: 3,
          needsReviewCount: 1,
          priceErrorCount: 0,
          unsupportedPriceCount: 2,
        },
      }
    if (url === '/v1/akfa/products') {
      if (p.size === 1)
        return {
          data: {
            data: [],
            total: p.mappingStatus === 'MAPPED' ? 40 : p.mappingStatus === 'IGNORED' ? 5 : 9,
          },
        }
      return { data: { data: [RAMA, STVORKA], total: 2, page: 1, size: 20 } }
    }
    if (url === '/v1/akfa/positions/search') return { data: POSITIONS }
    if (url === '/v1/texture/list/by/productId/7')
      return {
        data: [
          { id: 21, name: 'Белый' },
          { id: 23, name: 'Антрацит' },
        ],
      }
    if (url === '/v1/akfa/products/1/product-draft')
      return {
        data: {
          name: 'Rama 60',
          article: 'SW306G',
          articleGroupType: 'PROFILES',
          unitId: 3,
          textureId: 21,
        },
      }
    if (url === '/v1/product/series/list') return { data: [{ id: 4, name: 'Akfa 60' }] }
    if (url === '/v1/unit/list') return { data: [{ id: 3, name: 'м' }] }
    if (url === '/v1/supplier/list') return { data: [{ id: 6, name: 'Akfa' }] }
    if (url === '/v1/texture/list')
      return {
        data: [
          { id: 21, name: 'Белый' },
          { id: 23, name: 'Антрацит' },
        ],
      }
    if (url === '/v1/akfa/products/export')
      return {
        data: new Blob(['x']),
        headers: { 'content-disposition': `attachment; filename*=UTF-8''akfa%20new.xlsx` },
      }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/akfa/products/ignore') return { data: { ignored: [1], skipped: [] } }
    if (url === '/v1/akfa/products/1/map')
      return {
        data: [
          {
            id: 70,
            productName: 'Рама 60',
            textureName: 'Белый',
            pendingPrice: 52000,
            pendingCurrencySymbol: 'сум',
            pendingBasePrice: 50000,
            pendingBaseCurrencySymbol: 'сум',
          },
        ],
      }
    if (url === '/v1/akfa/products/1/create-product')
      return { data: { productId: 80, name: 'Rama 60' } }
    return { data: {} }
  })
})

const render = (url = '/integrations/akfa') =>
  renderWithProviders(<></>, { url, routes: akfaRoutes })

describe('Akfa integration — summary and new products', () => {
  it('shows the listener and the counts, some from the product list totals', async () => {
    render()
    expect(await screen.findByText('Consumer работает')).toBeInTheDocument()
    expect(screen.getByText(/12\.11\.2026 14:05/)).toBeInTheDocument()
    const mapped = await screen.findByText('Сопоставлено')
    await waitFor(() => expect(mapped.parentElement).toHaveTextContent('40'))
    expect(screen.getByText('Требуют сопоставления (опт + новые)').parentElement).toHaveTextContent(
      '12',
    )
    expect(getParams('/v1/akfa/products')).toEqual(
      expect.arrayContaining([
        { mappingStatus: 'MAPPED', size: 1 },
        { mappingStatus: 'IGNORED', size: 1 },
        { source: 'PRODUCT', size: 1 },
      ]),
    )
  })

  it('lists new products 1-based, 20 a page, without empty filters; filters and searches', async () => {
    render()
    const row = (await screen.findByText('(A) Rama 60 (SW306G)')).closest('tr')!
    expect(within(row).getByText('Новый')).toBeInTheDocument()
    expect(within(row).getByText('#5001 · ACTIVE')).toBeInTheDocument()
    expect(getParams('/v1/akfa/products')).toContainEqual({ source: 'PRODUCT', page: 1, size: 20 })

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Показать' }), 'true')
    await waitFor(() =>
      expect(getParams('/v1/akfa/products')).toContainEqual({
        source: 'PRODUCT',
        isNew: true,
        page: 1,
        size: 20,
      }),
    )
    await userEvent.type(screen.getByRole('searchbox'), 'rama')
    await waitFor(() =>
      expect(getParams('/v1/akfa/products')).toContainEqual(
        expect.objectContaining({ search: 'rama' }),
      ),
    )
  })

  it('ignores the chosen ones with a reason, and warns about the skipped', async () => {
    http.post.mockImplementation(async (url: string) =>
      url === '/v1/akfa/products/ignore'
        ? { data: { ignored: [1], skipped: [{ id: 2, reason: 'уже сопоставлен' }] } }
        : { data: {} },
    )
    render()
    await screen.findByText('Stvorka 70')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все на странице' }))
    expect(screen.getByText('Выбрано: 2')).toBeInTheDocument()
    // the toolbar's button (each row has its own too)
    await userEvent.click(screen.getAllByRole('button', { name: 'Игнорировать' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Причина игнорирования (2 товаров)' })
    await userEvent.type(within(dialog).getByRole('textbox'), '  дубликат  ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Игнорировать' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/ignore', {
        ids: [1, 2],
        reason: 'дубликат',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('Проигнорировано товаров: 1')
    expect(toast.warning).toHaveBeenCalledWith('#2: уже сопоставлен')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument()
  })

  it('maps a new product to chosen positions and shows their price states', async () => {
    render()
    const row = (await screen.findByText('(A) Rama 60 (SW306G)')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Сопоставить' }))
    // opening a new one marks it seen
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/1/mark-seen'))
    const dialog = await screen.findByRole('dialog', { name: 'Сопоставление с продуктом WinPro' })
    expect(within(dialog).getByText('Позиции ещё не выбраны')).toBeInTheDocument()

    await userEvent.type(
      within(dialog).getByRole('searchbox', { name: /Поиск по названию/ }),
      'рама',
    )
    const white = await within(dialog).findByRole('checkbox', { name: 'Белый' })
    expect(getParams('/v1/akfa/positions/search').at(-1)).toEqual({ q: 'рама' })
    // linked to another Akfa product: can't be chosen
    expect(within(dialog).getByRole('checkbox', { name: 'Дуб' })).toBeDisabled()
    expect(within(dialog).getByText('привязано: Rama 60 oak')).toBeInTheDocument()

    // the textures without a price come on request
    await userEvent.click(within(dialog).getByRole('button', { name: 'Все текстуры: Рама 60' }))
    expect(await within(dialog).findByRole('checkbox', { name: 'Антрацит' })).toBeInTheDocument()
    expect(within(dialog).getByText('Цена не задана')).toBeInTheDocument()

    await userEvent.click(white)
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Антрацит' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сопоставить (2)' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/1/map', {
        targets: [
          { productId: 7, textureId: 21 },
          { productId: 7, textureId: 23 },
        ],
      }),
    )
    expect(await within(dialog).findByText('Сохранено. Статус цен:')).toBeInTheDocument()
    expect(within(dialog).getByText(/50 000 сум →/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'Закрыть' }).at(-1)!)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('says why a mapping was refused (4xx)', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/akfa/products/2/map') throw new ApiError(409, 'Позиция уже привязана')
      return { data: {} }
    })
    render()
    const row = (await screen.findByText('Stvorka 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Сопоставить' }))
    expect(http.post).not.toHaveBeenCalledWith('/v1/akfa/products/2/mark-seen')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сопоставить (0)' }))
    expect(toast.warning).toHaveBeenCalledWith('Выберите хотя бы одну позицию WinPro')
    await userEvent.type(
      within(dialog).getByRole('searchbox', { name: /Поиск по названию/ }),
      'рама',
    )
    await userEvent.click(await within(dialog).findByRole('checkbox', { name: 'Белый' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сопоставить (1)' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Позиция уже привязана'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('creates a WinPro product from the draft and links it', async () => {
    render()
    const row = (await screen.findByText('(A) Rama 60 (SW306G)')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Сопоставить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать новый продукт' }))
    await waitFor(() => expect(within(dialog).getByLabelText(/^Артикул/)).toHaveValue('SW306G'))
    expect(within(dialog).getByLabelText(/^Название/)).toHaveValue('Rama 60')

    // a texture is required
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать продукт' }))
    expect(within(dialog).getByText('Выберите хотя бы одну текстуру')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalledWith(
      '/v1/akfa/products/1/create-product',
      expect.anything(),
    )

    await userEvent.click(within(dialog).getByLabelText(/^Текстуры/))
    await userEvent.click(await screen.findByRole('option', { name: 'Белый' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать продукт' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/1/create-product', {
        // the whole draft goes with the product, as the old modal sent it
        product: {
          name: 'Rama 60',
          article: 'SW306G',
          articleGroupType: 'PROFILES',
          length: null,
          unitId: 3,
          supplierId: null,
          productSeriesId: null,
          textureId: 21,
        },
        textureIds: [21],
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('Продукт "Rama 60" создан и привязан')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('exports the unmapped products under the name the backend gives', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    render()
    await screen.findByText('Stvorka 70')
    await userEvent.click(
      screen.getByRole('button', { name: 'Экспорт в Excel (несопоставленные)' }),
    )
    await waitFor(() => expect(click).toHaveBeenCalled())
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('akfa new.xlsx')
    click.mockRestore()
  })

  it('keeps the tab in the URL', async () => {
    const { router } = render()
    await screen.findByText('Stvorka 70')
    await userEvent.click(screen.getByRole('tab', { name: 'Изменения цен' }))
    expect(router.state.location.search).toBe('?tab=prices')
  })

  it('drops the «Новый» mark in place once a product is opened', async () => {
    render()
    const row = (await screen.findByText('(A) Rama 60 (SW306G)')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Сопоставить' }))
    await waitFor(() => expect(within(row).queryByText('Новый')).not.toBeInTheDocument())
  })

  it('pages from 1 and asks for page 2', async () => {
    render('/integrations/akfa?new.page=2')
    await screen.findByText('Stvorka 70')
    expect(getParams('/v1/akfa/products')).toContainEqual({ source: 'PRODUCT', page: 2, size: 20 })
  })

  it('shows a refused ignore (4xx), but not a backend warning (420) twice', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/akfa/products/ignore') throw new ApiError(409, 'Товар уже сопоставлен')
      return { data: {} }
    })
    render()
    const row = (await screen.findByText('Stvorka 70')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Игнорировать' }))
    const dialog = await screen.findByRole('dialog', { name: 'Причина игнорирования' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Игнорировать' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Товар уже сопоставлен'))
    expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/ignore', { ids: [2], reason: '' })
    // as the old tab: the dialog closes either way
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // 420: the API client warns itself; nothing more here
    vi.mocked(toast.error).mockClear()
    http.post.mockRejectedValue(new ApiError(420, 'Подождите'))
    await userEvent.click(within(row).getByRole('button', { name: 'Игнорировать' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Игнорировать' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('says why the export or a new product was refused', async () => {
    const get = http.get.getMockImplementation()!
    http.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
      if (url === '/v1/akfa/products/export')
        throw new ApiError(409, 'Нет несопоставленных товаров')
      return get(url, config)
    })
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/akfa/products/1/create-product') throw new ApiError(409, 'Артикул занят')
      return { data: {} }
    })
    render()
    await screen.findByText('Stvorka 70')
    await userEvent.click(
      screen.getByRole('button', { name: 'Экспорт в Excel (несопоставленные)' }),
    )
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Нет несопоставленных товаров'))

    const row = screen.getByText('(A) Rama 60 (SW306G)').closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Сопоставить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать новый продукт' }))
    await waitFor(() => expect(within(dialog).getByLabelText(/^Артикул/)).toHaveValue('SW306G'))
    await userEvent.click(within(dialog).getByLabelText(/^Текстуры/))
    await userEvent.click(await screen.findByRole('option', { name: 'Белый' }))
    // Enter in a field saves, as the old form did
    await userEvent.type(within(dialog).getByLabelText(/^Название/), '{Enter}')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Артикул занят'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
