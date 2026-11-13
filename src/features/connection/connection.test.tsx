import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { connectionRoutes } from './index'

// The real connectionApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const CONNECTION = {
  id: 7,
  product1: 300,
  product2: 301,
  article1: '6042',
  article2: '6043',
  product1Name: 'Rama',
  product2Name: 'Impost',
}
const TYPE = { id: 21, name: 'Т-образное', priority: 1, connectionTypeIndex: 2, isDefault: true }
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
  { id: 301, name: 'Impost' },
  { id: 302, name: 'Stvorka' },
]
const page = <T,>(rows: T[]) => ({
  data: { data: rows, recordsTotal: rows.length, recordsFiltered: rows.length },
})

const renderAt = (url: string) => renderWithProviders(<></>, { url, routes: connectionRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/connection/table') return page([CONNECTION])
    if (url === '/v1/connection/type/table') return page([TYPE])
    if (url === '/v1/connection/specification/table') return page([SPEC])
    if (url === '/v1/connection/parameter/table')
      return page([
        { id: 61, connectionParameterType: 'ANGLE', value: '45' },
        { id: 62, connectionParameterType: 'PROFILE', value: 'P60', objectId: 9 },
      ])
    if (url === '/v1/connection/specification/parameter/table') return page([])
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/connection/7') return { data: CONNECTION }
    if (url.startsWith('/v1/product/article/product?')) return { data: PRODUCTS }
    if (url === '/v1/connection/type/enum/connection/type') return { data: [{ id: 1 }, { id: 2 }] }
    if (url === '/v1/connection/specification/41') return { data: SPEC }
    if (url === '/v1/texture/list/by/productId/300') return { data: [{ id: 5, name: 'Белый' }] }
    if (url === '/v1/texture/list/by/productId/302') return { data: [{ id: 6, name: 'Дуб' }] }
    if (url === '/v1/connection/parameter/enum/connection/parameter/type')
      return {
        data: [
          { id: 1, name: 'ANGLE', type: 'TEXT' },
          { id: 2, name: 'PROFILE', type: 'SELECT', url: '/v1/profile/list' },
        ],
      }
    if (url === '/v1/profile/list') return { data: [{ id: 9, name: 'P60' }] }
    if (url === '/v1/connection/specification/parameter/enum/specification/type')
      return { data: [{ id: 1, name: 'LENGTH', type: 'TEXT' }] }
    if (url === '/v1/connection/parameter/62')
      return { data: { id: 62, connectionParameterType: 'PROFILE', value: 'P60', objectId: 9 } }
    if (url === '/v1/connection/parameter/61')
      return { data: { id: 61, connectionParameterType: 'ANGLE', value: '45', objectId: null } }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

const pick = async (combobox: HTMLElement, option: string | RegExp) => {
  await userEvent.click(combobox)
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('Connections', () => {
  it('lists connections, sorting the articles by the old header keys', async () => {
    renderAt('/connection')
    const row = (await screen.findByText('Rama-Impost')).closest('tr')!
    expect(row).toHaveTextContent('6042')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/connection/table',
      expect.objectContaining({ order: [{ column: 'id', dir: 'DESC' }], filter: {} }),
      expect.anything(),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Артикул 1' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenLastCalledWith(
        '/v1/connection/table',
        expect.objectContaining({ order: [{ column: 'table.connection.article_1', dir: 'ASC' }] }),
        expect.anything(),
      ),
    )
  })

  it('copies and deletes by id', async () => {
    renderAt('/connection')
    const row = (await screen.findByText('Rama-Impost')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    let dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Будет создана копия «Rama-Impost»')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/connection/copy/7'))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/connection/7'))
  })

  it('creates with POST and both products required', async () => {
    renderAt('/connection/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить соединение' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)

    await pick(within(dialog).getByRole('combobox', { name: /Продукт 1/ }), 'Rama')
    await pick(within(dialog).getByRole('combobox', { name: /Продукт 2/ }), 'Stvorka')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection', {
        id: null,
        product1: 300,
        product2: 302,
      }),
    )
  })

  it('edits with PUT on /v1/connection, the id from the URL', async () => {
    renderAt('/connection/update/7')
    const dialog = await screen.findByRole('dialog', { name: 'Редактировать соединение' })
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: /Продукт 2/ })).toHaveValue('Impost'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/connection', {
        id: '7',
        product1: 300,
        product2: 301,
      }),
    )
  })
})

