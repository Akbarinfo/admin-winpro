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

const SEAL = {
  id: 63,
  name: 'Уплотнитель EPDM',
  nameInCatalog: 'EPDM кат',
  article: 'S-100',
  profileType: 'SEAL_SASH',
  unitId: 2,
  supplierId: 3,
  articleSpecificWeight: 0.12,
  waste: 5,
  drawingId: null,
}

const GETS: Record<string, unknown> = {
  '/v1/unit/list': [{ id: 2, name: 'м' }],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/product/series/list': [],
  '/v1/profile/system/list': [{ id: 9, name: 'Termo 70', parentName: 'Akfa' }],
  '/v1/product/enum/article/type/SEAL': [{ id: 1, name: 'SEAL_SASH' }],
  '/v1/country/list': [],
  '/v1/product/63': SEAL,
  '/v1/country-translation/PRODUCT/63': [],
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
      return { data: { data: [SEAL], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/product/seal') return { status: 200, data: { id: 64 } }
    return { status: 200, data: {} }
  })
  http.put.mockResolvedValue({ status: 200, data: { id: 63 } })
})

describe('Seals', () => {
  it('lists the SEAL group with a profile-system filter and no series', async () => {
    render('/product/seal')
    expect(await screen.findByText('Уплотнитель EPDM')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Уплотнения' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Профильная система' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Серия' })).not.toBeInTheDocument()
    expect(screen.queryByText('Полезная часть')).not.toBeInTheDocument()
    const body = http.post.mock.calls.find(([u]) => u === '/v1/product/table')![1]
    expect(body).toMatchObject({
      order: [{ column: 'id', dir: 'ASC' }],
      filter: { groupType: 'SEAL' },
    })
  })

  it('creates a seal with the old body (checkCreateEdit false)', async () => {
    const { router } = render('/product/seal/add')
    await userEvent.type(await screen.findByLabelText(NAME), 'Уплотнитель TPE')
    await userEvent.type(screen.getByLabelText(CATALOG), 'TPE кат')
    await userEvent.type(screen.getByLabelText(/Артикул/), 'S-200')
    await userEvent.type(screen.getByLabelText(/^Отход/), '4')
    // the seal form has no series and no profile sizes
    expect(screen.queryByLabelText(/^Серия/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Длина/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/seal', expect.any(FormData)),
    )
    const body = http.post.mock.calls.find(([u]) => u === '/v1/product/seal')![1] as FormData
    expect(await dataPart(body)).toEqual({
      id: null,
      name: 'Уплотнитель TPE',
      nameInCatalog: 'TPE кат',
      article: 'S-200',
      articleSpecificWeight: null,
      drawingId: null,
      unitId: null,
      unitName: '',
      supplierId: null,
      supplierName: '',
      profileType: '',
      waste: 4,
      checkCreateEdit: false,
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/seal'))
  })

  it('edits a seal by PUT with checkCreateEdit true', async () => {
    render('/product/seal/update/63')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Уплотнитель EPDM'))
    expect(screen.getByRole('heading', { name: 'Редактировать уплотнение' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/seal', expect.any(FormData)),
    )
    // exactly the 13 fields of the old edit body
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toEqual({
      id: '63',
      name: 'Уплотнитель EPDM',
      nameInCatalog: 'EPDM кат',
      article: 'S-100',
      articleSpecificWeight: 0.12,
      drawingId: null,
      unitId: 2,
      unitName: 'м',
      supplierId: 3,
      supplierName: 'Akfa',
      profileType: 'SEAL_SASH',
      waste: 5,
      checkCreateEdit: true,
    })
  })

  it('requires the waste, like the old form', async () => {
    render('/product/seal/add')
    await userEvent.type(await screen.findByLabelText(NAME), 'X')
    await userEvent.type(screen.getByLabelText(CATALOG), 'X')
    await userEvent.type(screen.getByLabelText(/Артикул/), 'X')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Заполните это поле')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalledWith('/v1/product/seal', expect.anything())
  })

  it('exports and imports with the seal URLs; a series in the URL is not sent', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/product/table')
        return { data: { data: [SEAL], recordsTotal: 1, recordsFiltered: 1 } }
      if (url.startsWith('/v1/product/excel/')) return { data: new Blob(['x']) }
      return { data: { isEmpty: true } }
    })
    render('/product/seal?seal.productSeriesId=5&seal.profileSystemId=9')
    await screen.findByText('Уплотнитель EPDM')
    expect(
      (http.post.mock.calls.find(([u]) => u === '/v1/product/table')![1] as { filter: object })
        .filter,
    ).toMatchObject({ productSeriesId: null, profileSystemId: 9, groupType: 'SEAL' })

    await userEvent.click(screen.getByRole('button', { name: 'Экспорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/excel/information',
        {
          filter: {
            searchTxt: null,
            groupType: 'SEAL',
            type: null,
            supplierId: null,
            productSeriesId: null,
            profileSystemId: 9,
          },
        },
        { responseType: 'blob' },
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Импорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Скачать шаблон' }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith('/v1/product/excel/seal/example', {
        responseType: 'blob',
      }),
    )
    await userEvent.upload(screen.getByLabelText('Файл Excel'), new File(['x'], 'seals.xlsx'))
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/seal/upload',
        expect.any(FormData),
        expect.anything(),
      ),
    )
  })
})
