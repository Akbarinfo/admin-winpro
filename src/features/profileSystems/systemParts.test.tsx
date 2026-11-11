import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { profileSystemRoutes } from './index'

// The chosen system's tabs: Спецификация and Фурнитура (the old Specification/Accessories layouts).
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const TREE = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Termo 70' },
      { id: 12, name: 'Termo 60' },
    ],
  },
]

const SPEC_ROWS = [
  {
    id: 5,
    priority: 1,
    article: '6042',
    name: '6000 QVT Kosa',
    applicationType: 'FRAME',
    sideType: 'LEFT',
  },
  {
    id: 6,
    priority: 2,
    article: '6041',
    name: '6000 QVT Kanot',
    applicationType: 'SASH',
    sideType: 'RIGHT',
  },
]
const ACC_ROWS = [{ id: 7, accessoryName: 'Fornax', openingType: 'RIGHT', handleType: 'LEFT' }]

const GETS: Record<string, unknown> = {
  '/v1/profile/system/list/tree': TREE,
  '/v1/profile/system/11': { id: 11, name: 'Termo 70' },
  '/v1/profile/system/12': { id: 12, name: 'Termo 60' },
  '/v1/supplier/list': [
    { id: 4, name: 'Akfa' },
    { id: 8, name: 'Engelberg' },
  ],
  '/v1/profile/system/specification/enum/application/type': [
    { name: 'FRAME' },
    { name: 'SASH' },
    { name: 'CONNECTOR' },
  ],
  '/v1/profile/system/specification/enum/side/type': [{ name: 'LEFT' }, { name: 'RIGHT' }],
  '/v1/profile/system/specification/5': {
    id: 5,
    priority: 1,
    productId: 300,
    supplierId: 8,
    applicationType: 'FRAME',
    sideType: 'LEFT',
  },
  // not in the first 200 found: the picker loads it by id
  '/v1/product/article/product/300': { id: 300, name: '6042 Kosa' },
  '/v1/accessories/list': [
    { id: 70, name: 'Fornax' },
    { id: 71, name: 'Akfa' },
  ],
  '/v1/profile/system/accessories/enum/opening/type': [{ name: 'LEFT' }, { name: 'RIGHT' }],
  '/v1/profile/system/accessories/enum/handle/type': [{ name: 'LEFT' }, { name: 'RIGHT' }],
  '/v1/profile/system/accessories/7': {
    id: 7,
    accessoryId: 70,
    openingType: 'RIGHT',
    handleType: 'LEFT',
    productId: 12,
    supplierId: 4,
  },
  '/v1/profile/system/accessories/up/7': {},
}

const page = <T,>(data: T[]) => ({
  data: { data, recordsTotal: data.length, recordsFiltered: data.length },
})

/** The last body POSTed to a table endpoint. */
const lastBody = (url: string) => {
  const calls = http.post.mock.calls.filter(([u]) => u === url)
  return calls[calls.length - 1]?.[1] as Record<string, unknown>
}

