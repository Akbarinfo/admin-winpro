import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { furnitureRoutes } from './index'

// The real furnitureApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const ACCESSORY = {
  id: 9,
  name: 'Roto NT',
  shortName: 'NT',
  handleSide: 2,
  maxHalfPerimeter: 2400,
  maxHeight: 1800,
  maxWidth: 1200,
  maxSash: 100,
  accessoriesType: 'TILT_TURN',
  openingType: 'TILT',
  openingSide: null,
  door: false,
}
const SIDE = { id: 51, hangleSide: 'LEFT_SIDE', hangleSideFunc: 'STANDARD', accessoriesId: 9 }
const SIDE_TOP = {
  id: 52,
  hangleSide: 'TOP_SIDE',
  hangleSideFunc: 'PIVOT_WITH_HINGES',
  accessoriesId: 9,
}
const spec = (id: number, article: string) => ({
  id,
  productId: 300,
  textureId: 5,
  article,
  productName: `Product ${article}`,
  textureName: 'Белый',
  supplierName: 'Roto',
  default: id === 61,
})
const MAIN = spec(61, 'M-1')
const DEPEND = spec(71, 'D-1')
const INNER = spec(81, 'I-1')
const PRODUCTS = [
  { id: 300, name: 'Product M-1' },
  { id: 302, name: 'Petlya' },
]
const page = <T,>(rows: T[]) => ({
  data: { data: rows, recordsTotal: rows.length, recordsFiltered: rows.length },
})

