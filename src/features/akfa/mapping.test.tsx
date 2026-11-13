import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import type { TextureOption } from './types'
import { akfaRoutes } from './index'

// The real akfaApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
const http = vi.mocked(api)

const WINPRO = [
  {
    productId: 7,
    productName: 'Рама 60',
    article: 'R60',
    unitName: 'м',
    articleGroupType: 'PROFILES',
    supplierName: 'Akfa',
    productSeriesName: 'Akfa 60',
    price: 50000,
    currencySymbol: 'сум',
    hasPrice: true,
    mappedTextureCount: 1,
    totalTextureCount: 2,
  },
]
const AKFA_ROWS = [
  {
    id: 400,
    externalId: 5001,
    name: '(A) Qanot (SW306G)',
    groupName: 'Профили',
    mappingStatus: 'NEW',
  },
  {
    id: 401,
    externalId: 5002,
    name: 'Rama oak',
    mappingStatus: 'MAPPED',
    linkedTextures: [{}, {}],
  },
]
// texture 21 is linked to Akfa 100, texture 22 to nothing
let textureOptions: TextureOption[] = [
  {
    textureId: 21,
    textureName: 'Белый',
    priceOne: 50000,
    currencySymbol: 'сум',
    mappedToAkfaProductId: 100,
    mappedToAkfaName: 'Rama white',
  },
  { textureId: 22, textureName: 'Дуб' },
]
const MAPPING_AKFA = [
  {
    id: 100,
    externalId: 7001,
    name: 'Rama white',
    linkedTextures: [{ productId: 7, productName: 'Рама 60', textureId: 21, textureName: 'Белый' }],
  },
  { id: 300, externalId: 7002, name: 'Rama oak', price: 61000, currency: 'сум' },
]

const paramsOf = (url: string) =>
  http.get.mock.calls.filter(([u]) => u === url).map(([, c]) => (c as AxiosRequestConfig)?.params)

beforeEach(() => {
  vi.clearAllMocks()
  textureOptions = [
    {
      textureId: 21,
      textureName: 'Белый',
      priceOne: 50000,
      currencySymbol: 'сум',
      mappedToAkfaProductId: 100,
      mappedToAkfaName: 'Rama white',
    },
    { textureId: 22, textureName: 'Дуб' },
  ]
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/akfa/winpro-products') return { data: { data: WINPRO, total: 1 } }
    if (url === '/v1/akfa/products') return { data: { data: AKFA_ROWS, total: 2 } }
    if (url === '/v1/akfa/winpro-products/7/texture-options') return { data: textureOptions }
    if (url === '/v1/akfa/mappings/akfa-products') return { data: { data: MAPPING_AKFA, total: 2 } }
    if (url === '/v1/akfa/summary') return { data: {} }
    if (url === '/v1/akfa/products/400/product-draft')
      return { data: { name: 'Qanot', article: 'Q1', articleGroupType: 'PROFILES', length: 6 } }
    if (url === '/v1/texture/list')
      return {
        data: [
          { id: 21, name: 'Белый' },
          { id: 25, name: 'SW306G' },
        ],
      }
    if (url === '/v1/akfa/mappings/export-template')
      return {
        data: new Blob(['x']),
        headers: { 'content-disposition': 'attachment; filename="map.xlsx"' },
      }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ status: 200, data: {} })
  http.post.mockResolvedValue({ status: 200, data: {} })
})

const render = (search = '') =>
  renderWithProviders(<></>, { url: `/integrations/akfa?tab=mapping${search}`, routes: akfaRoutes })

async function openProduct() {
  const result = render()
  await userEvent.click(await screen.findByRole('button', { name: 'Рама 60' }))
  const dialog = await screen.findByRole('dialog')
  await within(dialog).findByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' })
  await within(dialog).findByText('Rama oak')
  return { ...result, dialog }
}

