import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { productRoutes } from './index'

// The real productApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))

const PROFILE = {
  id: 41,
  name: 'Рама 60',
  nameInCatalog: 'Рама 60 кат',
  article: 'AK-6001',
  profileType: 'FRAME',
  productSeriesId: 5,
  unitId: 2,
  supplierId: 3,
  length: 6000,
  width: 60,
  thickness: 2.5,
  sizeB: null,
  sizeN: 20,
  sizeF: null,
  trackCount: 2,
  sashClearance: null,
  comeIn: null,
  articleSpecificWeight: 1.2,
  sectionArea: null,
  momentJx: null,
  momentJy: null,
  usefulPiece: 5800,
  wastePercent: 3,
  isReinforced: true,
  needCuttingOptimization: false,
  isArcProfile: false,
  drawingId: 17,
}

const GETS: Record<string, unknown> = {
  '/v1/product/series/list': [{ id: 5, name: 'Серия 60' }],
  '/v1/unit/list': [{ id: 2, name: 'м' }],
  '/v1/supplier/list': [{ id: 3, name: 'Akfa' }],
  '/v1/product/enum/article/type/PROFILES': [
    { id: 1, name: 'FRAME' },
    { id: 2, name: 'SASH' },
  ],
  '/v1/country/list': [
    { id: 1, name: 'Kazakhstan' },
    { id: 2, name: 'Uzbekistan' },
  ],
  '/v1/product/41': PROFILE,
  '/v1/country-translation/PRODUCT/41': [
    { id: 90, entityType: 'PRODUCT', entityId: 41, countryId: 1, field: 'NAME', value: 'Рама KZ' },
  ],
}

// The page's own fields, not the translation table's «Наименование — Kazakhstan».
const NAME = /^Наименование(?! —)/
const CATALOG = /^Имя в каталоге(?! —)/

/** The JSON part of a multipart body. */
const dataPart = async (body: FormData) => JSON.parse(await (body.get('data') as Blob).text())

