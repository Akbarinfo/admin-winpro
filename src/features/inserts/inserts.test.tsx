import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { insertRoutes } from './index'

// The real insertApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const CONSIST = {
  id: 3,
  productId: 300,
  productName: 'Rama',
  article: '6042',
  supplierName: 'Akfa',
  extra: 'kept',
}
const ADDITIONAL = { id: 11, name: 'Штапик', byDefault: true, necessarily: false, consistId: 3 }
const SPEC = {
  id: 41,
  productId: 300,
  textureId: 5,
  article: '6042',
  productName: 'Rama',
  textureName: 'Белый',
  supplierName: 'Akfa',
}
const PRODUCTS = [
  { id: 300, name: 'Rama' },
  { id: 302, name: 'Stvorka' },
]
const page = <T,>(rows: T[]) => ({
  data: { data: rows, recordsTotal: rows.length, recordsFiltered: rows.length },
})

const renderAt = (url: string) => renderWithProviders(<></>, { url, routes: insertRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/consist/table') return page([CONSIST])
    if (url === '/v1/additional/table') return page([ADDITIONAL])
    if (url === '/v1/additional/specification/table') return page([SPEC])
    if (url === '/v1/additional/parameter/table')
      return page([{ id: 61, additionalParameterType: 'WIDTH', value: 'MM_20' }])
    if (url === '/v1/additional/specification/parameter/table')
      return page([{ id: 71, additionalSpecificationType: 'DEPTH', value: 'MM_20' }])
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/consist/3') return { data: CONSIST }
    if (url === '/v1/additional/11') return { data: ADDITIONAL }
    if (url === '/v1/additional/specification/41') return { data: SPEC }
    if (url.startsWith('/v1/product/article/product?')) return { data: PRODUCTS }
    if (url === '/v1/product/article/product/300') return { data: PRODUCTS[0] }
    if (url === '/v1/texture/list/by/productId/300') return { data: [{ id: 5, name: 'Белый' }] }
    if (url === '/v1/texture/list/by/productId/302') return { data: [{ id: 6, name: 'Дуб' }] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

const pick = async (combobox: HTMLElement, option: string | RegExp) => {
  await userEvent.click(combobox)
  await userEvent.click(await screen.findByRole('option', { name: option }))
}
const panel = async (title: string) =>
  (await screen.findByRole('heading', { name: title })).closest('section')!

describe('Inserts list', () => {
  it('lists the products, sorting by the old header names', async () => {
    renderAt('/inserts')
    const row = (await screen.findByText('Rama')).closest('tr')!
    expect(row).toHaveTextContent('6042')
    await userEvent.click(screen.getByRole('button', { name: 'Поставщик' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenLastCalledWith(
        '/v1/consist/table',
        expect.objectContaining({ order: [{ column: 'supplier', dir: 'ASC' }] }),
        expect.anything(),
      ),
    )
  })

  it('copies and deletes by id', async () => {
    renderAt('/inserts')
    const row = (await screen.findByText('Rama')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    let dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/consist/copy/3'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/consist/3'))
  })

  it('creates with POST {productId, productName}', async () => {
    renderAt('/inserts/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить продукт со вставками' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Stvorka')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/consist', {
        productId: 302,
        productName: 'Stvorka',
      }),
    )
  })

  it('edits with PUT, sending the loaded record back with the new product', async () => {
    renderAt('/inserts/update/3')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить продукт' })
    const product = await within(dialog).findByRole('combobox', { name: /Продукт/ })
    await waitFor(() => expect(product).toHaveValue('Rama'))
    await pick(product, 'Stvorka')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/consist', {
        ...CONSIST,
        productId: 302,
        productName: 'Stvorka',
      }),
    )
  })

  it('does not offer an empty form when the record fails to load (it would save a new one)', async () => {
    http.get.mockImplementation(async (url: string) => {
      if (url === '/v1/consist/3') throw new ApiError(404, 'Не найдено')
      if (url.startsWith('/v1/product/article/product?')) return { data: PRODUCTS }
      throw new Error(`unexpected GET ${url}`)
    })
    renderAt('/inserts/update/3')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить продукт' })
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Не удалось загрузить данные.',
    )
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })
})