const renderAt = (url: string) => renderWithProviders(<></>, { url, routes: furnitureRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/accessories/table') return page([ACCESSORY, { id: 10, name: 'Siegenia' }])
    if (url === '/v1/accessories/main/specification/table') return page([MAIN])
    if (url === '/v1/accessories/track/specification/table') return page([spec(62, 'T-1')])
    if (url === '/v1/accessories/dependent/specification/table') return page([DEPEND])
    if (url === '/v1/accessories/inner/specification/table') return page([INNER])
    if (url === '/v1/accessories/specification/limit/side/table')
      return page([
        { id: 91, number: 1, minLength: 300, maxLength: 900, minCorner: 90, maxCorner: 90 },
      ])
    if (url === '/v1/accessories/main/specification/parameter/table') return page([])
    if (url === '/v1/accessories/main/specification/copy/to-accessories')
      return { data: { data: { warnings: ['Нет артикула X'] } } }
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/accessories/9') return { data: ACCESSORY }
    if (url === '/v1/accessories/enum/type') return { data: [{ id: 1, name: 'TILT_TURN' }] }
    if (url === '/v1/accessories/enum/openingtype') return { data: [{ id: 1, name: 'TILT' }] }
    if (url === '/v1/accessories/enum/openingside')
      return {
        data: [
          { id: 1, name: 'INWARD' },
          { id: 2, name: 'OUTWARD' },
        ],
      }
    if (url === '/v1/accessories/side/9/list') return { data: [SIDE, SIDE_TOP] }
    if (url === '/v1/accessories/side/enum/hanglesidefunc')
      return {
        data: [
          { id: 1, name: 'STANDARD' },
          { id: 2, name: 'PIVOT' },
          { id: 3, name: 'PIVOT_WITH_HINGES' },
        ],
      }
    if (url === '/v1/accessories/parameter/list/9')
      return { data: [{ id: 41, accessoriesParameterType: 'WEIGHT', value: '80' }] }
    if (url === '/v1/accessories/parameter/enum/type')
      return { data: [{ id: 1, name: 'WEIGHT', type: 'TEXT' }] }
    if (url === '/v1/accessories/main/specification/61') return { data: MAIN }
    if (url === '/v1/accessories/dependent/specification/71') return { data: DEPEND }
    if (url === '/v1/accessories/inner/specification/81') return { data: INNER }
    if (url === '/v1/accessories/specification/limit/side/91')
      return {
        data: { id: 91, number: 1, minLength: 300, maxLength: 900, minCorner: 90, maxCorner: 90 },
      }
    if (url.startsWith('/v1/product/article/product?')) return { data: PRODUCTS }
    if (url.startsWith('/v1/texture/list/by/productId/'))
      return { data: [{ id: 5, name: 'Белый' }] }
    if (url === '/v1/accessories/main/specification/copy/61') return { data: {} }
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
  (await screen.findByRole('heading', { name: title, level: 2 })).closest('section')!

describe('Fittings list', () => {
  it('lists fittings with translated enums and sorts by the old column names', async () => {
    renderAt('/furniture')
    const row = (await screen.findByText('Roto NT')).closest('tr')!
    // the old list showed «Внутрь» when the record had none
    expect(row).toHaveTextContent('Внутрь')
    await userEvent.click(screen.getByRole('button', { name: 'Тип фурнитуры' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenLastCalledWith(
        '/v1/accessories/table',
        expect.objectContaining({ order: [{ column: 'accessoriesType', dir: 'ASC' }] }),
        expect.anything(),
      ),
    )
  })

  it('a row opens its sash and parameters under it; a side’s function saves as it changes', async () => {
    const { router } = renderAt('/furniture')
    await screen.findByText('Roto NT')
    await userEvent.click(
      screen.getByRole('button', { name: 'Показать стороны и параметры: Roto NT' }),
    )
    expect(router.state.location.search).toBe('?accessoryId=9')

    const sides = await panel('Описание сторон')
    expect(
      await within(sides).findByRole('img', {
        name: 'Створка: Левая — стандартное, Верхняя — ось поворота с петлями',
      }),
    ).toBeInTheDocument()
    const params = await panel('Параметры фурнитуры')
    expect(await within(params).findByText('80')).toBeInTheDocument()
    expect(http.get).toHaveBeenCalledWith('/v1/accessories/parameter/list/9', expect.anything())

    const left = within(sides).getByRole('combobox', { name: /Левая/ })
    expect(left).toHaveValue('STANDARD')
    await userEvent.selectOptions(left, 'PIVOT')
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/accessories/side', {
        ...SIDE,
        hangleSideFunc: 'PIVOT',
      }),
    )
    expect(await within(sides).findByText('сохранено')).toBeInTheDocument()

    // closed again: off the URL
    await userEvent.click(
      screen.getByRole('button', { name: 'Скрыть стороны и параметры: Roto NT' }),
    )
    expect(router.state.location.search).toBe('')
  })

  it('adds a fitting parameter with POST under accessoriesId', async () => {
    renderAt('/furniture?accessoryId=9')
    const params = await panel('Параметры фурнитуры')
    await within(params).findByText('80')
    await userEvent.click(within(params).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить параметр' })
    await pick(within(dialog).getByRole('combobox', { name: /Параметр/ }), 'WEIGHT')
    await userEvent.type(within(dialog).getByLabelText(/Значение/), '120')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories/parameter', {
        id: null,
        accessoriesId: 9,
        accessoriesParameterType: 'WEIGHT',
        objectId: null,
        value: '120',
      }),
    )
  })

  it('copies a fitting with POST and deletes it', async () => {
    renderAt('/furniture')
    const row = (await screen.findByText('Roto NT')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    let dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/accessories/copy/9'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/accessories/9'))
  })
})

describe('Fitting form', () => {
  it('creates with POST: empty numbers as null, opening side «Внутрь» by default', async () => {
    renderAt('/furniture/add')
    await screen.findByRole('heading', { name: 'Создать фурнитуру' })
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findByText('Заполните это поле')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/Название/), 'Maco')
    await userEvent.type(screen.getByLabelText(/Макс. высота/), '2000')
    await userEvent.click(screen.getByLabelText('Дверь'))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories', {
        id: null,
        name: 'Maco',
        shortName: '',
        handleSide: null,
        maxHalfPerimeter: null,
        maxHeight: 2000,
        maxWidth: null,
        maxSash: null,
        accessoriesType: null,
        openingType: null,
        openingSide: 'INWARD',
        door: true,
      }),
    )
  })

  it('edits with PUT on /v1/accessories, the URL’s id in the body', async () => {
    renderAt('/furniture/update/9')
    const name = await screen.findByLabelText(/Название/)
    await waitFor(() => expect(name).toHaveValue('Roto NT'))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith(
        '/v1/accessories',
        expect.objectContaining({ id: '9', name: 'Roto NT', openingSide: 'INWARD', handleSide: 2 }),
      ),
    )
  })
})