describe('Akfa — mapping', () => {
  it('lists WinPro and Akfa products with their link state, filters in the URL', async () => {
    const { router } = render()
    const row = (await screen.findByRole('button', { name: 'Рама 60' })).closest('tr')!
    expect(row).toHaveTextContent('1 / 2 связано')
    expect(paramsOf('/v1/akfa/winpro-products')[0]).toEqual({
      linkStatus: 'all',
      page: 1,
      size: 20,
    })

    await userEvent.click(screen.getByRole('tab', { name: /Товары Akfa/ }))
    expect(router.state.location.search).toContain('view=akfa')
    const unlinked = (await screen.findByText('(A) Qanot (SW306G)')).closest('tr')!
    expect(within(unlinked).getByRole('button', { name: '+ Продукт WinPro' })).toBeInTheDocument()
    expect(screen.getByText('Rama oak').closest('tr')).toHaveTextContent('Связан · 2 текстур')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Связь' }), 'unmapped')
    await waitFor(() =>
      expect(paramsOf('/v1/akfa/products').at(-1)).toEqual({
        mappingStatus: 'NEW',
        page: 1,
        size: 20,
      }),
    )
  })

  it('links a product’s textures in the dialog and saves only the changes', async () => {
    const { dialog } = await openProduct()
    // the Akfa search starts from the product's name
    expect(paramsOf('/v1/akfa/mappings/akfa-products')[0]).toEqual({
      search: 'Рама',
      linkStatus: 'all',
      page: 1,
      size: 50,
    })
    expect(within(dialog).getByText('R60 · привязано 1/2 текстур')).toBeInTheDocument()

    // check «Дуб», link it to «Rama oak» with the button (no drag needed)
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' }))
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: /^Привязать \(1\).*Rama oak/,
      }),
    )
    expect(toast.info).toHaveBeenCalledWith('Текстур: 1 → 7002 Rama oak')
    // unlink «Белый»
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'Отвязать Белый' })[0])
    expect(within(dialog).getByText('Изменений: 2')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const [url, body, config] = http.put.mock.calls[0]
    expect(url).toBe('/v1/akfa/mappings/batch')
    // a 409 is read as a result (its conflicts), anything else failed still throws
    const { validateStatus } = config as AxiosRequestConfig
    expect([validateStatus!(409), validateStatus!(500), validateStatus!(200)]).toEqual([
      true,
      false,
      true,
    ])
    expect((body as { changes: unknown[] }).changes).toEqual(
      expect.arrayContaining([
        { productId: 7, textureId: 22, akfaProductId: 300, expectedAkfaProductId: null },
        { productId: 7, textureId: 21, akfaProductId: null, expectedAkfaProductId: 100 },
      ]),
    )
    expect(toast.success).toHaveBeenCalledWith('Рама 60: сохранено изменений — 2')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('asks before closing with unsaved changes', async () => {
    const { dialog } = await openProduct()
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' }))
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: /^Привязать \(1\).*Rama oak/,
      }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    expect(
      within(dialog).getByText('Несохранённых изменений: 1. Выйти без сохранения?'),
    ).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Остаться' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Выйти без сохранения' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(http.put).not.toHaveBeenCalled()
  })

  it('lists the rows another admin changed (409) and takes the server state for them', async () => {
    http.put.mockResolvedValue({ status: 409, data: { conflicts: [] } })
    const { dialog } = await openProduct()
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' }))
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: /^Привязать \(1\).*Rama oak/,
      }),
    )
    // meanwhile «Дуб» was linked to Akfa 100 by someone else
    textureOptions = [
      textureOptions[0],
      {
        textureId: 22,
        textureName: 'Дуб',
        mappedToAkfaProductId: 100,
        mappedToAkfaName: 'Rama white',
      },
    ]
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    const alert = await within(dialog).findByRole('alert')
    expect(alert).toHaveTextContent('Изменено другим администратором (1).')
    expect(alert).toHaveTextContent('Рама 60 · Дуб — сейчас: 7001 Rama white')
    await userEvent.click(within(alert).getByRole('button', { name: 'Обновить и продолжить' }))
    await waitFor(() => expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument())
    expect(toast.info).toHaveBeenLastCalledWith(
      'Обновлено: конфликтные строки возвращены к состоянию сервера',
    )
    // nothing left to save
    expect(within(dialog).getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('makes a WinPro product from an unlinked Akfa one, guessing its texture from the name', async () => {
    http.post.mockResolvedValue({ status: 200, data: { productId: 90, name: 'Qanot' } })
    render('&view=akfa')
    const row = (await screen.findByText('(A) Qanot (SW306G)')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: '+ Продукт WinPro' }))
    const dialog = await screen.findByRole('dialog', { name: /Новый продукт WinPro/ })
    await waitFor(() => expect(within(dialog).getByLabelText(/^Название/)).toHaveValue('Qanot'))
    expect(within(dialog).getByRole('combobox', { name: /Текстура/ })).toHaveValue('SW306G')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Создать' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/akfa/products/400/create-product', {
        // as the old modal: the empty product, the draft, the form
        product: {
          unitId: null,
          supplierId: null,
          productSeriesId: null,
          name: 'Qanot',
          article: 'Q1',
          articleGroupType: 'PROFILES',
          length: 6,
        },
        textureIds: [25],
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Создано: Qanot',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Открыть продукт' }) }),
    )
  })

  it('imports links from Excel: results, refused rows, and conflicts (409, nothing saved)', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    http.post.mockResolvedValueOnce({
      status: 200,
      data: {
        total: 10,
        applied: 7,
        skipped: 2,
        errors: [
          {
            row: 4,
            productId: 7,
            textureId: 22,
            field: 'akfaExternalId',
            value: '99',
            message: 'Нет такого товара',
          },
        ],
      },
    })
    render()
    await screen.findByRole('button', { name: 'Рама 60' })
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить через Excel' }))
    const dialog = await screen.findByRole('dialog', { name: 'Массовая загрузка через Excel' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Скачать шаблон' }))
    await waitFor(() =>
      expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('map.xlsx'),
    )

    const input = within(dialog).getByLabelText('2. Выберите файл и загрузите')
    await userEvent.upload(input, new File(['x'], 'links.xlsx'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))
    await waitFor(() =>
      expect(within(dialog).getByText('Применено').parentElement).toHaveTextContent('7'),
    )
    expect(within(dialog).getByText('Нет такого товара')).toBeInTheDocument()

    http.post.mockResolvedValueOnce({
      status: 409,
      data: {
        conflicts: [
          {
            productId: 7,
            textureId: 21,
            productName: 'Рама 60',
            textureName: 'Белый',
            currentAkfaProductName: 'Rama oak',
          },
        ],
      },
    })
    await userEvent.upload(input, new File(['x'], 'links.xlsx'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))
    expect(
      await within(dialog).findByText(/Рама 60 · Белый — сейчас: Rama oak/),
    ).toBeInTheDocument()
    click.mockRestore()
  })

  it('maps every product in global mode: products a page at a time, their textures each', async () => {
    const get = http.get.getMockImplementation()!
    http.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
      if (url === '/v1/akfa/winpro-products' && (config?.params as { size?: number })?.size === 20)
        return { data: { data: [WINPRO[0]], total: 1 } }
      return get(url, config)
    })
    render()
    await screen.findByRole('button', { name: 'Рама 60' })
    await userEvent.click(screen.getByRole('button', { name: 'Маппинг' }))
    const dialog = await screen.findByRole('dialog', { name: 'Маппинг' })
    await within(dialog).findByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' })
    expect(paramsOf('/v1/akfa/winpro-products')).toContainEqual({ page: 1, size: 20 })
    // each product's textures under its name
    expect(within(dialog).getByText('Рама 60', { selector: 'p' })).toBeInTheDocument()
    // only the unlinked ones
    await userEvent.click(within(dialog).getAllByRole('checkbox', { name: 'Не привязанные' })[0])
    expect(
      within(dialog).queryByRole('checkbox', { name: 'Отметить Рама 60 · Белый' }),
    ).not.toBeInTheDocument()
    // the texture search goes to the server
    await userEvent.type(
      within(dialog).getByRole('searchbox', { name: /Продукт WinPro или текстура/ }),
      'рама',
    )
    await waitFor(() =>
      expect(paramsOf('/v1/akfa/winpro-products')).toContainEqual({
        search: 'рама',
        page: 1,
        size: 20,
      }),
    )
  })

  it('says why when a 409 names no rows, and stops loading a list that failed', async () => {
    http.put.mockResolvedValue({ status: 409, data: { message: 'Повторите позже' } })
    const get = http.get.getMockImplementation()!
    let akfaCalls = 0
    http.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
      if (url === '/v1/akfa/mappings/akfa-products') {
        akfaCalls++
        // the first page is a full one, the next fails
        if ((config?.params as { page?: number } | undefined)?.page === 1)
          return {
            data: {
              data: Array.from({ length: 50 }, (_, i) => ({ id: 1000 + i, name: `A${i}` })),
              total: 200,
            },
          }
        throw new Error('down')
      }
      return get(url, config)
    })
    const { dialog } = await (async () => {
      const r = render()
      await userEvent.click(await screen.findByRole('button', { name: 'Рама 60' }))
      const d = await screen.findByRole('dialog')
      await within(d).findByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' })
      return { ...r, dialog: d }
    })()
    expect(await within(dialog).findByText('Не удалось загрузить данные')).toBeInTheDocument()
    const calls = akfaCalls
    await new Promise((r) => setTimeout(r, 50))
    expect(akfaCalls).toBe(calls) // no endless retries

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Отметить Рама 60 · Дуб' }))
    await userEvent.click(within(dialog).getByRole('button', { name: /^Привязать \(1\).*A0$/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Повторите позже'))
  })
})