const render = (url = '/profile_system?system=11') =>
  renderWithProviders(<></>, { url, routes: profileSystemRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    if (url.startsWith('/v1/product/article/product?')) {
      return { data: [{ id: 301, name: '6043 Urta' }] }
    }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/profile/system/specification/table') return page(SPEC_ROWS)
    if (url === '/v1/profile/system/accessories/table') return page(ACC_ROWS)
    return { data: {} }
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('profile system: Спецификация', () => {
  it('lists the system profiles, with counts on both tabs', async () => {
    render()
    expect(await screen.findByText('6000 QVT Kosa')).toBeInTheDocument()
    expect(screen.getByText('Коробка')).toBeInTheDocument() // FRAME, legacy translation
    expect(screen.getByRole('tab', { name: 'Спецификация 2' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Фурнитура 1' })).toBeInTheDocument()

    // the old panel's bodies: the system (and supplier) in filter; id DESC and updated_date DESC
    expect(lastBody('/v1/profile/system/specification/table')).toMatchObject({
      start: 0,
      length: 10,
      order: [{ column: 'id', dir: 'DESC' }],
      filter: { profileSystemId: 11, supplierId: null },
    })
    expect(lastBody('/v1/profile/system/accessories/table')).toMatchObject({
      order: [{ column: 'updated_date', dir: 'DESC' }],
      filter: { profileSystemId: 11 },
    })
  })

  it('sorts by the old header names and filters by supplier in the URL', async () => {
    const { router } = render()
    await screen.findByText('6000 QVT Kosa')

    await userEvent.click(screen.getByRole('button', { name: /Применение/ }))
    await waitFor(() =>
      expect(lastBody('/v1/profile/system/specification/table')).toMatchObject({
        order: [{ column: 'application', dir: expect.any(String) }],
      }),
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Поставщик' }))
    await userEvent.click(screen.getByRole('option', { name: 'Engelberg' }))
    await waitFor(() =>
      expect(lastBody('/v1/profile/system/specification/table')).toMatchObject({
        filter: { profileSystemId: 11, supplierId: 8 },
      }),
    )
    expect(router.state.location.search).toContain('spec.supplierId=8')
  })

  it('adds a profile under the chosen supplier; a connector offers docking products only', async () => {
    render('/profile_system?system=11&spec.supplierId=4')
    await screen.findByText('6000 QVT Kosa')
    await userEvent.click(screen.getByRole('button', { name: 'Добавить профиль' }))
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('combobox', { name: /Применение/ }))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Соединитель' }))
    expect(
      within(dialog).getByText('Показаны только продукты типа «Стыковочный»'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(http.get).toHaveBeenCalledWith(
        '/v1/product/article/product?page=0&size=200&profileType=DOCKING',
        expect.anything(),
      ),
    )

    await userEvent.type(within(dialog).getByLabelText(/Приоритет/), '3')
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Артикул/ }))
    await userEvent.click(await within(dialog).findByRole('option', { name: '6043 Urta' }))
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Сторона/ }))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Правый' }))
    // the supplier filter is the new row's supplier
    expect(within(dialog).getByRole('combobox', { name: /Поставщик/ })).toHaveValue('Akfa')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/profile/system/specification', {
        priority: 3,
        productId: 301,
        supplierId: 4,
        sideType: 'RIGHT',
        applicationType: 'CONNECTOR',
        profileSystemId: 11,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('edits a profile with its own supplier and product', async () => {
    render()
    await screen.findByText('6000 QVT Kosa')
    await userEvent.click(screen.getAllByRole('button', { name: 'Изменить' })[1]) // [0] — the system
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Редактировать профиль системы' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: /Артикул/ })).toHaveValue('6042 Kosa'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/profile/system/specification/5', {
        priority: 1,
        productId: 300,
        supplierId: 8,
        sideType: 'LEFT',
        applicationType: 'FRAME',
        profileSystemId: 11,
      }),
    )
  })

  it('deletes a profile after confirmation', async () => {
    render()
    await screen.findByText('6000 QVT Kosa')
    await userEvent.click(screen.getAllByRole('button', { name: 'Удалить' })[1]) // [0] — the system
    const dialog = await screen.findByRole('alertdialog').catch(() => screen.findByRole('dialog'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/v1/profile/system/specification/5'),
    )
  })

  it("starts another system's tables from page 1", async () => {
    const { router } = render('/profile_system?system=11&spec.page=2&acc.q=fo&tab=accessories')
    await userEvent.click(await screen.findByRole('treeitem', { name: 'Termo 60' }))
    const params = new URLSearchParams(router.state.location.search)
    expect(Object.fromEntries(params)).toEqual({ system: '12', tab: 'accessories' })
  })
})

describe('profile system: Фурнитура', () => {
  it('moves an accessory up and reloads the list', async () => {
    render('/profile_system?system=11&tab=accessories')
    expect(await screen.findByText('Fornax')).toBeInTheDocument()
    const tables = http.post.mock.calls.length
    await userEvent.click(screen.getByRole('button', { name: 'Поднять выше' }))
    expect(http.get).toHaveBeenCalledWith('/v1/profile/system/accessories/up/7')
    await waitFor(() => expect(http.post.mock.calls.length).toBeGreaterThan(tables))
  })

  it('adds an accessory: no product or supplier, as the old modal sent', async () => {
    render('/profile_system?system=11&tab=accessories')
    await screen.findByText('Fornax')
    await userEvent.click(screen.getByRole('button', { name: 'Добавить фурнитуру' }))
    const dialog = await screen.findByRole('dialog')

    await userEvent.click(within(dialog).getByRole('combobox', { name: /Фурнитура/ }))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Akfa' }))
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Открывание/ }))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Левый' }))
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Ручка/ }))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Правый' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/profile/system/accessories', {
        accessoryId: 71,
        openingType: 'LEFT',
        handleType: 'RIGHT',
        productId: null,
        supplierId: null,
        profileSystemId: 11,
      }),
    )
  })

  it("edits an accessory, sending back the record's product and supplier", async () => {
    render('/profile_system?system=11&tab=accessories')
    await screen.findByText('Fornax')
    await userEvent.click(screen.getAllByRole('button', { name: 'Изменить' })[1])
    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: /Фурнитура/ })).toHaveValue('Fornax'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/profile/system/accessories/7', {
        accessoryId: 70,
        openingType: 'RIGHT',
        handleType: 'LEFT',
        productId: 12,
        supplierId: 4,
        profileSystemId: 11,
      }),
    )
  })
})