describe('Fitting specification', () => {
  it('loads the main specification of the fitting; the rest wait for a row', async () => {
    renderAt('/furniture/main/specification/9')
    const main = await panel('Основная спецификация')
    await within(main).findByText('M-1')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/accessories/main/specification/table',
      expect.objectContaining({ filter: { accessoriesId: '9' } }),
      expect.anything(),
    )
    expect(screen.getByText('Выберите строку основной спецификации')).toBeInTheDocument()
    expect(screen.getAllByText('Выберите строку любой спецификации')).toHaveLength(2)
  })

  it('a main row opens its dependent rows, the limits and the parameters', async () => {
    const { router } = renderAt('/furniture/main/specification/9')
    await userEvent.click(await screen.findByText('M-1'))
    expect(router.state.location.search).toBe('?mainId=61&target=main%3A61')
    const depend = await panel('Зависимая спецификация')
    await within(depend).findByText('D-1')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/accessories/dependent/specification/table',
      expect.objectContaining({ filter: { specificationId: 61 } }),
      expect.anything(),
    )
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/accessories/specification/limit/side/table',
        expect.objectContaining({ filter: { dependSpecificationId: 61 }, order: [] }),
        expect.anything(),
      ),
    )
    expect(http.post).toHaveBeenCalledWith(
      '/v1/accessories/main/specification/parameter/table',
      expect.objectContaining({ filter: { accessoriesSpecificationId: 61 } }),
      expect.anything(),
    )

    // a dependent row: its inner rows; limits and parameters follow it
    await userEvent.click(within(depend).getByText('D-1'))
    const inner = await panel('Вложенная спецификация')
    await within(inner).findByText('I-1')
    expect(http.post).toHaveBeenCalledWith(
      '/v1/accessories/inner/specification/table',
      expect.objectContaining({ filter: { specificationId: 71 } }),
      expect.anything(),
    )
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/accessories/specification/limit/side/table',
        expect.objectContaining({ filter: { dependSpecificationId: 71 } }),
        expect.anything(),
      ),
    )
  })

  it('saves a main row with «default», a track row without it', async () => {
    renderAt('/furniture/main/specification/9')
    let main = await panel('Основная спецификация')
    await within(main).findByText('M-1')
    await userEvent.click(within(main).getByRole('button', { name: 'Добавить' }))
    let dialog = await screen.findByRole('dialog', { name: 'Добавить основную спецификацию' })
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Petlya')
    await userEvent.click(within(dialog).getByLabelText('По умолчанию'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories/main/specification', {
        id: null,
        productId: 302,
        accessoriesId: '9',
        default: true,
        textureId: null,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(main).getByRole('button', { name: 'Спецификация направляющей' }))
    main = await panel('Спецификация направляющей')
    await userEvent.click(within(main).getByRole('button', { name: 'Добавить' }))
    dialog = await screen.findByRole('dialog', { name: 'Добавить спецификацию направляющей' })
    expect(within(dialog).queryByLabelText('По умолчанию')).not.toBeInTheDocument()
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Petlya')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories/track/specification', {
        id: null,
        productId: 302,
        accessoriesId: '9',
        default: false,
        textureId: null,
      }),
    )
  })

  it('edits a dependent row with PUT, keeping its texture', async () => {
    renderAt('/furniture/main/specification/9?mainId=61&target=main:61')
    const depend = await panel('Зависимая спецификация')
    const row = (await within(depend).findByText('D-1')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить спецификацию' })
    const texture = await within(dialog).findByRole('combobox', { name: /Цвет/ })
    await waitFor(() => expect(texture).toHaveValue('Белый'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/accessories/dependent/specification', {
        id: 71,
        productId: 300,
        accessoriesSpecificationId: 61,
        accessoriesId: '9',
        textureId: 5,
      }),
    )
  })

  it('adds an inner row under the dependent one', async () => {
    renderAt('/furniture/main/specification/9?mainId=61&dependId=71&target=depend:71')
    const inner = await panel('Вложенная спецификация')
    await within(inner).findByText('I-1')
    await userEvent.click(within(inner).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить вложенную спецификацию' })
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Petlya')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories/inner/specification', {
        id: null,
        productId: 302,
        accessoriesSpecificationId: 71,
        textureId: null,
      }),
    )
  })

  it('saves a side limit under the last chosen row', async () => {
    renderAt('/furniture/main/specification/9?mainId=61&target=main:61')
    const limits = await panel('Ограничения сторон')
    await within(limits).findByText('900')
    await userEvent.click(within(limits).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить ограничение' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(5)
    for (const [label, value] of [
      [/Мин. длина/, '200'],
      [/Макс. длина/, '800'],
      [/Мин. угол/, '45'],
      [/Макс. угол/, '135'],
      [/№/, '2'],
    ] as const)
      await userEvent.type(within(dialog).getByLabelText(label), value)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/accessories/specification/limit/side', {
        id: null,
        minLength: 200,
        maxLength: 800,
        minCorner: 45,
        maxCorner: 135,
        number: 2,
        accessoriesSpecificationId: 61,
      }),
    )
  })

  it('copies a main row with GET, and into another fitting with its warnings', async () => {
    renderAt('/furniture/main/specification/9')
    const main = await panel('Основная спецификация')
    const row = (await within(main).findByText('M-1')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    const confirm = await screen.findByRole('dialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Копировать' }))
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith('/v1/accessories/main/specification/copy/61'),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(
      within(row).getByRole('button', { name: 'Скопировать в другую фурнитуру' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Скопировать в другую фурнитуру' })
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Выберите фурнитуру/ }))
    // the fitting itself isn't offered
    expect(screen.queryByRole('option', { name: /Roto NT/ })).not.toBeInTheDocument()
    await userEvent.click(await screen.findByRole('option', { name: 'Siegenia' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(
        '/v1/accessories/main/specification/copy/to-accessories',
        { specificationId: 61, accessoriesId: 10 },
      ),
    )
    expect(toast.warning).toHaveBeenCalledWith(
      'Некоторые связи не найдены: Нет артикула X',
      expect.anything(),
    )
  })

  it('deleting the chosen main row clears what hung on it', async () => {
    const { router } = renderAt(
      '/furniture/main/specification/9?mainId=61&dependId=71&target=depend:71',
    )
    const main = await panel('Основная спецификация')
    const row = (await within(main).findByText('M-1')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/v1/accessories/main/specification/61'),
    )
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('the track tab shows its own rows, never the main tab’s cached ones', async () => {
    const { router } = renderAt('/furniture/main/specification/9')
    let main = await panel('Основная спецификация')
    await within(main).findByText('M-1')
    await userEvent.click(within(main).getByRole('button', { name: 'Спецификация направляющей' }))
    expect(router.state.location.search).toBe('?tab=track')
    main = await panel('Спецификация направляющей')
    expect(await within(main).findByText('T-1')).toBeInTheDocument()
    expect(within(main).queryByText('M-1')).not.toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/accessories/track/specification/table',
      expect.objectContaining({ filter: { accessoriesId: '9' } }),
      expect.anything(),
    )
  })

  it('edits an inner row and a side limit with PUT', async () => {
    renderAt('/furniture/main/specification/9?mainId=61&dependId=71&target=inner:81')
    const inner = await panel('Вложенная спецификация')
    const row = (await within(inner).findByText('I-1')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    let dialog = await screen.findByRole('dialog', { name: 'Изменить спецификацию' })
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: /Цвет/ })).toHaveValue('Белый'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/accessories/inner/specification', {
        id: 81,
        productId: 300,
        accessoriesSpecificationId: 71,
        textureId: 5,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const limits = await panel('Ограничения сторон')
    const limit = (await within(limits).findByText('900')).closest('tr')!
    await userEvent.click(within(limit).getByRole('button', { name: 'Изменить' }))
    dialog = await screen.findByRole('dialog', { name: 'Изменить ограничение' })
    await waitFor(() => expect(within(dialog).getByLabelText(/Макс. длина/)).toHaveValue('900'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/accessories/specification/limit/side', {
        id: 91,
        minLength: 300,
        maxLength: 900,
        minCorner: 90,
        maxCorner: 90,
        number: 1,
        accessoriesSpecificationId: 81,
      }),
    )
  })

  it('deleting the chosen dependent row drops it and the inner target', async () => {
    const { router } = renderAt(
      '/furniture/main/specification/9?mainId=61&dependId=71&target=inner:81',
    )
    const depend = await panel('Зависимая спецификация')
    const row = (await within(depend).findByText('D-1')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/v1/accessories/dependent/specification/71'),
    )
    await waitFor(() => expect(router.state.location.search).toBe('?mainId=61'))
  })
})
