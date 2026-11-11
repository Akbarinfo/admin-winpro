import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { productRoutes } from '../index'

// The real productApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
// Files are «saved» by clicking a link; here nothing is saved.
vi.mock('@/shared/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/download')>()),
  saveBlob: vi.fn(),
}))
const http = vi.mocked(api)

const FILLING = {
  id: 81,
  name: 'Стеклопакет 4-16-4',
  nameInCatalog: '4-16-4 кат',
  article: 'G-4164',
  profileType: 'GLASS',
  unitId: 4,
  supplierId: 3,
  length: 2000,
  width: 1500,
  thickness: 24,
  articleSpecificWeight: 25.5,
  waste: 2,
  needCuttingOptimization: true,
  drawingId: 12,
}

const GETS: Record<string, unknown> = {
  '/v1/unit/list': [{ id: 4, name: 'м²' }],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/product/series/list': [],
  '/v1/profile/system/list': [],
  '/v1/product/enum/article/type/FILLINGS': [{ id: 1, name: 'GLASS' }],
  '/v1/country/list': [],
  '/v1/product/81': FILLING,
  '/v1/country-translation/PRODUCT/81': [],
}

// The page's own fields, not the translation table's «Наименование — Kazakhstan».
const NAME = /^Наименование(?! —)/
const CATALOG = /^Имя в каталоге(?! —)/

const dataPart = async (body: FormData) => JSON.parse(await (body.get('data') as Blob).text())
const render = (url: string) => renderWithProviders(<></>, { url, routes: productRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    if (url.includes('example')) return { data: new Blob(['template']) }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/product/table')
      return { data: { data: [FILLING], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/product/filling') return { status: 200, data: { id: 82 } }
    return { status: 200, data: {} }
  })
  http.put.mockResolvedValue({ status: 200, data: { id: 81 } })
})

describe('Fillings', () => {
  it('lists the FILLINGS group without series and profile-system filters', async () => {
    render('/product/filling?filling.profileSystemId=9')
    expect(await screen.findByText('Стеклопакет 4-16-4')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Заполнение' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Профильная система' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Серия' })).not.toBeInTheDocument()
    const body = http.post.mock.calls.find(([u]) => u === '/v1/product/table')![1]
    expect(body).toMatchObject({
      order: [{ column: 'id', dir: 'ASC' }],
      filter: { groupType: 'FILLINGS', productSeriesId: null, profileSystemId: null },
    })
  })

  it('creates a filling with cutting optimization off by default', async () => {
    const { router } = render('/product/filling/add')
    await userEvent.type(await screen.findByLabelText(NAME), 'Стекло 4 мм')
    await userEvent.type(screen.getByLabelText(CATALOG), 'Стекло кат')
    await userEvent.type(screen.getByLabelText(/Артикул/), 'G-4')
    await userEvent.type(screen.getByLabelText(/^Длина/), '3210')
    await userEvent.type(screen.getByLabelText(/^Ширина/), '2250')
    await userEvent.type(screen.getByLabelText(/^Толщина/), '4')
    await userEvent.type(screen.getByLabelText(/^Отход/), '1,5')
    expect(screen.getByRole('switch', { name: 'Оптимизация раскроя' })).not.toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/filling', expect.any(FormData)),
    )
    const body = http.post.mock.calls.find(([u]) => u === '/v1/product/filling')![1] as FormData
    expect(await dataPart(body)).toEqual({
      id: null,
      name: 'Стекло 4 мм',
      nameInCatalog: 'Стекло кат',
      article: 'G-4',
      length: 3210,
      width: 2250,
      thickness: 4,
      articleSpecificWeight: null,
      drawingId: null,
      unitId: null,
      unitName: '',
      supplierId: null,
      supplierName: '',
      profileType: '',
      waste: 1.5,
      needCuttingOptimization: false,
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/filling'))
  })

  it('edits a filling by PUT with exactly the old body', async () => {
    render('/product/filling/update/81')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Стеклопакет 4-16-4'))
    expect(screen.getByRole('heading', { name: 'Редактировать заполнение' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Оптимизация раскроя' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/filling', expect.any(FormData)),
    )
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toEqual({
      id: '81',
      name: 'Стеклопакет 4-16-4',
      nameInCatalog: '4-16-4 кат',
      article: 'G-4164',
      length: 2000,
      width: 1500,
      thickness: 24,
      articleSpecificWeight: 25.5,
      drawingId: 12,
      unitId: 4,
      unitName: 'м²',
      supplierId: 3,
      supplierName: 'Akfa',
      profileType: 'GLASS',
      waste: 2,
      needCuttingOptimization: true,
    })
  })

  it('requires the sizes and the waste, like the old form', async () => {
    render('/product/filling/add')
    await screen.findByLabelText(NAME)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    // name, catalog name, article + length, width, thickness, waste
    expect(await screen.findAllByText('Заполните это поле')).toHaveLength(7)
    expect(http.post).not.toHaveBeenCalledWith('/v1/product/filling', expect.anything())
  })

  it('exports and imports with the filling URLs', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/product/table')
        return { data: { data: [FILLING], recordsTotal: 1, recordsFiltered: 1 } }
      if (url.startsWith('/v1/product/excel/')) return { data: new Blob(['x']) }
      return { data: { isEmpty: true } }
    })
    render('/product/filling')
    await screen.findByText('Стеклопакет 4-16-4')

    await userEvent.click(screen.getByRole('button', { name: 'Экспорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/excel/information',
        {
          filter: {
            searchTxt: null,
            groupType: 'FILLINGS',
            type: null,
            supplierId: null,
            productSeriesId: null,
            profileSystemId: null,
          },
        },
        { responseType: 'blob' },
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Импорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Скачать шаблон' }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith('/v1/product/excel/filling/example', {
        responseType: 'blob',
      }),
    )
    await userEvent.upload(screen.getByLabelText('Файл Excel'), new File(['x'], 'fillings.xlsx'))
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/filling/upload',
        expect.any(FormData),
        expect.anything(),
      ),
    )
  })
})
