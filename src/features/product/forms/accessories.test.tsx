import { screen, waitFor, within } from '@testing-library/react'
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

const HANDLE = {
  id: 91,
  name: 'Ручка Roto',
  nameInCatalog: 'Roto кат',
  article: 'R-1',
  profileType: 'FITTINGS',
  subtype: 'HANDLE',
  handleType: 'Handle3',
  unitId: 5,
  supplierId: 3,
  articleSpecificWeight: 0.3,
  drawingId: null,
}

const GETS: Record<string, unknown> = {
  '/v1/unit/list': [{ id: 5, name: 'шт' }],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/product/series/list': [],
  '/v1/profile/system/list': [{ id: 9, name: 'Termo 70', parentName: 'Akfa' }],
  '/v1/product/enum/article/type/ACCESSORIES': [
    { id: 1, name: 'FITTINGS' },
    { id: 2, name: 'SCREW' },
  ],
  '/v1/product/enum/article/subtype': [
    { id: 1, name: 'HANDLE' },
    { id: 2, name: 'HINGE' },
  ],
  '/v1/country/list': [],
  '/v1/product/91': HANDLE,
  '/v1/country-translation/PRODUCT/91': [],
}

// The page's own fields, not the translation table's «Наименование — Kazakhstan».
const NAME = /^Наименование(?! —)/
const CATALOG = /^Имя в каталоге(?! —)/

const dataPart = async (body: FormData) => JSON.parse(await (body.get('data') as Blob).text())
const render = (url: string) => renderWithProviders(<></>, { url, routes: productRoutes })
const savedBody = async () =>
  dataPart(http.post.mock.calls.find(([u]) => u === '/v1/product/accessories')![1] as FormData)

const fillMain = async () => {
  await userEvent.type(await screen.findByLabelText(NAME), 'Ручка Maco')
  await userEvent.type(screen.getByLabelText(CATALOG), 'Maco кат')
  await userEvent.type(screen.getByLabelText(/Артикул/), 'M-1')
}

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    if (url.includes('example')) return { data: new Blob(['template']) }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/product/table')
      return { data: { data: [HANDLE], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/product/accessories') return { status: 200, data: { id: 92 } }
    if (url.startsWith('/v1/product/excel/')) return { data: new Blob(['x']) }
    return { status: 200, data: { isEmpty: true } }
  })
  http.put.mockResolvedValue({ status: 200, data: { id: 91 } })
})

describe('Accessories', () => {
  it('lists the ACCESSORIES group with a profile-system filter', async () => {
    render('/product/accessories')
    expect(await screen.findByText('Ручка Roto')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Фурнитуры' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Профильная система' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Серия' })).not.toBeInTheDocument()
    const body = http.post.mock.calls.find(([u]) => u === '/v1/product/table')![1]
    expect(body).toMatchObject({ filter: { groupType: 'ACCESSORIES', productSeriesId: null } })
  })

  it('creates a handle: fittings → subtype HANDLE → its picture', async () => {
    render('/product/accessories/add')
    await fillMain()
    // no subtype until the type is fittings
    expect(screen.queryByLabelText(/^Подтип/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/^Тип/))
    await userEvent.click(await screen.findByRole('option', { name: 'Фурнитура' }))
    await userEvent.click(await screen.findByLabelText(/^Подтип/))
    await userEvent.click(await screen.findByRole('option', { name: 'Ручка' }))

    const handles = await screen.findByRole('radiogroup', { name: 'Ручка' })
    await userEvent.click(within(handles).getByRole('radio', { name: /^Handle6$/ }))
    expect(within(handles).getByRole('radio', { name: /^Handle6$/ })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/accessories', expect.any(FormData)),
    )
    expect(await savedBody()).toEqual({
      id: null,
      name: 'Ручка Maco',
      nameInCatalog: 'Maco кат',
      article: 'M-1',
      articleSpecificWeight: null,
      drawingId: null,
      unitId: null,
      unitName: '',
      supplierId: null,
      supplierName: '',
      profileType: 'FITTINGS',
      subtype: 'HANDLE',
      handleType: 'Handle6',
    })
  })

  it('sends no subtype and handle for other types', async () => {
    render('/product/accessories/add')
    await fillMain()
    await userEvent.click(screen.getByLabelText(/^Тип/))
    await userEvent.click(await screen.findByRole('option', { name: 'SCREW' }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/accessories', expect.any(FormData)),
    )
    expect(await savedBody()).toMatchObject({
      profileType: 'SCREW',
      subtype: null,
      handleType: null,
    })
  })

  it('edits a handle by PUT with exactly the old body', async () => {
    render('/product/accessories/update/91')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Ручка Roto'))
    expect(screen.getByRole('heading', { name: 'Редактировать аксессуары' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Handle3$/ })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/accessories', expect.any(FormData)),
    )
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toEqual({
      id: '91',
      name: 'Ручка Roto',
      nameInCatalog: 'Roto кат',
      article: 'R-1',
      articleSpecificWeight: 0.3,
      drawingId: null,
      unitId: 5,
      unitName: 'шт',
      supplierId: 3,
      supplierName: 'Akfa',
      profileType: 'FITTINGS',
      subtype: 'HANDLE',
      handleType: 'Handle3',
    })
  })

  it('exports and imports with the accessories URLs', async () => {
    render('/product/accessories')
    await screen.findByText('Ручка Roto')
    await userEvent.click(screen.getByRole('button', { name: 'Экспорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/excel/information',
        { filter: expect.objectContaining({ groupType: 'ACCESSORIES', productSeriesId: null }) },
        { responseType: 'blob' },
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Импорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Скачать шаблон' }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith('/v1/product/excel/accessories/example', {
        responseType: 'blob',
      }),
    )
    await userEvent.upload(screen.getByLabelText('Файл Excel'), new File(['x'], 'acc.xlsx'))
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/accessories/upload',
        expect.any(FormData),
        expect.anything(),
      ),
    )
  })

  it('sends an empty subtype for fittings without one, as the old form', async () => {
    render('/product/accessories/add')
    await fillMain()
    await userEvent.click(screen.getByLabelText(/^Тип/))
    await userEvent.click(await screen.findByRole('option', { name: 'Фурнитура' }))
    await screen.findByLabelText(/^Подтип/)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/accessories', expect.any(FormData)),
    )
    expect(await savedBody()).toMatchObject({
      profileType: 'FITTINGS',
      subtype: '',
      handleType: null,
    })
  })

  it('keeps a loaded null subtype as null', async () => {
    GETS['/v1/product/91'] = { ...HANDLE, subtype: null, handleType: null }
    try {
      render('/product/accessories/update/91')
      await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Ручка Roto'))
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
      await waitFor(() => expect(http.put).toHaveBeenCalled())
      expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
        subtype: null,
        handleType: null,
      })
    } finally {
      GETS['/v1/product/91'] = HANDLE
    }
  })

  it('picks a handle from the keyboard with one Tab stop', async () => {
    render('/product/accessories/update/91')
    const handles = await screen.findByRole('radiogroup', { name: 'Ручка' })
    const radios = within(handles).getAllByRole('radio')
    // only the chosen card (Handle3) is in the Tab order
    expect(radios.filter((r) => r.tabIndex === 0).map((r) => r.textContent)).toEqual(['Handle3'])
    radios.find((r) => r.textContent === 'Handle3')!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(within(handles).getByRole('radio', { name: /^Handle5$/ })).toBeChecked()
    expect(within(handles).getByRole('radio', { name: /^Handle5$/ })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(within(handles).getByRole('radio', { name: /^CommercialHandle10$/ })).toBeChecked()
  })
})
