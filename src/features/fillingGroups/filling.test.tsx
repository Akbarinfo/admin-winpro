import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { fillingRoutes } from './index'

// The real fillingApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const GROUP = { id: 4, name: 'Стеклопакет 32', clearance: 5, outer: true, inner: false }
const SPEC = {
  id: 41,
  thickness: 32,
  productId: 300,
  textureId: 5,
  article: 'SP32',
  productName: 'Стеклопакет',
  textureName: 'Прозрачный',
  supplierName: 'Glass',
}
const PRODUCTS = [
  { id: 300, name: 'Стеклопакет' },
  { id: 302, name: 'Сэндвич' },
]
const page = <T,>(rows: T[]) => ({
  data: { data: rows, recordsTotal: rows.length, recordsFiltered: rows.length },
})

const renderAt = (url: string) => renderWithProviders(<></>, { url, routes: fillingRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/filling/group/table') return page([GROUP])
    if (url === '/v1/filling/specification/group/table') return page([SPEC])
    if (url === '/v1/filling/parameter/table')
      return page([{ id: 61, fillingParameterType: 'GLASS', value: 'GLASS_4' }])
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/filling/group/4') return { data: GROUP }
    if (url === '/v1/filling/specification/group/41') return { data: SPEC }
    if (url.startsWith('/v1/product/article/product?')) return { data: PRODUCTS }
    if (url === '/v1/texture/list/by/productId/300')
      return { data: [{ id: 5, name: 'Прозрачный' }] }
    if (url === '/v1/texture/list/by/productId/302') return { data: [{ id: 6, name: 'Белый' }] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.delete.mockResolvedValue({ data: {} })
})

const pick = async (combobox: HTMLElement, option: string | RegExp) => {
  await userEvent.click(combobox)
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('Filling groups', () => {
  it('lists the groups and sorts by clearance', async () => {
    renderAt('/filling')
    const row = (await screen.findByText('Стеклопакет 32')).closest('tr')!
    expect(within(row).getByText('Внешнее')).toBeInTheDocument()
    expect(within(row).queryByText('Внутреннее')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Зазор, мм' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenLastCalledWith(
        '/v1/filling/group/table',
        expect.objectContaining({ order: [{ column: 'clearance', dir: 'ASC' }] }),
        expect.anything(),
      ),
    )
  })

  it('copies and deletes by id', async () => {
    renderAt('/filling')
    const row = (await screen.findByText('Стеклопакет 32')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Копировать' }))
    let dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Будет создана копия «Стеклопакет 32»')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Копировать' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/filling/group/copy/4'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/filling/group/4'))
  })

  it('creates with POST, name and clearance required', async () => {
    renderAt('/filling/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить заполнение' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Сэндвич 24')
    await userEvent.type(within(dialog).getByLabelText(/Зазор/), '4,5')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    // a whole number, as the old input took
    expect(await within(dialog).findByText('Введите целое число')).toBeInTheDocument()
    await userEvent.clear(within(dialog).getByLabelText(/Зазор/))
    await userEvent.type(within(dialog).getByLabelText(/Зазор/), '4')
    await userEvent.click(within(dialog).getByLabelText('Внутреннее'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/filling/group', {
        id: null,
        name: 'Сэндвич 24',
        clearance: 4,
        outer: false,
        inner: true,
      }),
    )
  })

  it('edits with POST too (as the old page did), the URL’s id in the body', async () => {
    renderAt('/filling/update/4')
    const dialog = await screen.findByRole('dialog', { name: 'Редактировать заполнение' })
    const name = await within(dialog).findByLabelText(/Название/)
    await waitFor(() => expect(name).toHaveValue('Стеклопакет 32'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/filling/group', {
        id: '4',
        name: 'Стеклопакет 32',
        clearance: 5,
        outer: true,
        inner: false,
      }),
    )
    expect(http.put).not.toHaveBeenCalled()
  })
})

describe('A filling group’s specification', () => {
  it('shows the group’s products, and a chosen one’s parameters', async () => {
    const { router } = renderAt('/filling/specification/4')
    expect(await screen.findByText('Стеклопакет 32')).toBeInTheDocument()
    const row = (await screen.findByText('Прозрачный')).closest('tr')!
    expect(http.post).toHaveBeenCalledWith(
      '/v1/filling/specification/group/table',
      expect.objectContaining({ filter: { fillingGroupId: '4' } }),
      expect.anything(),
    )
    expect(screen.getByText('Выберите строку спецификации')).toBeInTheDocument()

    await userEvent.click(row)
    expect(router.state.location.search).toBe('?specId=41')
    // the values are shown through t(), as before
    expect(await screen.findByText('GLASS_4')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v1/filling/parameter/table',
      expect.objectContaining({ filter: { fillingSpecificationId: 41 } }),
      expect.anything(),
    )
  })

  it('adds a product with POST', async () => {
    renderAt('/filling/specification/4')
    await screen.findByText('Прозрачный')
    const panel = screen.getByRole('heading', { name: 'Продукты группы' }).closest('section')!
    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить спецификацию' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    await userEvent.type(within(dialog).getByLabelText(/Толщина/), '24')
    await pick(within(dialog).getByRole('combobox', { name: /Продукт/ }), 'Сэндвич')
    await pick(within(dialog).getByRole('combobox', { name: /Цвет/ }), 'Белый')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/filling/specification/group', {
        id: null,
        thickness: 24,
        productId: 302,
        textureId: 6,
        fillingGroupId: '4',
      }),
    )
  })

  it('edits a product with POST and its id, and deletes one', async () => {
    renderAt('/filling/specification/4')
    const row = (await screen.findByText('Прозрачный')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Изменить спецификацию' })
    const texture = await within(dialog).findByRole('combobox', { name: /Цвет/ })
    await waitFor(() => expect(texture).toHaveValue('Прозрачный'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/filling/specification/group', {
        id: 41,
        thickness: 32,
        productId: 300,
        textureId: 5,
        fillingGroupId: '4',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const confirm = await screen.findByRole('dialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Удалить' }))
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/v1/filling/specification/group/41'),
    )
  })
})