const renderForm = (url: string, from?: string) =>
  renderWithProviders(<></>, {
    url: from ? { pathname: url, state: { from } } : url,
    routes: productRoutes,
  })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/product/profile') return { status: 200, data: { id: 77 } }
    if (url === '/v1/product/table')
      return { data: { data: [], recordsTotal: 0, recordsFiltered: 0 } }
    return { status: 200, data: {} }
  })
  http.put.mockResolvedValue({ status: 200, data: { id: 41 } })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Profile form', () => {
  it('creates a profile as multipart, with the old panel fields', async () => {
    const { router } = renderForm('/product/profile/add')
    const name = await screen.findByLabelText(NAME)

    await userEvent.type(name, 'Створка 70')
    await userEvent.type(screen.getByLabelText(CATALOG), 'Створка 70 кат')
    await userEvent.type(screen.getByLabelText(/Артикул/), 'AK-7002')
    await userEvent.click(screen.getByLabelText(/^Тип/))
    await userEvent.click(await screen.findByRole('option', { name: 'Створка' }))
    await userEvent.type(screen.getByLabelText(/^Длина/), '6000')
    await userEvent.type(screen.getByLabelText(/^Ширина/), '70')
    await userEvent.type(screen.getByLabelText(/^Толщина/), '2,5')
    await userEvent.type(screen.getByLabelText(/Зазор створки/), '12')
    await userEvent.click(screen.getByLabelText(/^Поставщик/))
    await userEvent.click(await screen.findByRole('option', { name: 'Akfa' }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/profile', expect.any(FormData)),
    )
    const body = http.post.mock.calls.find(([url]) => url === '/v1/product/profile')![1] as FormData
    expect(await dataPart(body)).toEqual({
      id: null,
      name: 'Створка 70',
      nameInCatalog: 'Створка 70 кат',
      article: 'AK-7002',
      length: 6000,
      width: 70,
      thickness: 2.5,
      sizeB: null,
      sizeF: null,
      sizeN: null,
      comeIn: null,
      articleSpecificWeight: null,
      momentJx: null,
      momentJy: null,
      sectionArea: null,
      drawingId: null,
      productSeriesId: null,
      productSeriesName: '',
      unitId: null,
      unitName: '',
      supplierId: 3,
      supplierName: 'Akfa',
      profileType: 'SASH',
      wastePercent: null,
      usefulPiece: null,
      isArcProfile: false,
      isReinforced: false,
      needCuttingOptimization: true,
      trackCount: null,
      sashClearance: 12,
    })
    expect(body.get('image')).toBe('null')
    // no country was switched on — nothing to send
    expect(http.post).not.toHaveBeenCalledWith('/v1/country-translation/batch', expect.anything())
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/profile'))
  })

  it('edits a profile with PUT and saves its translations after it', async () => {
    const { router } = renderForm('/product/profile/update/41', '/product/profile?profile.size=50')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Рама 60'))
    // FRAME shows the track count, not the sash clearance
    expect(screen.getByLabelText(/Количество направляющих/)).toHaveValue('2')
    expect(screen.queryByLabelText(/Зазор створки/)).not.toBeInTheDocument()

    const translations = screen.getByRole('table')
    const uz = within(translations).getByRole('checkbox', { name: /Uzbekistan/ })
    await userEvent.click(uz)
    // switched on — starts from the profile's own texts
    expect(within(translations).getByLabelText('Наименование — Uzbekistan')).toHaveValue('Рама 60')
    await userEvent.click(within(translations).getByRole('checkbox', { name: /Kazakhstan/ }))

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/profile', expect.any(FormData)),
    )
    const data = await dataPart(http.put.mock.calls[0][1] as FormData)
    expect(data).toMatchObject({
      id: '41',
      profileType: 'FRAME',
      trackCount: 2,
      sashClearance: null,
      drawingId: 17,
      isReinforced: true,
      needCuttingOptimization: false,
      productSeriesName: 'Серия 60',
      unitName: 'м',
    })
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/country-translation/batch', [
        {
          id: null,
          entityType: 'PRODUCT',
          entityId: 41,
          countryId: 2,
          field: 'NAME',
          value: 'Рама 60',
        },
        {
          id: null,
          entityType: 'PRODUCT',
          entityId: 41,
          countryId: 2,
          field: 'NAME_IN_CATALOG',
          value: 'Рама 60 кат',
        },
      ]),
    )
    // Kazakhstan switched off — its saved text is deleted
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/country-translation/90'))
    await waitFor(() => expect(router.state.location.search).toBe('?profile.size=50'))
  })

  it('stays on the form when the backend answers 206', async () => {
    http.put.mockResolvedValue({ status: 206, data: { error: 'Артикул уже занят' } })
    const { router } = renderForm('/product/profile/update/41')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Рама 60'))

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Артикул уже занят'))
    expect(toast.success).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/product/profile/update/41')
  })

  it('requires the main fields and sizes', async () => {
    renderForm('/product/profile/add')
    await screen.findByLabelText(NAME)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findAllByText('Заполните это поле')).toHaveLength(6)
    expect(http.post).not.toHaveBeenCalledWith('/v1/product/profile', expect.anything())
  })

  it('checks the track count of a frame', async () => {
    renderForm('/product/profile/update/41')
    const tracks = await screen.findByLabelText(/Количество направляющих/)
    await userEvent.clear(tracks)
    await userEvent.type(tracks, '12')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Целое число от 1 до 10')).toBeInTheDocument()
    expect(http.put).not.toHaveBeenCalled()
  })

  /** Fills the required fields of a new profile. */
  const fillRequired = async () => {
    await userEvent.type(await screen.findByLabelText(NAME), 'Створка 70')
    await userEvent.type(screen.getByLabelText(CATALOG), 'Створка 70 кат')
    await userEvent.type(screen.getByLabelText(/Артикул/), 'AK-7002')
    await userEvent.type(screen.getByLabelText(/^Длина/), '6000')
    await userEvent.type(screen.getByLabelText(/^Ширина/), '70')
    await userEvent.type(screen.getByLabelText(/^Толщина/), '2')
  }

  it('saves translations of a new profile under the id from the answer, batch before deletions', async () => {
    renderForm('/product/profile/add')
    await fillRequired()
    await userEvent.click(await screen.findByRole('checkbox', { name: /Kazakhstan/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/country-translation/batch',
        expect.arrayContaining([
          expect.objectContaining({ entityId: 77, countryId: 1, field: 'NAME' }),
        ]),
      ),
    )
    const order = (url: string) =>
      http.post.mock.invocationCallOrder[http.post.mock.calls.findIndex(([u]) => u === url)]
    expect(order('/v1/product/profile')).toBeLessThan(order('/v1/country-translation/batch'))
  })

  it('sends deletions after the batch', async () => {
    renderForm('/product/profile/update/41')
    const table = await screen.findByRole('table')
    await userEvent.click(within(table).getByRole('checkbox', { name: /Uzbekistan/ }))
    await userEvent.click(within(table).getByRole('checkbox', { name: /Kazakhstan/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/country-translation/90'))
    const batchCall = http.post.mock.calls.findIndex(([u]) => u === '/v1/country-translation/batch')
    expect(http.post.mock.invocationCallOrder[batchCall]).toBeLessThan(
      http.delete.mock.invocationCallOrder[0],
    )
  })

  it('opens the new profile when its translations fail, so saving again does not duplicate it', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/product/profile') return { status: 200, data: { id: 77 } }
      if (url === '/v1/country-translation/batch') throw new Error('boom')
      return { status: 200, data: {} }
    })
    const { router } = renderForm('/product/profile/add', '/product/profile?profile.size=50')
    await fillRequired()
    await userEvent.click(await screen.findByRole('checkbox', { name: /Kazakhstan/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Запись сохранена, а переводы — нет. Проверьте таблицу переводов и сохраните ещё раз.',
      ),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/profile/update/77'))
    expect(router.state.location.state).toEqual({ from: '/product/profile?profile.size=50' })
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('sends a newly chosen drawing in the image part', async () => {
    renderForm('/product/profile/update/41')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Рама 60'))
    const file = new File(['png'], 'drawing.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText(/Изображение чертежа/), file)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const body = http.put.mock.calls[0][1] as FormData
    expect(body.get('image')).toBeInstanceOf(File)
    expect((body.get('image') as File).name).toBe('drawing.png')
  })

  it('keeps cutting optimization off when the record has none', async () => {
    GETS['/v1/product/41'] = { ...PROFILE, needCuttingOptimization: null, usefulPiece: null }
    try {
      renderForm('/product/profile/update/41')
      await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Рама 60'))
      await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
      await waitFor(() => expect(http.put).toHaveBeenCalled())
      expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
        needCuttingOptimization: false,
        usefulPiece: 0, // as the old form did
      })
    } finally {
      GETS['/v1/product/41'] = PROFILE
    }
  })

  it('imports translations from Excel for a saved profile only', async () => {
    renderForm('/product/profile/update/41')
    await waitFor(() => expect(screen.getByLabelText(NAME)).toHaveValue('Рама 60'))
    await userEvent.click(screen.getByRole('button', { name: 'Импорт из Excel' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.upload(
      within(dialog).getByLabelText('Файл Excel'),
      new File(['x'], 'translations.xlsx'),
    )
    const loads = () =>
      http.get.mock.calls.filter(([u]) => u === '/v1/country-translation/PRODUCT/41').length
    const before = loads()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/product/translation/upload',
        expect.any(FormData),
        expect.anything(),
      ),
    )
    const body = http.post.mock.calls.find(
      ([u]) => u === '/v1/product/translation/upload',
    )![1] as FormData
    expect(body.get('entityType')).toBe('PRODUCT')
    expect(body.get('entityId')).toBe('41')
    await waitFor(() => expect(loads()).toBe(before + 1)) // the table reloads
    // the dialog has no form of its own: uploading doesn't submit (and save) the profile
    expect(http.put).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Файл загружен')
  })

  it('offers no translation import before the profile exists', async () => {
    renderForm('/product/profile/add')
    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Импорт из Excel' })).not.toBeInTheDocument()
  })
})
