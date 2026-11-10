import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { saveBlob } from '@/shared/lib/download'
import { renderWithProviders } from '@/test/render'
import { productRoutes } from './index'

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
// Files are «saved» by clicking a link; here we only check what would be saved.
vi.mock('@/shared/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/download')>()),
  saveBlob: vi.fn(),
}))
const http = vi.mocked(api)

const GETS: Record<string, unknown> = {
  '/v1/product/series/list': [],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/profile/system/list': [],
  '/v1/product/enum/article/type/PROFILES': [],
}
const xlsx = new File(['x'], 'profiles.xlsx')

const renderList = (url = '/product/profile') =>
  renderWithProviders(<></>, { url, routes: productRoutes })

/** Opens «Импорт» → `item` and uploads a file. */
const importFile = async (item: string) => {
  await userEvent.click(await screen.findByRole('button', { name: 'Импорт' }))
  await userEvent.click(screen.getByRole('menuitem', { name: item }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.upload(within(dialog).getByLabelText('Файл Excel'), xlsx)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))
  return dialog
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
      return { data: { data: [], recordsTotal: 0, recordsFiltered: 0 } }
    if (url.startsWith('/v1/product/excel/')) return { data: new Blob(['excel']) }
    return { data: { isEmpty: true } }
  })
})

describe('Product Excel', () => {
  it('exports the filtered products, without the price-warning filter', async () => {
    renderList('/product/profile?profile.supplierId=3&profile.hasPriceWarning=1')
    await userEvent.click(await screen.findByRole('button', { name: 'Экспорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Товары' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/excel/information',
        {
          filter: {
            searchTxt: null,
            groupType: 'PROFILES',
            type: null,
            supplierId: 3,
            productSeriesId: null,
            profileSystemId: null,
          },
        },
        { responseType: 'blob' },
      ),
    )
    await waitFor(() =>
      expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'profile-products.xlsx'),
    )
  })

  it('exports prices (and has no translations export)', async () => {
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Экспорт' }))
    expect(screen.queryByRole('menuitem', { name: 'Переводы' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Цены' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/excel/price', expect.anything(), {
        responseType: 'blob',
      }),
    )
  })

  it('imports profiles as a «file» part and closes', async () => {
    renderList()
    const dialog = await importFile('Товары')
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/profiles/upload',
        expect.any(FormData),
        expect.objectContaining({ onUploadProgress: expect.any(Function) }),
      ),
    )
    const body = http.post.mock.calls.find(
      ([u]) => u === '/v1/product/profiles/upload',
    )![1] as FormData
    expect(body.get('file')).toBe(xlsx)
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith('Файл загружен')
    // the list is asked again
    await waitFor(() =>
      expect(http.post.mock.calls.filter(([u]) => u === '/v1/product/table').length).toBe(2),
    )
  })

  it('downloads the rows an import skipped', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/product/price/upload')
        return { data: { isEmpty: false, base64: btoa('PK') } }
      return { data: { data: [], recordsTotal: 0, recordsFiltered: 0 } }
    })
    renderList()
    await importFile('Цены')
    await waitFor(() =>
      expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'failed-product.xlsx'),
    )
    expect(toast.warning).toHaveBeenCalledWith('Часть строк не загружена — их список скачан в файл')
  })

  it('downloads the template of the chosen import', async () => {
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: 'Импорт' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Переводы' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Скачать шаблон' }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith('/v1/product/translation/excel/example', {
        responseType: 'blob',
      }),
    )
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'profile-translations-template.xlsx')
  })
})