describe('Connection variants page', () => {
  it('loads the variants of the connection and asks to choose one for the rest', async () => {
    renderAt('/connection/type/7')
    expect(await screen.findByRole('heading', { name: 'Варианты соединения' })).toBeInTheDocument()
    expect(await screen.findByText('Rama-Impost')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К списку соединений' })).toHaveAttribute(
      'href',
      '/connection',
    )
    await screen.findByText('Т-образное')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/connection/type/table',
      expect.objectContaining({ filter: { connectionId: '7' }, length: 10 }),
      expect.anything(),
    )
    expect(screen.getAllByText('Выберите вариант соединения')).toHaveLength(2)
    expect(http.post).not.toHaveBeenCalledWith(
      '/v1/connection/specification/table',
      expect.anything(),
      expect.anything(),
    )
  })

  it('takes the name from the list, or shows the articles when the record has no names', async () => {
    const { router } = renderAt('/connection')
    const row = (await screen.findByText('Rama-Impost')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Варианты соединения' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/connection/type/7'))
    expect(await screen.findByText('Rama-Impost')).toBeInTheDocument()
    expect(http.get).not.toHaveBeenCalledWith('/v1/connection/7', expect.anything())

    http.get.mockImplementation(async (url: string) => {
      if (url === '/v1/connection/8')
        return { data: { id: 8, product1: 1, product2: 2, article1: '6042', article2: '6043' } }
      return { data: [] }
    })
    renderAt('/connection/type/8')
    expect(await screen.findByText('6042 — 6043')).toBeInTheDocument()
  })

  it('adds a variant with its icon', async () => {
    renderAt('/connection/type/7')
    await screen.findByText('Т-образное')
    const panel = screen.getByRole('heading', { name: 'Варианты соединений' }).closest('section')!
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить вариант' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), ' Угловое ')
    await userEvent.type(within(dialog).getByLabelText(/Приоритет/), '3')
    await userEvent.click(await within(dialog).findByRole('radio', { name: 'Иконка 2' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/type', {
        connectionId: '7',
        name: 'Угловое',
        priority: 3,
        connectionTypeIndex: 2,
        isDefault: false,
      }),
    )
  })

  it('choosing a variant shows its specification and parameters', async () => {
    const { router } = renderAt('/connection/type/7')
    await userEvent.click(await screen.findByText('Т-образное'))
    expect(router.state.location.search).toBe('?typeId=21')
    await screen.findByText('Белый')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/connection/specification/table',
      expect.objectContaining({ filter: { connectionTypeId: 21 } }),
      expect.anything(),
    )
    // the variant's parameters: the old filter key «connectionId» carries the variant's id
    expect(await screen.findByText('45')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/connection/parameter/table',
      expect.objectContaining({ filter: { connectionId: 21 } }),
      expect.anything(),
    )

    await userEvent.click(screen.getByText('Белый'))
    expect(router.state.location.search).toBe('?typeId=21&specId=41')
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/connection/specification/parameter/table',
        expect.objectContaining({ filter: { specificationId: 41 } }),
        expect.anything(),
      ),
    )
  })

  it('edits a specification row with PUT, a new product dropping the old texture', async () => {
    renderAt('/connection/type/7?typeId=21')
    const row = (await screen.findByText('Белый')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить спецификацию' })
    const texture = within(dialog).getByRole('combobox', { name: /Цвет/ })
    await waitFor(() => expect(texture).toHaveValue('Белый'))

    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Stvorka')
    await waitFor(() => expect(texture).toHaveValue(''))
    await pick(texture, 'Дуб')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/connection/specification', {
        id: 41,
        productId: 302,
        textureId: 6,
        connectionTypeId: 21,
      }),
    )
  })

  it('adds a SELECT parameter with POST, sending the chosen value and its id', async () => {
    renderAt('/connection/type/7?typeId=21')
    const panel = (await screen.findByRole('heading', { name: 'Параметры варианта' })).closest(
      'section',
    )!
    await within(panel).findByText('45')
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить параметр' })
    await pick(within(dialog).getByRole('combobox', { name: /Параметр/ }), 'PROFILE')
    await pick(await within(dialog).findByRole('combobox', { name: /Значение/ }), 'P60')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/parameter', {
        id: null,
        connectionTypeId: 21,
        connectionParameterType: 'PROFILE',
        objectId: 9,
        value: 'P60',
      }),
    )
  })

  it('edits a TEXT parameter, still with POST and its id in the body', async () => {
    renderAt('/connection/type/7?typeId=21')
    const panel = (await screen.findByRole('heading', { name: 'Параметры варианта' })).closest(
      'section',
    )!
    const row = (await within(panel).findByText('45')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить параметр' })
    const value = await within(dialog).findByLabelText(/Значение/)
    await waitFor(() => expect(value).toHaveValue('45'))
    await userEvent.clear(value)
    await userEvent.type(value, '90')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/parameter', {
        id: 61,
        connectionTypeId: 21,
        connectionParameterType: 'ANGLE',
        objectId: null,
        value: '90',
      }),
    )
  })

  it('adds a specification row with POST', async () => {
    renderAt('/connection/type/7?typeId=21')
    const panel = (await screen.findByRole('heading', { name: 'Спецификация варианта' })).closest(
      'section',
    )!
    await within(panel).findByText('Белый')
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить спецификацию' })
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Rama')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/specification', {
        id: null,
        productId: 300,
        textureId: null,
        connectionTypeId: 21,
      }),
    )
  })

  it('a deleted chosen variant is dropped from the URL, so its panels ask again', async () => {
    const { router } = renderAt('/connection/type/7?typeId=21&specId=41')
    const panel = (await screen.findByRole('heading', { name: 'Варианты соединений' })).closest(
      'section',
    )!
    const row = (await within(panel).findByText('Т-образное')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/connection/type/21'))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findAllByText('Выберите вариант соединения')).toHaveLength(2)
  })

  it('saves a specification parameter under specificationId and specificationType', async () => {
    renderAt('/connection/type/7?typeId=21&specId=41')
    const panel = (await screen.findByRole('heading', { name: 'Параметры спецификации' })).closest(
      'section',
    )!
    await within(panel).findByText('Параметров нет')
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить параметр' })
    // both are required
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(1)

    await pick(within(dialog).getByRole('combobox', { name: /Параметр/ }), 'LENGTH')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText(/Значение/), '600')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/specification/parameter', {
        id: null,
        specificationId: 41,
        specificationType: 'LENGTH',
        objectId: null,
        value: '600',
      }),
    )
  })

  it('opens a SELECT parameter with its value chosen', async () => {
    renderAt('/connection/type/7?typeId=21')
    const panel = (await screen.findByRole('heading', { name: 'Параметры варианта' })).closest(
      'section',
    )!
    const row = (await within(panel).findByText('P60')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить параметр' })
    const value = await within(dialog).findByRole('combobox', { name: /Значение/ })
    await waitFor(() => expect(value).toHaveValue('P60'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/connection/parameter', {
        id: 62,
        connectionTypeId: 21,
        connectionParameterType: 'PROFILE',
        objectId: 9,
        value: 'P60',
      }),
    )
  })
})