describe('A product’s inserts page', () => {
  it('shows the inserts, and their parameters once one is chosen', async () => {
    const { router } = renderAt('/inserts/layout/page/3')
    expect(await screen.findByText('6042 - Akfa - Rama')).toBeInTheDocument()
    await screen.findByText('Штапик')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/additional/table',
      expect.objectContaining({ filter: { consistId: '3' } }),
      expect.anything(),
    )
    expect(screen.getAllByText('Выберите вставку')).toHaveLength(2)

    await userEvent.click(screen.getByText('Штапик'))
    expect(router.state.location.search).toBe('?additionalId=11')
    // the insert's parameter values are shown through t(), as before
    expect(await screen.findByText('MM_20')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/additional/parameter/table',
      expect.objectContaining({ filter: { additionalId: 11 } }),
      expect.anything(),
    )
    await screen.findByText('Белый')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/additional/specification/table',
      expect.objectContaining({ filter: { additionalId: 11 } }),
      expect.anything(),
    )
    await userEvent.click(screen.getByText('Белый'))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/additional/specification/parameter/table',
        expect.objectContaining({ filter: { specificationId: 41 } }),
        expect.anything(),
      ),
    )
  })

  it('adds and edits an insert: POST, then PUT with the id, on /v1/additional', async () => {
    renderAt('/inserts/layout/page/3')
    const inserts = await panel('Вставки')
    await within(inserts).findByText('Штапик')
    await userEvent.click(within(inserts).getByRole('button', { name: 'Добавить' }))
    let dialog = await screen.findByRole('dialog', { name: 'Добавить вставку' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Уплотнитель')
    await userEvent.click(within(dialog).getByLabelText('Обязательно'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/additional', {
        id: null,
        name: 'Уплотнитель',
        byDefault: false,
        necessarily: true,
        consistId: '3',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const row = within(inserts).getByText('Штапик').closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    dialog = await screen.findByRole('dialog', { name: 'Изменить вставку' })
    await waitFor(() => expect(within(dialog).getByLabelText(/Название/)).toHaveValue('Штапик'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/additional', {
        id: 11,
        name: 'Штапик',
        byDefault: true,
        necessarily: false,
        consistId: '3',
      }),
    )
  })

  it('copies an insert, and copies it into another product', async () => {
    renderAt('/inserts/layout/page/3')
    const row = (await screen.findByText('Штапик')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    let dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/additional/copy/11'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Скопировать в другой продукт' }))
    dialog = await screen.findByRole('dialog', { name: 'Скопировать в другой продукт' })
    await pick(within(dialog).getByRole('combobox', { name: /Выберите продукт/ }), 'Stvorka')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/additional/copy/to-product', {
        additionalId: 11,
        productId: 302,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith('Вставка успешно скопирована')
  })

  it('shows why a copy into another product failed, in the dialog', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/additional/table') return page([ADDITIONAL])
      if (url === '/v1/additional/copy/to-product')
        throw new ApiError(400, 'У продукта уже есть такая вставка')
      return page([])
    })
    renderAt('/inserts/layout/page/3')
    const row = (await screen.findByText('Штапик')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Скопировать в другой продукт' }))
    const dialog = await screen.findByRole('dialog', { name: 'Скопировать в другой продукт' })
    await pick(within(dialog).getByRole('combobox', { name: /Выберите продукт/ }), 'Rama')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'У продукта уже есть такая вставка',
    )
  })

  it('saves a specification row and copies one', async () => {
    renderAt('/inserts/layout/page/3?additionalId=11')
    const specs = await panel('Спецификация вставки')
    const row = (await within(specs).findByText('Белый')).closest('tr')!
    await userEvent.click(within(specs).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить спецификацию' })
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Stvorka')
    await pick(within(dialog).getByRole('combobox', { name: /Цвет/ }), 'Дуб')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/additional/specification', {
        id: null,
        productId: 302,
        textureId: 6,
        additionalId: 11,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    const confirm = await screen.findByRole('dialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Копировать' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/additional/specification/copy/41'),
    )
  })

  it('edits a specification row with PUT, the id as a number', async () => {
    renderAt('/inserts/layout/page/3?additionalId=11')
    const specs = await panel('Спецификация вставки')
    const row = (await within(specs).findByText('Белый')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить спецификацию' })
    const texture = await within(dialog).findByRole('combobox', { name: /Цвет/ })
    await waitFor(() => expect(texture).toHaveValue('Белый'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/additional/specification', {
        id: 41,
        productId: 300,
        textureId: 5,
        additionalId: 11,
      }),
    )
  })

  it('shows a specification parameter’s value as it is (only insert parameters are translated)', async () => {
    renderAt('/inserts/layout/page/3?additionalId=11&specId=41')
    const params = await panel('Параметры спецификации')
    expect(await within(params).findByText('MM_20')).toBeInTheDocument()
  })

  it('deleting the chosen insert drops it and its specification from the URL', async () => {
    const { router } = renderAt('/inserts/layout/page/3?additionalId=11&specId=41')
    const inserts = await panel('Вставки')
    const row = (await within(inserts).findByText('Штапик')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/additional/11'))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findAllByText('Выберите вставку')).toHaveLength(2)
  })

  it('deletes a specification row by id', async () => {
    renderAt('/inserts/layout/page/3?additionalId=11')
    const specs = await panel('Спецификация вставки')
    const row = (await within(specs).findByText('Белый')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/additional/specification/41'))
  })
})
